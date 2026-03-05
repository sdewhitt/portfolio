/**
 * Content synchronization utilities
 * Automatically detect changes and update vector database
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ContentChunk } from '../scripts/content-types';
import { generateEnrichedEmbedding } from './embeddings';
import { batchUpsertContentEmbeddings, ContentEmbedding } from './supabase';
import { findResumePDF, syncPDFToJsonFiles } from './pdf-parser';

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

/** The PDF resume is watched separately (binary file) */
function getWatchedPDFPath(): string | null {
  const pdf = findResumePDF();
  if (pdf) return path.relative(process.cwd(), pdf);
  return null;
}

/**
 * Hash a binary file (e.g. PDF) using MD5 for change detection
 */
function hashBinaryFile(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

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
export function hasContentChanged(): { changed: boolean; changedFiles: string[]; pdfChanged: boolean } {
  const metadata = loadSyncMetadata();
  const changedFiles: string[] = [];
  let pdfChanged = false;

  if (!metadata) {
    return { changed: true, changedFiles: WATCHED_FILES, pdfChanged: true };
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

  // Check PDF resume for changes
  const pdfRelPath = getWatchedPDFPath();
  if (pdfRelPath) {
    const pdfAbsPath = path.join(process.cwd(), pdfRelPath);
    try {
      if (fs.existsSync(pdfAbsPath)) {
        const currentHash = hashBinaryFile(pdfAbsPath);
        const previousHash = metadata.fileHashes[pdfRelPath];
        if (currentHash !== previousHash) {
          changedFiles.push(pdfRelPath);
          pdfChanged = true;
        }
      }
    } catch (error) {
      console.error(`Error checking PDF ${pdfRelPath}:`, error);
      changedFiles.push(pdfRelPath);
      pdfChanged = true;
    }
  }

  return {
    changed: changedFiles.length > 0,
    changedFiles,
    pdfChanged,
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
 * Extract content from career.json
 */
function extractCareerContent(): ContentChunk[] {
  const careerPath = path.join(process.cwd(), 'app/data/career.json');
  
  if (!fs.existsSync(careerPath)) {
    console.warn('career.json not found, skipping extraction');
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(careerPath, 'utf-8'));
    const chunks: ContentChunk[] = [];

    if (data.career && Array.isArray(data.career)) {
      data.career.forEach((job: any, index: number) => {
        const descriptions = Array.isArray(job.description)
          ? job.description.map((d: string) => `- ${d}`).join('\n')
          : job.description || '';

        chunks.push({
          slug: `career-${index}`,
          title: `${job.title} at ${job.name}`,
          content: `
Role: ${job.title}
Company: ${job.name}
Period: ${job.start}${job.end ? ` - ${job.end}` : ' - Present'}
Details:\n${descriptions}
          `.trim(),
          metadata: {
            contentType: 'experience',
            company: job.name,
            position: job.title,
            duration: `${job.start}${job.end ? ` - ${job.end}` : ' - Present'}`,
          }
        });
      });
    }

    return chunks;
  } catch (error) {
    console.error('Error extracting career content:', error);
    return [];
  }
}

/**
 * Extract content from education.json
 */
function extractEducationContent(): ContentChunk[] {
  const educationPath = path.join(process.cwd(), 'app/data/education.json');
  
  if (!fs.existsSync(educationPath)) {
    console.warn('education.json not found, skipping extraction');
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(educationPath, 'utf-8'));
    const chunks: ContentChunk[] = [];

    if (data.education && Array.isArray(data.education)) {
      data.education.forEach((edu: any, index: number) => {
        const descriptions = Array.isArray(edu.description)
          ? edu.description.map((d: string) => `- ${d}`).join('\n')
          : edu.description || '';

        chunks.push({
          slug: `education-${index}`,
          title: `${edu.title} - ${edu.name}`,
          content: `
Degree: ${edu.title}
Institution: ${edu.name}
Period: ${edu.start}${edu.end ? ` - ${edu.end}` : ' - Present'}
Details:\n${descriptions}
          `.trim(),
          metadata: {
            contentType: 'education',
          }
        });
      });
    }

    return chunks;
  } catch (error) {
    console.error('Error extracting education content:', error);
    return [];
  }
}

/**
 * Extract content from projects.ts
 */
function extractProjectsContent(): ContentChunk[] {
  const projectsPath = path.join(process.cwd(), 'app/data/projects.ts');
  
  if (!fs.existsSync(projectsPath)) {
    console.warn('projects.ts not found, skipping extraction');
    return [];
  }

  try {
    const fileContent = fs.readFileSync(projectsPath, 'utf-8');
    const chunks: ContentChunk[] = [];

    // Extract the array contents after "= [" (the projects assignment)
    const arrayMatch = fileContent.match(/=\s*(\[[\s\S]*\])\s*;?\s*(?:export|$)/);
    if (!arrayMatch) {
      console.warn('Could not find projects array in projects.ts');
      return [];
    }

    // Clean up TS-specific syntax to make it JSON-parseable:
    // - Quote unquoted property keys
    // - Remove trailing commas before } or ]
    let jsonString = arrayMatch[1]
      .replace(/(\s)(\w+)\s*:/g, '$1"$2":')
      .replace(/,\s*([\]}])/g, '$1');

    try {
      const projectsArray = JSON.parse(jsonString);
      
      for (const project of projectsArray) {
        if (!project.id || !project.title) continue;
        
        const technologies = Array.isArray(project.tech) ? project.tech : [];

        chunks.push({
          slug: `project-${project.id}`,
          title: `Project: ${project.title}`,
          content: `
Project: ${project.title}
Description: ${project.description || ''}
Technologies: ${technologies.join(', ')}
${project.github ? `GitHub: ${project.github}` : ''}
${project.live ? `Live: ${project.live}` : ''}
          `.trim(),
          metadata: {
            contentType: 'project',
            technologies,
          }
        });
      }
    } catch (parseError) {
      console.error('Error parsing projects array as JSON:', parseError);
    }

    return chunks;
  } catch (error) {
    console.error('Error extracting projects content:', error);
    return [];
  }
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
      const { changed, changedFiles, pdfChanged } = hasContentChanged();
      if (!changed) {
        console.log('Content unchanged, skipping sync');
        return { success: true, chunksProcessed: 0 };
      }
      console.log(`Content changed in: ${changedFiles.join(', ')}`);

      // If the PDF changed, re-parse it into the JSON files first
      if (pdfChanged) {
        console.log('📄 PDF resume changed — re-parsing into JSON files...');
        try {
          await syncPDFToJsonFiles({ merge: true });
          console.log('✓ PDF parsed and JSON files updated');
        } catch (err) {
          console.error('⚠️  PDF parse failed, continuing with existing JSON files:', err);
        }
      }
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

    // Extract content from all sources
    console.log('📄 Extracting content...');
    const chunks: ContentChunk[] = [
      ...extractResumeContent(),
      ...extractCareerContent(),
      ...extractEducationContent(),
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

    if (result.failed === 0) {
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

      // Also hash the PDF resume
      const pdfRelPath = getWatchedPDFPath();
      if (pdfRelPath) {
        const pdfAbsPath = path.join(process.cwd(), pdfRelPath);
        if (fs.existsSync(pdfAbsPath)) {
          newMetadata.fileHashes[pdfRelPath] = hashBinaryFile(pdfAbsPath);
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
