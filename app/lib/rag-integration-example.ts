/**
 * Example integration of Supabase vector search with your chat API
 * Add this to your existing app/api/chat/route.ts
 */

import { generateEmbedding } from '@/app/lib/embeddings';
import { searchSimilarContent } from '@/app/lib/supabase';

/**
 * Get relevant context from vector database for a user query
 */
export async function getRAGContext(userMessage: string): Promise<string> {
  try {
    // Generate embedding for user's message
    const queryEmbedding = await generateEmbedding(userMessage);
    
    // Search for similar content in vector DB
    const relevantContent = await searchSimilarContent(
      queryEmbedding,
      0.7,  // similarity threshold (0-1, higher = more similar)
      3     // number of results to return
    );
    
    // If no relevant content found, return empty string
    if (!relevantContent || relevantContent.length === 0) {
      return '';
    }
    
    // Format content for LLM context
    const context = relevantContent
      .map((item, index) => {
        const metadata = item.metadata || {};
        const contentType = metadata.contentType || 'content';
        
        // Add metadata context if available
        let metaInfo = '';
        if (metadata.company && metadata.position) {
          metaInfo = ` (${metadata.position} at ${metadata.company})`;
        } else if (metadata.technologies && metadata.technologies.length > 0) {
          metaInfo = ` [Technologies: ${metadata.technologies.slice(0, 3).join(', ')}]`;
        }
        
        return `[${index + 1}] ${item.title}${metaInfo}
${item.content}
Relevance: ${(item.similarity * 100).toFixed(1)}%`;
      })
      .join('\n\n---\n\n');
    
    return context;
  } catch (error) {
    console.error('Error getting RAG context:', error);
    return '';
  }
}

/**
 * Example modified chat route handler
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;
    
    // Get relevant context from vector DB
    const ragContext = await getRAGContext(userMessage);
    
    // Build enhanced system message with context
    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for a portfolio website. Answer questions about the person's experience, projects, skills, and background.

${ragContext ? `## Relevant Information

${ragContext}

Use the above information to provide accurate, detailed responses. If the information is not in the context, you can say you don't have that specific information.` : 'Answer based on general knowledge about software development and data science careers.'}

Guidelines:
- Be conversational and friendly
- Provide specific details when available
- If asked about experiences, mention relevant companies and technologies
- For technical questions, be precise and detailed
- If information is not in the context, be honest about it`,
    };
    
    // Continue with your existing AI SDK logic
    // Example with Vercel AI SDK:
    /*
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      stream: true,
    });
    
    return new StreamingTextResponse(response);
    */
    
    // Or with your existing chat logic...
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Error processing request', { status: 500 });
  }
}

/**
 * Alternative: More advanced RAG with filtering
 */
export async function getFilteredRAGContext(
  userMessage: string,
  contentTypes?: string[],
  minSimilarity: number = 0.7
): Promise<{
  context: string;
  sources: Array<{ title: string; type: string; similarity: number }>;
}> {
  try {
    const queryEmbedding = await generateEmbedding(userMessage);
    const relevantContent = await searchSimilarContent(
      queryEmbedding,
      minSimilarity,
      5 // Get more results for filtering
    );
    
    // Filter by content type if specified
    const filtered = contentTypes
      ? relevantContent.filter(item => 
          contentTypes.includes(item.metadata?.contentType || '')
        )
      : relevantContent;
    
    // Build context and sources
    const context = filtered
      .map(item => `${item.title}\n${item.content}`)
      .join('\n\n');
    
    const sources = filtered.map(item => ({
      title: item.title,
      type: item.metadata?.contentType || 'unknown',
      similarity: item.similarity,
    }));
    
    return { context, sources };
  } catch (error) {
    console.error('Error getting filtered RAG context:', error);
    return { context: '', sources: [] };
  }
}

/**
 * Example usage with content type filtering
 */
export async function handleTechnicalQuery(userMessage: string) {
  // Only search in experience and technical content
  const { context, sources } = await getFilteredRAGContext(
    userMessage,
    ['experience', 'experience-technical', 'skills'],
    0.75 // Higher threshold for technical queries
  );
  
  return {
    context,
    sources,
    systemPrompt: `You are answering a technical question. Use this information:

${context}

Provide a detailed technical response with specific examples.`,
  };
}

/**
 * Example usage with project filtering
 */
export async function handleProjectQuery(userMessage: string) {
  const { context, sources } = await getFilteredRAGContext(
    userMessage,
    ['project', 'education'],
    0.7
  );
  
  return {
    context,
    sources,
    systemPrompt: `You are discussing projects and educational work. Use this information:

${context}

Highlight specific projects and their technologies.`,
  };
}
