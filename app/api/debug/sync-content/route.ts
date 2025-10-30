/**
 * API endpoint to manually trigger content synchronization
 * POST /api/sync-content
 * 
 * Optional query params:
 * - force=true: Force sync even if no changes detected
 * - useAI=true: Use AI enhancement (slower, requires OpenAI API key)
 */

import { NextRequest } from 'next/server';
import { syncContentToVectorDB, hasContentChanged, getLastSyncInfo } from '@/lib/content-sync';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceSync = searchParams.get('force') === 'true';
    const useAI = searchParams.get('useAI') === 'true';

    // Check if changes exist (unless forcing)
    if (!forceSync) {
      const { changed, changedFiles } = hasContentChanged();
      if (!changed) {
        const lastSync = getLastSyncInfo();
        return Response.json({
          success: true,
          message: 'Content is already up-to-date',
          lastSync: lastSync?.lastSync || null,
          chunkCount: lastSync?.chunkCount || 0,
        });
      }
      console.log(`Changes detected in: ${changedFiles.join(', ')}`);
    }

    // Perform sync
    const result = await syncContentToVectorDB({
      forceSync,
      useAI,
      maxChunks: 50,
    });

    if (result.success) {
      return Response.json({
        success: true,
        message: `Successfully synced ${result.chunksProcessed} content chunks`,
        chunksProcessed: result.chunksProcessed,
      });
    } else {
      return Response.json(
        {
          success: false,
          error: result.error || 'Unknown error',
          message: 'Failed to sync content',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Sync endpoint error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Internal server error during sync',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const lastSync = getLastSyncInfo();
    const { changed, changedFiles } = hasContentChanged();

    return Response.json({
      lastSync: lastSync?.lastSync || null,
      chunkCount: lastSync?.chunkCount || 0,
      hasChanges: changed,
      changedFiles: changed ? changedFiles : [],
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
