import { NextResponse } from 'next/server';

/**
 * Spotify Authorization URL Generator with Debug Info
 * This endpoint generates the correct authorization URL with proper URL encoding
 */
export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'SPOTIFY_CLIENT_ID not set in environment variables' },
      { status: 500 }
    );
  }

  // The redirect URI you registered in Spotify Dashboard
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 
    'https://portfolio-git-spotify-stuff-sdewhitts-projects.vercel.app/api/spotify/callback';

  // Build the authorization URL properly with URL encoding
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'user-read-currently-playing',
    redirect_uri: redirectUri,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Spotify Authorization - Debug Info</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #191414; color: #fff; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #1db954; }
          .section { background: #282828; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .section h2 { color: #1db954; margin-top: 0; }
          .code-block { background: #192734; padding: 15px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; line-height: 1.6; margin: 10px 0; border-left: 4px solid #1db954; }
          .button { 
            display: inline-block;
            padding: 12px 24px;
            background: #1db954;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 10px 0;
            transition: background 0.3s;
          }
          .button:hover { background: #1ed760; }
          .warning { background: #ff6b6b; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .info { background: #1db954; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .copy-btn { 
            background: #1db954; 
            border: none; 
            color: white; 
            padding: 8px 12px; 
            border-radius: 4px; 
            cursor: pointer;
            font-size: 12px;
            margin-left: 10px;
          }
          .copy-btn:hover { background: #1ed760; }
          ol { line-height: 1.8; }
          .label { color: #b3b3b3; font-size: 12px; font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎵 Spotify Authorization - Debug Info</h1>
          
          <div class="section">
            <h2>📋 Registered Redirect URI</h2>
            <p>This is what you registered in Spotify Developer Dashboard:</p>
            <div class="code-block">${redirectUri}</div>
            <p style="font-size: 12px; color: #b3b3b3;">If this is incorrect, edit your .env.local file and add:<br><code>SPOTIFY_REDIRECT_URI=your_correct_uri_here</code></p>
          </div>

          <div class="info">
            <strong>✓ Authorization URL is properly generated with URL encoding</strong><br>
            Click the button below or copy the URL manually.
          </div>

          <div class="section">
            <h2>🔗 Authorization URL</h2>
            <p>This URL has been properly URL-encoded:</p>
            <div class="code-block" id="authUrl">${authUrl}</div>
            <button onclick="copyToClipboard('authUrl')" class="copy-btn">Copy URL</button>
            
            <p style="margin-top: 20px;">
              <a href="${authUrl}" class="button">Authorize with Spotify</a>
            </p>
          </div>

          <div class="section">
            <h2>⚙️ Troubleshooting</h2>
            <p>If you still get "INVALID_CLIENT: Invalid redirect URI":</p>
            <ol>
              <li><strong>Exact Match Required:</strong> The redirect URI must match <strong>exactly</strong> (including protocol, domain, path, and trailing slash)</li>
              <li><strong>Check Dashboard:</strong> Go to your Spotify app in Developer Dashboard and verify the registered URI matches above</li>
              <li><strong>Trailing Slash:</strong> Try with and without trailing slash:
                <div class="code-block" style="margin: 10px 0;">${redirectUri}/</div>
              </li>
              <li><strong>Protocol:</strong> Make sure it's <strong>https</strong> (not http) for production</li>
              <li><strong>Whitespace:</strong> Check for any hidden spaces or newlines in your registered URI</li>
            </ol>
          </div>

          <div class="section">
            <h2>🔍 Debug: Query Parameters</h2>
            <p>These are the parameters being sent to Spotify:</p>
            <ul style="font-family: monospace; font-size: 12px; line-height: 1.8;">
              <li><strong>response_type:</strong> code</li>
              <li><strong>client_id:</strong> ${clientId}</li>
              <li><strong>scope:</strong> user-read-currently-playing</li>
              <li><strong>redirect_uri:</strong> ${redirectUri}</li>
            </ul>
          </div>

          <div class="warning">
            <strong>⚠️ Common Issues:</strong>
            <ul>
              <li>Make sure you saved your changes in Spotify Dashboard (green Save button)</li>
              <li>The redirect URI is case-sensitive for the path portion</li>
              <li>Some browsers cache old requests - try a private/incognito window</li>
              <li>If using a Vercel preview URL, it must also be registered in Spotify settings</li>
            </ul>
          </div>
        </div>

        <script>
          function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent;
            navigator.clipboard.writeText(text).then(() => {
              alert('URL copied to clipboard!');
            }).catch(() => {
              alert('Failed to copy. Please copy manually.');
            });
          }
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
