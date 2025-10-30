import {
    Message as VercelChatMessage,
    StreamingTextResponse,
    createStreamDataTransformer
} from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';

import { RunnableSequence } from '@langchain/core/runnables'
import { formatDocumentsAsString } from 'langchain/util/document';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import experience from '@/data/RAG/resume.json';
import { generateEmbedding } from '@/lib/embeddings';
import { searchSimilarContent, rawSearchSimilarContent, hasContentInDatabase } from '@/lib/supabase';
import { syncContentToVectorDB, hasContentChanged, getLastSyncInfo } from '@/lib/content-sync';

export const dynamic = 'force-dynamic'

/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are a helpful assistant that answers questions about Seth DeWhitt's professional experience, skills, and background.
Base your answers ONLY on the provided context from his resume and portfolio.

Guidelines:
- Be professional but conversational
- If asked about specific experience, provide relevant details
- If information isn't in the context, politely state you don't have that specific information
- Highlight relevant achievements and technologies when appropriate
- Suggest related areas of expertise when relevant

==============================
Context: {context}
==============================
Current conversation: {chat_history}

user: {question}
assistant:`;


export async function POST(req: Request) {
    try {
        // Extract the `messages` from the body of the request
        const { messages } = await req.json();

        const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
        const currentMessageContent = messages[messages.length - 1].content;

        // === Auto-sync: Check if content has changed and sync if needed ===
        try {
            const lastSync = getLastSyncInfo();
            const { changed } = hasContentChanged();
            const dbHasContent = await hasContentInDatabase();
            
            // Force sync if: never synced before OR database is empty OR files changed
            const shouldSync = !lastSync || !dbHasContent || changed;
            
            if (shouldSync) {
                if (!lastSync || !dbHasContent) {
                    console.log('🔄 Database empty or first run - initializing content sync...');
                } else {
                    console.log('🔄 Content changes detected, triggering sync...');
                }
                
                const syncResult = await syncContentToVectorDB({ 
                    forceSync: !lastSync || !dbHasContent, // Force if first run or DB empty
                    useAI: false, // Set to true if you want AI enhancement
                    maxChunks: 50 
                });
                
                if (syncResult.success) {
                    console.log(`✓ Synced ${syncResult.chunksProcessed} chunks to Supabase`);
                } else {
                    console.warn('⚠️  Sync failed:', syncResult.error);
                }
            } else {
                console.log(`✓ Content up-to-date (last sync: ${lastSync.lastSync}, ${lastSync.chunkCount} chunks)`);
            }
        } catch (syncError) {
            console.error('❌ Auto-sync error (non-blocking):', syncError);
            // Don't fail the chat request if sync fails
        }

        // === RAG: Get dynamic context from Supabase vector DB ===
        let ragContext = '';
        try {
            console.log('Generating embedding for query:', currentMessageContent.substring(0, 100));
            const queryEmbedding = await generateEmbedding(currentMessageContent);
            console.log('Embedding generated, searching Supabase...');

            // Use raw search (threshold 0 at DB) and apply threshold in app code
            // This avoids ivfflat threshold/recall edge cases and ensures consistent behavior
            const raw = await rawSearchSimilarContent(queryEmbedding, 10);
            const threshold = 0.25;
            const relevantContent = raw
                .filter(item => item.similarity >= threshold)
                .slice(0, 5);
            console.log(`Found ${relevantContent?.length || 0} relevant items after client-side filter (threshold ${threshold})`);

            if (relevantContent && relevantContent.length > 0) {
                // Log similarities for debugging
                console.log('Top similarities:', relevantContent.map(item => item.similarity.toFixed(3)).join(', '));

                ragContext = relevantContent
                    .map((item, idx) => {
                        const metadata = item.metadata || {};
                        let metaInfo = '';
                        if (metadata.company && metadata.position) {
                            metaInfo = ` (${metadata.position} at ${metadata.company})`;
                        } else if (metadata.technologies && metadata.technologies.length > 0) {
                            metaInfo = ` [Technologies: ${metadata.technologies.slice(0, 3).join(', ')}]`;
                        }
                        return `[${idx + 1}] ${item.title}${metaInfo}\n${item.content}\nRelevance: ${(item.similarity * 100).toFixed(1)}%`;
                    })
                    .join('\n\n---\n\n');
                console.log(`✓ Using RAG context (${relevantContent.length} items)`);
            } else {
                console.log('No relevant content found in Supabase (after fallback)');
            }
        } catch (e) {
            console.error('RAG context error:', e);
        }

        // Use RAG context if available, otherwise fallback to static resume.json
        let contextString: string;
        if (ragContext) {
            contextString = ragContext;
        } else {
            const textSplitter = new CharacterTextSplitter();
            const docs = await textSplitter.createDocuments([JSON.stringify(experience)]);
            contextString = formatDocumentsAsString(docs);
            console.log("Unable to retrieve context from supabase; using static context");
        }

        const prompt = PromptTemplate.fromTemplate(TEMPLATE);
        const model = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
            model: 'gpt-3.5-turbo',
            temperature: 0,
            streaming: true,
            verbose: true,
        });
        const parser = new HttpResponseOutputParser();
        const chain = RunnableSequence.from([
            {
                question: (input) => input.question,
                chat_history: (input) => input.chat_history,
                context: () => contextString,
            },
            prompt,
            model,
            parser,
        ]);
        const stream = await chain.stream({
            chat_history: formattedPreviousMessages.join('\n'),
            question: currentMessageContent,
        });
        return new StreamingTextResponse(
            stream.pipeThrough(createStreamDataTransformer()),
        );
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: e.status ?? 500 });
    }
}