/**
 * Spotify Refresh Token Generator
 * 
 * Run this script to get your Spotify refresh token.
 * No callback URL or web server needed!
 * 
 * Usage:
 *   npx tsx app/scripts/get-spotify-token.ts
 * 
 * Steps:
 *   1. The script will print an authorization URL
 *   2. Open it in your browser & authorize
 *   3. You'll be redirected to a URL - copy the FULL URL from your browser
 *   4. Paste it back into this script
 *   5. The script will output your refresh token
 */

import * as readline from 'readline';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

// We use a simple localhost redirect that doesn't need a running server.
// Spotify will redirect to this URL with the code in the query string.
// The page won't load (no server), but we just need the URL from the address bar.
const REDIRECT_URI = 'https://portfolio-git-spotify-stuff-sdewhitts-projects.vercel.app/api/spotify/callback';

const SCOPES = 'user-read-currently-playing user-read-playback-state';

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    // Try loading from .env.local manually
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.resolve(process.cwd(), '.env.local');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      
      let clientId = CLIENT_ID;
      let clientSecret = CLIENT_SECRET;
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key?.trim() === 'SPOTIFY_CLIENT_ID') clientId = value;
        if (key?.trim() === 'SPOTIFY_CLIENT_SECRET') clientSecret = value;
      }
      
      if (!clientId || !clientSecret) {
        console.error('❌ Could not find SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local');
        console.error('   Make sure they are set in your .env.local file.');
        process.exit(1);
      }
      
      await runAuth(clientId, clientSecret);
    } else {
      console.error('❌ No .env.local file found and no environment variables set.');
      process.exit(1);
    }
  } else {
    await runAuth(CLIENT_ID, CLIENT_SECRET);
  }
}

async function runAuth(clientId: string, clientSecret: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log('\n🎵 Spotify Refresh Token Generator\n');
  console.log('━'.repeat(60));
  console.log('\nStep 1: Open this URL in your browser:\n');

  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;
  console.log(authUrl);
  
  console.log('\nStep 2: Authorize the app in your browser.');
  console.log('\nStep 3: After authorizing, you\'ll be redirected to a URL.');
  console.log('        The page might not load - that\'s fine!');
  console.log('        Just copy the FULL URL from your browser\'s address bar.\n');
  console.log('━'.repeat(60));

  const redirectUrl = await question('\nPaste the full redirect URL here: ');

  // Extract the authorization code from the URL
  let code: string;
  try {
    const url = new URL(redirectUrl.trim());
    code = url.searchParams.get('code') || '';
    
    if (!code) {
      const errorParam = url.searchParams.get('error');
      if (errorParam) {
        console.error(`\n❌ Authorization was denied: ${errorParam}`);
        process.exit(1);
      }
      console.error('\n❌ No authorization code found in the URL.');
      console.error('   Make sure you copied the full URL including the ?code=... part.');
      process.exit(1);
    }
  } catch {
    console.error('\n❌ Invalid URL. Make sure you copied the full URL from the browser.');
    process.exit(1);
  }

  console.log('\n⏳ Exchanging code for tokens...');

  // Exchange the authorization code for tokens (like the tutorial's axios call)
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('\n❌ Token exchange failed:', error);
    console.error('\n   This usually means:');
    console.error('   - The authorization code expired (try again quickly)');
    console.error('   - The redirect URI doesn\'t match what\'s in Spotify Dashboard');
    console.error(`   - Make sure "${REDIRECT_URI}" is added in your Spotify app settings`);
    process.exit(1);
  }

  const tokenData = await tokenResponse.json();

  console.log('\n━'.repeat(60));
  console.log('\n✅ Success! Here is your refresh token:\n');
  console.log(`SPOTIFY_REFRESH_TOKEN=${tokenData.refresh_token}`);
  console.log('\n━'.repeat(60));
  console.log('\nAdd this line to your .env.local file, then restart your dev server.');
  console.log('The SpotifyNowPlaying component will now work!\n');

  rl.close();
}

main().catch(console.error);
