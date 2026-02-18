import { NextResponse, NextRequest } from 'next/server';

/**
 * Spotify OAuth Callback Route
 * 
 * This route handles the callback from Spotify's OAuth authorization flow.
 * It exchanges the authorization code for access and refresh tokens.
 * 
 * Setup:
 * 1. Go to Spotify Developer Dashboard: https://developer.spotify.com/dashboard
 * 2. Create an app and get your Client ID and Client Secret
 * 3. Set Redirect URI to: your_domain/api/spotify/callback
 * 4. Visit this URL to authorize: https://accounts.spotify.com/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=user-read-currently-playing&redirect_uri=http://localhost:3000/api/spotify/callback
 * 5. The refresh token will be returned - save it as SPOTIFY_REFRESH_TOKEN in .env.local
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json(
      { error: `Spotify authorization failed: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code received' },
      { status: 400 }
    );
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing Spotify credentials' },
        { status: 500 }
      );
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      );
    }

    const data = await response.json();

    // Return the refresh token that needs to be saved to .env.local
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify Authorization Success</title>
          <style>
            body { font-family: sans-serif; padding: 40px; background: #191414; color: #fff; }
            .container { max-width: 600px; margin: 0 auto; }
            .code-block { background: #282828; padding: 20px; border-radius: 8px; margin: 20px 0; overflow-x: auto; }
            .code { font-family: monospace; word-break: break-all; color: #1db954; }
            h1 { color: #1db954; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Authorization Successful!</h1>
            <p>Your Spotify refresh token has been retrieved. Copy the token below and add it to your <code>.env.local</code> file:</p>
            <div class="code-block">
              <div class="code">SPOTIFY_REFRESH_TOKEN=${data.refresh_token}</div>
            </div>
            <p><strong>Steps:</strong></p>
            <ol>
              <li>Copy the refresh token above</li>
              <li>Add it to your <code>.env.local</code> file</li>
              <li>Restart your Next.js development server</li>
              <li>The SpotifyNowPlaying component will now work</li>
            </ol>
            <p style="margin-top: 40px; color: #b3b3b3; font-size: 14px;">
              <strong>Note:</strong> Keep your refresh token private and never commit it to version control.
            </p>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
