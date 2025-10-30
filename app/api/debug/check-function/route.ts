/**
 * Check if the match_content function was properly updated
 * GET /api/check-function
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const testQuery = "what did seth do at chewy";
    console.log('Testing with query:', testQuery);
    
    const embedding = await generateEmbedding(testQuery);
    
    // Test with multiple thresholds to see where results appear
    const tests = [
      { threshold: 0.0, label: 'No threshold (0.0)' },
      { threshold: 0.25, label: 'Standard (0.25)' },
      { threshold: 0.35, label: 'Medium (0.35)' },
      { threshold: 0.43, label: 'High (0.43)' },
      { threshold: 0.44, label: 'Very high (0.44)' },
    ];
    
    const results: any[] = [];
    
    for (const test of tests) {
      const { data, error } = await supabase.rpc('match_content', {
        query_embedding: embedding,
        match_threshold: test.threshold,
        match_count: 5,
      });
      
      results.push({
        threshold: test.threshold,
        label: test.label,
        count: data?.length || 0,
        error: error?.message || null,
        topSimilarities: data?.slice(0, 3).map((item: any) => ({
          title: item.title,
          similarity: item.similarity,
        })) || [],
      });
    }
    
    return Response.json({
      query: testQuery,
      embeddingLength: embedding.length,
      tests: results,
      diagnosis: diagnoseIssue(results),
    });
    
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function diagnoseIssue(results: any[]): string[] {
  const diagnosis: string[] = [];
  
  // Check if threshold 0.0 returns results
  const zeroThreshold = results.find(r => r.threshold === 0.0);
  if (zeroThreshold && zeroThreshold.count === 0) {
    diagnosis.push('❌ No results even with 0.0 threshold - embeddings might be NULL');
    return diagnosis;
  }
  
  if (zeroThreshold && zeroThreshold.count > 0) {
    diagnosis.push(`✓ Found ${zeroThreshold.count} items with 0.0 threshold`);
  }
  
  // Check for the > vs >= issue
  const threshold43 = results.find(r => r.threshold === 0.43);
  const threshold44 = results.find(r => r.threshold === 0.44);
  
  if (threshold43 && threshold44) {
    if (threshold43.count > 0 && threshold44.count === 0) {
      diagnosis.push('⚠️  Function might still be using > instead of >= (items at exactly 0.44 are excluded)');
      diagnosis.push('   Run fix-match-function.sql in Supabase to fix this');
    } else if (threshold43.count === threshold44.count) {
      diagnosis.push('✓ Function appears to use >= correctly');
    }
  }
  
  // Check similarity scores
  if (zeroThreshold && zeroThreshold.topSimilarities.length > 0) {
    const topScore = zeroThreshold.topSimilarities[0].similarity;
    diagnosis.push(`Top similarity score: ${topScore.toFixed(4)}`);
    
    if (topScore < 0.3) {
      diagnosis.push('⚠️  Low similarity scores - you may need a lower threshold (try 0.2)');
    } else if (topScore > 0.5) {
      diagnosis.push('✓ Good similarity scores - threshold 0.25-0.4 should work');
    }
  }
  
  return diagnosis;
}
