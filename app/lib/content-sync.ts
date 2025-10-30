/**
 * Content synchronization utilities
 * Automatically detect changes and update vector database
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContentChunk } from '../scripts/content-types';
import { generateEnrichedEmbedding } from './embeddings';
import { batchUpsertContentEmbeddings, ContentEmbedding } from './supabase';

interface SyncMetadata {
  lastSync: string;
  fileHashes: Record<string, string>;
  chunkCount: number;
}

const SYNC_METADATA_PATH = path.join(process.cwd(), 'app/data/RAG/.sync-metadata.json');
const WATCHED_FILES = [
  'app/data/career.json',
  'app/data/education.json',
  'app/data/projects.ts',
  'app/data/RAG/resume.json',
];

/**
 * Simple hash function for file content
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Load sync metadata
 */
function loadSyncMetadata(): SyncMetadata | null {
  try {
    if (fs.existsSync(SYNC_METADATA_PATH)) {
      return JSON.parse(fs.readFileSync(SYNC_METADATA_PATH, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading sync metadata:', error);
  }
  return null;
}

/**
 * Save sync metadata
 */
function saveSyncMetadata(metadata: SyncMetadata): void {
  try {
    const dir = path.dirname(SYNC_METADATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SYNC_METADATA_PATH, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error saving sync metadata:', error);
  }
}

/**
 * Check if content files have changed since last sync
 */
export function hasContentChanged(): { changed: boolean; changedFiles: string[] } {
  const metadata = loadSyncMetadata();
  const changedFiles: string[] = [];

  if (!metadata) {
    return { changed: true, changedFiles: WATCHED_FILES };
  }

  for (const file of WATCHED_FILES) {
    const filePath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const currentHash = hashContent(content);
        const previousHash = metadata.fileHashes[file];

        if (currentHash !== previousHash) {
          changedFiles.push(file);
        }
      }
    } catch (error) {
      console.error(`Error checking file ${file}:`, error);
      changedFiles.push(file);
    }
  }

  return {
    changed: changedFiles.length > 0,
    changedFiles
  };
}

/**
 * Extract content from resume.json
 */
function extractResumeContent(): ContentChunk[] {
  const resumePath = path.join(process.cwd(), 'app/data/RAG/resume.json');
  
  if (!fs.existsSync(resumePath)) {
    console.warn('resume.json not found, skipping extraction');
    return [];
  }

  const resume = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));
  const chunks: ContentChunk[] = [];

  // Extract experience chunks
  if (resume.experience && Array.isArray(resume.experience)) {
    resume.experience.forEach((exp: any, index: number) => {
      chunks.push({
        slug: `experience-${index}`,
        title: `${exp.position} at ${exp.company}`,
        content: `
Position: ${exp.position}
Company: ${exp.company}
Duration: ${exp.duration}
Description: ${exp.description || ''}
${exp.achievements ? `Achievements:\n${exp.achievements.map((a: string) => `- ${a}`).join('\n')}` : ''}
        `.trim(),
        metadata: {
          contentType: 'experience',
          company: exp.company,
          position: exp.position,
          technologies: exp.technologies || [],
        }
      });
    });
  }

  // Extract education chunks
  if (resume.education && Array.isArray(resume.education)) {
    resume.education.forEach((edu: any, index: number) => {
      chunks.push({
        slug: `education-${index}`,
        title: `${edu.degree} - ${edu.institution}`,
        content: `
Degree: ${edu.degree}
Institution: ${edu.institution}
Year: ${edu.year}
${edu.details ? `Details: ${edu.details}` : ''}
        `.trim(),
        metadata: {
          contentType: 'education',
        }
      });
    });
  }

  // Extract skills
  if (resume.skills) {
    const skillsContent = Object.entries(resume.skills)
      .map(([category, skills]) => `${category}: ${Array.isArray(skills) ? skills.join(', ') : skills}`)
      .join('\n');
    
    chunks.push({
      slug: 'skills-overview',
      title: 'Technical Skills',
      content: skillsContent,
      metadata: {
        contentType: 'skills',
        technologies: Object.values(resume.skills).flat() as string[],
      }
    });
  }

  return chunks;
}

/**
 * Extract content from projects
 */
function extractProjectsContent(): ContentChunk[] {
  const projectsPath = path.join(process.cwd(), 'app/data/projects.ts');
  
  if (!fs.existsSync(projectsPath)) {
    console.warn('projects.ts not found, skipping extraction');
    return [];
  }

  // For TypeScript files, we'd need to evaluate them or parse statically
  // For now, we'll keep this simple and focus on JSON files
  return [];
}

/**
 * Process content chunk into embedding
 */
async function processContentChunk(chunk: ContentChunk, useAI: boolean = false): Promise<ContentEmbedding> {
  let enrichment: string[] = [];
  
  // For now, skip AI enhancement to avoid complexity
  // Can be added later if needed

  const embedding = await generateEnrichedEmbedding(chunk.content, enrichment);

  return {
    slug: chunk.slug,
    title: chunk.title,
    content: chunk.content,
    embedding,
    metadata: {
      ...chunk.metadata,
      enrichment,
    },
  };
}

/**
 * Sync content to vector database
 */
export async function syncContentToVectorDB(options: { 
  forceSync?: boolean; 
  useAI?: boolean;
  maxChunks?: number;
} = {}): Promise<{ success: boolean; chunksProcessed: number; error?: string }> {
  const { forceSync = false, useAI = false, maxChunks = 50 } = options;

  try {
    // Check if sync is needed
    if (!forceSync) {
      const { changed, changedFiles } = hasContentChanged();
      if (!changed) {
        console.log('Content unchanged, skipping sync');
        return { success: true, chunksProcessed: 0 };
      }
      console.log(`Content changed in: ${changedFiles.join(', ')}`);
    }

    // Verify environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing!');
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
      console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
      return { 
        success: false, 
        chunksProcessed: 0,
        error: 'Supabase credentials not configured'
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key missing!');
      return { 
        success: false, 
        chunksProcessed: 0,
        error: 'OpenAI API key not configured'
      };
    }

    console.log('✓ Environment variables verified');

    // Extract content
    console.log('📄 Extracting content...');
    const chunks: ContentChunk[] = [
      ...extractResumeContent(),
      ...extractProjectsContent(),
    ];

    console.log(`📦 Extracted ${chunks.length} total chunks`);

    if (chunks.length === 0) {
      console.error('❌ No content found to extract!');
      return { 
        success: false, 
        chunksProcessed: 0,
        error: 'No content found to sync'
      };
    }

    // Limit chunks to prevent excessive processing
    const chunksToProcess = chunks.slice(0, maxChunks);
    console.log(`⚙️  Processing ${chunksToProcess.length} chunks (max: ${maxChunks})...`);

    // Process chunks with embeddings
    const contentEmbeddings: ContentEmbedding[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < chunksToProcess.length; i += batchSize) {
      const batch = chunksToProcess.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunksToProcess.length / batchSize)}...`);
      const batchEmbeddings = await Promise.all(
        batch.map(chunk => processContentChunk(chunk, useAI))
      );
      contentEmbeddings.push(...batchEmbeddings);
      console.log(`   ✓ Processed ${contentEmbeddings.length}/${chunksToProcess.length} chunks`);
    }

    // Upload to Supabase
    console.log(`🚀 Uploading ${contentEmbeddings.length} embeddings to Supabase...`);
    const result = await batchUpsertContentEmbeddings(contentEmbeddings);
    console.log(`📊 Upload result: ${result.success} succeeded, ${result.failed} failed`);

    if (result.success) {
      // Update sync metadata
      const newMetadata: SyncMetadata = {
        lastSync: new Date().toISOString(),
        fileHashes: {},
        chunkCount: contentEmbeddings.length,
      };

      for (const file of WATCHED_FILES) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          newMetadata.fileHashes[file] = hashContent(content);
        }
      }

      saveSyncMetadata(newMetadata);
      console.log(`✓ Synced ${contentEmbeddings.length} chunks to vector database`);
      
      return { 
        success: true, 
        chunksProcessed: contentEmbeddings.length 
      };
    } else {
      return { 
        success: false, 
        chunksProcessed: 0,
        error: `Upload failed: ${result.failed} items`
      };
    }

  } catch (error) {
    console.error('Error during content sync:', error);
    return { 
      success: false, 
      chunksProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get last sync information
 */
export function getLastSyncInfo(): { lastSync: string | null; chunkCount: number } | null {
  const metadata = loadSyncMetadata();
  if (!metadata) {
    return null;
  }
  return {
    lastSync: metadata.lastSync,
    chunkCount: metadata.chunkCount,
  };
}
