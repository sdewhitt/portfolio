/**
 * Debug endpoint to test direct database queries
 * GET /api/debug-search
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || 'tell me about software engineering experience';

    console.log('Generating embedding for:', query);
    const embedding = await generateEmbedding(query);
    console.log('Embedding generated, length:', embedding.length);
    console.log('First 5 values:', embedding.slice(0, 5));

    // Test 1: Get all rows to verify data exists
    const { data: allRows, error: allError } = await supabase
      .from('content_embeddings')
      .select('slug, title');
    
    console.log('All rows:', allRows?.length);

    // Test 2: Get raw embedding data
    const { data: rawEmbedding, error: rawError } = await supabase
      .from('content_embeddings')
      .select('slug, title, embedding')
      .eq('slug', 'experience-1')
      .single();

    console.log('Raw embedding check:', {
      slug: rawEmbedding?.slug,
      hasEmbedding: !!rawEmbedding?.embedding,
      embeddingType: typeof rawEmbedding?.embedding,
      embeddingIsArray: Array.isArray(rawEmbedding?.embedding),
      embeddingLength: Array.isArray(rawEmbedding?.embedding) ? rawEmbedding.embedding.length : 'not array',
      firstValues: Array.isArray(rawEmbedding?.embedding) ? rawEmbedding.embedding.slice(0, 5) : 'N/A',
    });

    // Test 3: Try match_content with threshold 0
    const { data: matchData, error: matchError } = await supabase.rpc('match_content', {
      query_embedding: embedding,
      match_threshold: 0.0,
      match_count: 10,
    });

    console.log('Match result:', matchData?.length);
    if (matchError) {
      console.error('Match error:', matchError);
    }

    return Response.json({
      query,
      queryEmbedding: {
        length: embedding.length,
        sample: embedding.slice(0, 5),
      },
      allRowsCount: allRows?.length || 0,
      databaseEmbedding: rawEmbedding ? {
        slug: rawEmbedding.slug,
        title: rawEmbedding.title,
        hasEmbedding: !!rawEmbedding.embedding,
        embeddingType: typeof rawEmbedding.embedding,
        isArray: Array.isArray(rawEmbedding.embedding),
        length: Array.isArray(rawEmbedding.embedding) ? rawEmbedding.embedding.length : null,
        sample: Array.isArray(rawEmbedding.embedding) ? rawEmbedding.embedding.slice(0, 5) : null,
      } : null,
      matchCount: matchData?.length || 0,
      matchData: matchData || [],
      matchError: matchError?.message || null,
      rawError: rawError?.message || null,
    });

  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
