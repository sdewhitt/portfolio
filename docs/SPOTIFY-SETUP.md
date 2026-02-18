# Spotify Now Playing Setup Guide

This guide will help you set up the Spotify Now Playing component to display what you're currently listening to on your portfolio.

## Files

- `app/api/spotify/now-playing/route.ts` — API endpoint that fetches current playback
- `app/components/SpotifyNowPlaying.tsx` — React component to display now playing info
- `app/scripts/get-spotify-token.ts` — One-time script to get your refresh token

## Prerequisites

You need these in `.env.local`:
- `SPOTIFY_CLIENT_ID` — from Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET` — from Spotify Developer Dashboard
- `SPOTIFY_REFRESH_TOKEN` — generated via the setup script below

## Setup Steps

### 1. Register a Redirect URI in Spotify Dashboard

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Click **Settings** → **Edit Settings**
4. Under **Redirect URIs**, add: `http://localhost:3000/api/spotify/callback`
5. Click **Add**, then **Save**

### 2. Run the Token Script

```bash
npx tsx app/scripts/get-spotify-token.ts
```

The script will:
1. Print an authorization URL — open it in your browser
2. You'll authorize with Spotify, then get redirected
3. The redirected page won't load (that's fine!) — just copy the full URL from your address bar
4. Paste the URL back into the terminal
5. The script outputs your refresh token

### 3. Add to `.env.local`

```env
SPOTIFY_REFRESH_TOKEN=your_token_here
```

### 4. Restart Dev Server

```bash
npm run dev
```

Done! The component will now show your current Spotify playback.

## Using the Component

```tsx
import { SpotifyNowPlaying } from '@/app/components/SpotifyNowPlaying';

export default function Page() {
  return <SpotifyNowPlaying />;
}
```

## How It Works

The API route uses the same pattern as the tutorial's axios calls:

1. **Get token**: `POST` to `accounts.spotify.com/api/token` with `Basic` auth header (base64 of `clientId:clientSecret`) and `grant_type=refresh_token` body
2. **Fetch data**: `GET` from `api.spotify.com/v1/me/player/currently-playing` with `Bearer` token header

The access token is cached in memory and auto-refreshes when it expires.

## Troubleshooting

### "Not currently playing"
- Make sure Spotify is actively playing on your account
- Give it a moment — the component polls every 5 seconds

### Missing credentials error
- Verify all three env vars are in `.env.local`: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`
- Restart the dev server after changing env vars

### Token expired
- Refresh tokens can expire after extended non-use
- Re-run `npx tsx app/scripts/get-spotify-token.ts` to get a new one

### Script says "redirect URI doesn't match"
- Make sure `http://localhost:3000/api/spotify/callback` is registered in your Spotify app's Redirect URIs
- The URI must match **exactly** (no trailing slash, correct protocol)

## Additional Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
