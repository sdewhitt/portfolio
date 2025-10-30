/**
 * API endpoint to test Supabase connection and database setup
 * GET /api/test-db
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const results: any = {
    connection: 'unknown',
    tableExists: false,
    hasData: false,
    rowCount: 0,
    functionExists: false,
    sampleData: null,
    errors: [],
  };

  try {
    // Test 1: Check connection
    console.log('Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('content_embeddings')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      results.errors.push(`Connection error: ${connectionError.message}`);
      results.connection = 'failed';
    } else {
      results.connection = 'success';
      results.tableExists = true;
    }

    // Test 2: Count rows
    console.log('Counting rows...');
    const { count, error: countError } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      results.errors.push(`Count error: ${countError.message}`);
    } else {
      results.rowCount = count || 0;
      results.hasData = (count || 0) > 0;
    }

    // Test 3: Get sample data
    if (results.hasData) {
      console.log('Fetching sample data...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('content_embeddings')
        .select('slug, title, created_at')
        .limit(3);

      if (sampleError) {
        results.errors.push(`Sample data error: ${sampleError.message}`);
      } else {
        results.sampleData = sampleData;
      }
    }

    // Test 4: Check if match_content function exists
    console.log('Testing match_content function...');
    const testEmbedding = Array(1536).fill(0); // Dummy embedding
    const { data: funcTest, error: funcError } = await supabase.rpc('match_content', {
      query_embedding: testEmbedding,
      match_threshold: 0.5,
      match_count: 1,
    });

    if (funcError) {
      results.errors.push(`Function error: ${funcError.message}`);
      results.functionExists = false;
    } else {
      results.functionExists = true;
    }

    // Summary
    const allGood = results.connection === 'success' && 
                    results.tableExists && 
                    results.functionExists;

    return Response.json({
      status: allGood ? 'healthy' : 'issues_detected',
      ...results,
      recommendations: generateRecommendations(results),
    });

  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        ...results,
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(results: any): string[] {
  const recommendations: string[] = [];

  if (results.connection !== 'success') {
    recommendations.push('Check your Supabase credentials in .env.local');
  }

  if (!results.tableExists) {
    recommendations.push('Create the content_embeddings table in Supabase');
  }

  if (!results.functionExists) {
    recommendations.push('Create the match_content() function in Supabase (see SQL setup)');
  }

  if (results.hasData === false && results.tableExists) {
    recommendations.push('Database is empty - trigger a sync by sending a chat message');
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operational! 🎉');
  }

  return recommendations;
}
