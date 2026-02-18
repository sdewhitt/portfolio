'use client';

import { useEffect, useState } from 'react';
import { Music, Play } from 'lucide-react';

interface PlaybackTrack {
  name: string;
  artist: string;
  album: string;
  image: string | null;
  url: string;
  duration_ms: number;
  progress_ms: number;
}

interface PlaybackData {
  is_playing: boolean;
  track: PlaybackTrack | null;
  error?: string;
}

export function SpotifyNowPlaying() {
  const [playback, setPlayback] = useState<PlaybackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayback = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/spotify/now-playing');
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Failed to fetch Spotify data');
          setPlayback(null);
        } else {
          setPlayback(data);
        }
      } catch (err) {
        setError('Error connecting to Spotify');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayback();
    // Poll every 5 seconds for updated information
    const interval = setInterval(fetchPlayback, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !playback) {
    return (
      <div className="flex items-center justify-center p-6 bg-gradient-to-r from-green-900 to-green-800 rounded-lg">
        <div className="animate-pulse flex items-center space-x-3">
          <Music className="w-5 h-5 text-green-300" />
          <span className="text-sm text-green-300">Loading Spotify...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
        <p className="text-sm text-red-400">⚠️ {error}</p>
      </div>
    );
  }

  if (!playback?.track) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-900 rounded-lg border border-gray-800">
        <div className="flex items-center space-x-3">
          <Music className="w-5 h-5 text-gray-500" />
          <p className="text-sm text-gray-400">Not currently playing</p>
        </div>
      </div>
    );
  }

  const { track, is_playing } = playback;
  const progressPercent = (track.progress_ms / track.duration_ms) * 100;
  const currentTime = formatTime(track.progress_ms);
  const duration = formatTime(track.duration_ms);

  return (
    <a
      href={track.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group relative overflow-hidden rounded-lg bg-gradient-to-br from-green-900 to-green-950 p-4 transition-all hover:from-green-800 hover:to-green-900 border border-green-800"
    >
      <div className="flex gap-4">
        {/* Album Art */}
        <div className="relative flex-shrink-0">
          {track.image ? (
            <img
              src={track.image}
              alt={track.album}
              className="w-20 h-20 rounded-md object-cover shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-md bg-gray-800 flex items-center justify-center">
              <Music className="w-8 h-8 text-gray-500" />
            </div>
          )}

          {/* Play indicator */}
          {is_playing && (
            <div className="absolute inset-0 rounded-md bg-black/30 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-75" />
                <Play className="w-6 h-6 text-white relative fill-white" />
              </div>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-sm group-hover:text-green-200">
                  {track.name}
                </h3>
                <p className="text-xs text-green-200 truncate">{track.artist}</p>
              </div>
              {is_playing && (
                <div className="text-xl flex gap-0.5 flex-shrink-0">
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-300 mt-1 truncate">{track.album}</p>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 space-y-1">
            <div className="w-full bg-green-950 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{currentTime}</span>
              <span>{duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spotify Link */}
      <div className="mt-3 flex items-center gap-2 text-xs text-green-300 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.98-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.169 10.561 18.61 12.84c.361.22.559.698.3 1.2zm.12-3.36C15.24 8.12 8.82 7.84 5.16 9.6c-.6.29-1.359-.061-1.62-.66-.299-.599.061-1.359.66-1.62 4.26-1.9 11.037-1.619 15.186 1.8.5.291.856 1.061.545 1.561-.289.501-1.059.856-1.561.545z" />
        </svg>
        Listen on Spotify
      </div>
    </a>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
