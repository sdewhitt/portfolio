import { NextResponse } from 'next/server';

interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height?: number; width?: number }>;
  };
  external_urls: { spotify: string };
  duration_ms: number;
}

interface SpotifyPlaybackResponse {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
  currently_playing_type: string;
}

interface CachedToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if it's still valid
  if (cachedToken && cachedToken.expires_at > now) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Spotify credentials. Please ensure SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN are set.'
    );
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(refreshToken),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Spotify token refresh failed:', error);
    throw new Error('Failed to refresh Spotify access token');
  }

  const data = await response.json();

  // Cache the token with expiration time (expires_in is in seconds, convert to ms)
  cachedToken = {
    access_token: data.access_token,
    expires_at: now + (data.expires_in - 60) * 1000, // Subtract 60s for buffer
  };

  return data.access_token;
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204 || response.status === 404) {
      // Not currently playing
      return NextResponse.json(
        { is_playing: false, item: null },
        { status: 200 }
      );
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data: SpotifyPlaybackResponse = await response.json();

    // Extract relevant information
    const playbackInfo = {
      is_playing: data.is_playing,
      track: data.item
        ? {
            name: data.item.name,
            artist: data.item.artists.map((a) => a.name).join(', '),
            album: data.item.album.name,
            image: data.item.album.images[0]?.url || null,
            url: data.item.external_urls.spotify,
            duration_ms: data.item.duration_ms,
            progress_ms: data.progress_ms,
          }
        : null,
    };

    return NextResponse.json(playbackInfo, {
      headers: {
        'Cache-Control': 'public, max-age=10', // Cache for 10 seconds
      },
    });
  } catch (error) {
    console.error('Error fetching Spotify playback:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch playback information',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
