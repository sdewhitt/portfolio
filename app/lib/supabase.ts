/**
 * Supabase client configuration for vector database operations
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Vector database features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Database types for type safety
 */
export interface ContentEmbedding {
  id?: string;
  slug: string;
  title: string;
  content: string;
  embedding?: number[];
  metadata?: {
    contentType?: string;
    enrichment?: string[];
    technologies?: string[];
    company?: string;
    position?: string;
    duration?: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Content embedding with similarity score (returned by search)
 */
export interface ContentEmbeddingWithSimilarity extends ContentEmbedding {
  similarity: number;
}

/**
 * Search for similar content using vector similarity
 */
export async function searchSimilarContent(
  embedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<ContentEmbeddingWithSimilarity[]> {
  try {
    console.log(`   Searching with threshold ${matchThreshold}, limit ${matchCount}...`);
    
    const { data, error } = await supabase.rpc('match_content', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('   ❌ Supabase search error:', error);
      throw error;
    }
    
    console.log(`   📊 Raw search result: ${data ? data.length : 0} items`);
    if (data && data.length > 0) {
      console.log(`   First item similarity: ${data[0].similarity}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error searching similar content:', error);
    return [];
  }
}

/**
 * Raw search with zero threshold; filter in application code.
 * Useful to avoid DB-level threshold edge cases (>= vs >) and to implement dynamic cutoffs.
 */
export async function rawSearchSimilarContent(
  embedding: number[],
  matchCount: number = 10
): Promise<ContentEmbeddingWithSimilarity[]> {
  try {
    console.log(`   Raw search (threshold 0.0), limit ${matchCount}...`);
    const { data, error } = await supabase.rpc('match_content', {
      query_embedding: embedding,
      match_threshold: 0.0,
      match_count: matchCount,
    });

    if (error) {
      console.error('   ❌ Supabase raw search error:', error);
      throw error;
    }

    console.log(`   📊 Raw search returned: ${data ? data.length : 0} items`);
    return (data || []) as ContentEmbeddingWithSimilarity[];
  } catch (error) {
    console.error('Error in rawSearchSimilarContent:', error);
    return [];
  }
}

/**
 * Insert or update content with embedding
 */
export async function upsertContentEmbedding(
  content: ContentEmbedding
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('content_embeddings')
      .upsert(content, { onConflict: 'slug' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error upserting content:', error);
    return false;
  }
}

/**
 * Batch insert content embeddings
 */
export async function batchUpsertContentEmbeddings(
  contents: ContentEmbedding[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  console.log(`📤 Preparing to upsert ${contents.length} items...`);
  
  // Check first item to verify it has an embedding
  if (contents.length > 0) {
    const firstItem = contents[0];
    console.log(`   First item: "${firstItem.title}"`);
    console.log(`   Has embedding: ${!!firstItem.embedding}`);
    console.log(`   Embedding length: ${firstItem.embedding?.length || 0}`);
  }

  // Split into batches of 100 for better performance
  const batchSize = 100;
  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);

    try {
      const { error, data } = await supabase
        .from('content_embeddings')
        .upsert(batch, { onConflict: 'slug' })
        .select('slug');

      if (error) {
        console.error(`❌ Error upserting batch ${i / batchSize + 1}:`, error);
        console.error(`   Error details:`, error.message, error.details, error.hint);
        failed += batch.length;
      } else {
        success += batch.length;
        console.log(`   ✓ Batch ${i / batchSize + 1} succeeded: ${data?.length || batch.length} items`);
      }
    } catch (error) {
      console.error(`❌ Exception in batch ${i / batchSize + 1}:`, error);
      failed += batch.length;
    }
  }

  return { success, failed };
}

/**
 * Delete content by slug
 */
export async function deleteContentBySlug(slug: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('content_embeddings')
      .delete()
      .eq('slug', slug);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting content:', error);
    return false;
  }
}

/**
 * Get all content embeddings
 */
export async function getAllContentEmbeddings(): Promise<ContentEmbedding[]> {
  try {
    const { data, error } = await supabase
      .from('content_embeddings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching content embeddings:', error);
    return [];
  }
}

/**
 * Check if the database has any content
 */
export async function hasContentInDatabase(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking database content:', error);
    return false;
  }
}
