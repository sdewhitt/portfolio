import { NextResponse } from 'next/server';

/**
 * Spotify Now Playing API Route
 * 
 * Uses the same auth pattern as the tutorial's axios calls:
 *   1. POST to accounts.spotify.com/api/token with Basic auth + credentials
 *   2. GET from api.spotify.com with the Bearer token
 * 
 * Since we need user-scoped data (currently playing), we use a refresh_token
 * grant instead of client_credentials.
 
*/

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

// In-memory cache for the access token and (optionally rotated) refresh token
let cachedToken: { access_token: string; expires_at: number } | null = null;
let cachedRefreshToken: string | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  // Use rotated refresh token if Spotify issued a new one, otherwise fall back to env
  const refreshToken = cachedRefreshToken ?? process.env.SPOTIFY_REFRESH_TOKEN!;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, or SPOTIFY_REFRESH_TOKEN');
  }

  // Authorization Code flow: Basic auth header (base64 clientId:clientSecret) + form body
  // https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spotify token error:', errorText);
    throw new Error('Failed to get Spotify access token');
  }

  const data = await response.json();

  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  // Spotify may rotate the refresh token — store it if a new one was returned
  if (data.refresh_token) {
    cachedRefreshToken = data.refresh_token;
  }

  return data.access_token;
}

export async function GET() {
  try {
    const token = await getAccessToken();

    // Same pattern as the tutorial: Bearer token in Authorization header
    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // 204 = nothing playing, 200 = playing
    if (response.status === 204 || response.status === 404) {
      return NextResponse.json({ is_playing: false, track: null });
    }

    if (!response.ok) {
      throw new Error(`Spotify API returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      is_playing: data.is_playing,
      track: data.item ? {
        name: data.item.name,
        artist: data.item.artists.map((a: { name: string }) => a.name).join(', '),
        album: data.item.album.name,
        image: data.item.album.images?.[0]?.url ?? null,
        url: data.item.external_urls.spotify,
        duration_ms: data.item.duration_ms,
        progress_ms: data.progress_ms,
      } : null,
    });
  } catch (error) {
    console.error('Spotify now-playing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
