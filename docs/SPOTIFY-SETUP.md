# Spotify Now Playing Setup Guide

This guide will help you set up the Spotify Now Playing component to display what you're currently listening to on your portfolio.

## Files Created

- `app/api/spotify/now-playing/route.ts` - API endpoint that fetches current playback info
- `app/api/spotify/callback/route.ts` - OAuth callback handler for Spotify authentication
- `app/components/SpotifyNowPlaying.tsx` - React component to display the now playing info

## Prerequisites

You already have your Spotify credentials in `.env.local`:
- `SPOTIFY_CLIENT_ID` ✓
- `SPOTIFY_CLIENT_SECRET` ✓

You still need:
- `SPOTIFY_REFRESH_TOKEN` - We'll get this in the next steps

## Setup Steps

### 1. Get Your Refresh Token

Visit this URL in your browser, replacing `YOUR_CLIENT_ID` with your actual Client ID:

```
https://accounts.spotify.com/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=user-read-currently-playing&redirect_uri=http://localhost:3000/api/spotify/callback
```

**Note:** If you're deploying to a production domain, replace `http://localhost:3000` with your actual domain.

### 2. Authorize the App

When you visit the URL above:
1. You'll be redirected to Spotify's login page
2. Log in with your Spotify account
3. Grant permission to read your currently playing track
4. You'll be redirected back to your app with the authorization code

### 3. Save the Refresh Token

After authorization, you'll see a page displaying your refresh token. Copy the token and add it to your `.env.local` file:

```env
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

### 4. Restart Your Dev Server

Restart your Next.js development server to pick up the new environment variable.

## Using the Component

Import and use the component in any page or layout:

```tsx
import { SpotifyNowPlaying } from '@/app/components/SpotifyNowPlaying';

export default function Home() {
  return (
    <div>
      <SpotifyNowPlaying />
    </div>
  );
}
```

## Component Features

- **Live Updates**: Refreshes every 5 seconds to show current track
- **Album Art**: Displays the album cover image
- **Progress Bar**: Shows how far through the track you are
- **Play Status**: Visual indicator when music is playing
- **Direct Link**: Click to listen on Spotify
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: Graceful fallback if Spotify API is unavailable
- **Caching**: Server-side caching for 10 seconds to reduce API calls

## Customization

### Styling

The component uses Tailwind CSS and is styled with Spotify's green theme. Edit the component file to customize colors and layout.

### Update Frequency

To change how often the component checks for updates, modify the interval in `SpotifyNowPlaying.tsx`:

```tsx
const interval = setInterval(fetchPlayback, 5000); // Change 5000 to desired milliseconds
```

### Status Messages

You can customize the messages shown when not playing, error states, or loading states in the component.

## Troubleshooting

### "Not currently playing" message

- Make sure Spotify is playing on your account
- Check that you're logged into the correct Spotify account
- Give it a moment to update (refreshes every 5 seconds)

### API Error: Missing Spotify credentials

- Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are in `.env.local`
- Verify `SPOTIFY_REFRESH_TOKEN` is in `.env.local`
- Restart your dev server after adding/modifying env variables

### Token expired error

- Refresh tokens can expire if not used for 6 months
- If you get a token refresh error, repeat the authorization flow to get a new refresh token

### CORS or Authorization errors

- Make sure you're using the exact redirect URI you registered in Spotify Developer Dashboard
- If deploying, update the redirect URI to your production domain in both Spotify Dashboard and (optionally) as `SPOTIFY_REDIRECT_URI` env var

## API Reference

### GET `/api/spotify/now-playing`

Returns current playback information.

**Response (currently playing):**
```json
{
  "is_playing": true,
  "track": {
    "name": "Song Name",
    "artist": "Artist Name",
    "album": "Album Name",
    "image": "https://...",
    "url": "https://open.spotify.com/track/...",
    "duration_ms": 240000,
    "progress_ms": 120000
  }
}
```

**Response (not playing):**
```json
{
  "is_playing": false,
  "track": null
}
```

## Security Notes

- ✅ The refresh token is kept server-side only
- ✅ API keys are never exposed to the client
- ✅ Access tokens are cached and automatically refreshed
- ⚠️ Never commit `.env.local` to version control
- ⚠️ Never share your refresh token publicly

## Additional Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- [Currently Playing Endpoint](https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track)
