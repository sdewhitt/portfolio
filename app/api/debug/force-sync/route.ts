/**
 * Force sync endpoint - bypasses all checks
 * POST /api/force-sync
 */

import { NextRequest } from 'next/server';
import { syncContentToVectorDB } from '@/lib/content-sync';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('🔥 FORCE SYNC TRIGGERED');
    
    const result = await syncContentToVectorDB({
      forceSync: true,
      useAI: false,
      maxChunks: 50,
    });

    return Response.json({
      success: result.success,
      chunksProcessed: result.chunksProcessed,
      error: result.error,
      message: result.success 
        ? `Force sync completed: ${result.chunksProcessed} chunks processed`
        : `Force sync failed: ${result.error}`,
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
