'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TRACK_IDS = [
  "6B75WGGugFzGfyVWSF38Q1", // so real
  "6ohPUY7p09Xfx2JMfX0r5t", // Duke Ellington's Sound of Love
  "02tNuntKQsoou5T4O8meyh", // Hana
  "4xBGYIZndfEI1puWGcyfo9", // How I Know
  "0gX6wbxOBdh3MCN3pOaTkb", // When I Was a Child
  "1HCscV7IBGyxnaPh2jShMP", // Raye
  "0loJyuSFr6vVPBQSmLLrrQ", // How Deep Is Your Love
  "4YT2Sp08acVJeA1bniNTxv", // Blues on Sunday
  "7wtV0XXq3xxXcxdVNYe1wB", // Galactic Funk
  "46kh51xDfr4xyKgUnnGmQU", // Here, There and Everywhere
  "2JUQ7mV1AHk2owXLydmN4Z", // Love's Train
  "3vxvz0JoRDvnx2jG9oPljA", // Love You Anyway
  "3TnqliDSJY2iWjL6F38ocE", // Moment's Notice
  "2EfF2WqwQxSTbfu0c24ZJa", // Ooooo
  "4TYMwYxRfhcqWfxe7zbThu", // Magic Alive
  "0Nl0zIgbfgzXwxVf0lndc3", // Sevilla Breeze
];

const CARD_WIDTH = 280;
// Distance from center for each slot (dist 1 = adjacent, dist 2 = outer)
const CARD_OFFSET: Record<number, number> = {
  1: 295, // adjacent cards
  2: 530, // outer cards — tightened to reduce the gap
};

/** Signed circular distance from `center` to index `i`. */
function circularDist(i: number, center: number, total: number): number {
  const raw = ((i - center) % total + total) % total;
  return raw > total / 2 ? raw - total : raw;
}

function slotStyle(dist: number): { scale: number; opacity: number } {
  const abs = Math.abs(dist);
  if (abs === 0) return { scale: 1.15, opacity: 1 };
  if (abs === 1) return { scale: 0.88, opacity: 0.6 };
  if (abs === 2) return { scale: 0.72, opacity: 0.35 };
  return { scale: 0.6, opacity: 0 };
}

export function SpotifyPlayer() {
  const [center, setCenter] = useState(0);
  const total = TRACK_IDS.length;

  const prev = useCallback(() => setCenter((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setCenter((i) => (i + 1) % total), [total]);

  return (
    <section id="spotify" className="scroll-mt-20 mt-16">
      <div className="mb-10 space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold">Current Favorite Songs</h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          My sugar, spice, and everything nice
        </p>
      </div>

      <div className="relative flex items-center">
        {/* Prev button */}
        <button
          onClick={prev}
          aria-label="Previous track"
          className="z-10 flex-none p-2 mr-3 rounded-full border border-border bg-background hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Carousel — fixed height, iframes always mounted to avoid remount lag */}
        <div className="relative flex-1 overflow-hidden" style={{ height: '210px' }}>
          {TRACK_IDS.map((id, i) => {
            const dist = circularDist(i, center, total);
            const abs = Math.abs(dist);
            const visible = abs <= 2;
            const { scale, opacity } = slotStyle(dist);
            const sign = dist < 0 ? -1 : dist > 0 ? 1 : 0;
            const translateX = sign * (CARD_OFFSET[abs] ?? 0);

            return (
              <div
                key={id}
                onClick={() => abs > 0 ? setCenter(i) : undefined}
                className={abs > 0 ? 'cursor-pointer' : ''}
                style={{
                  position: 'absolute',
                  width: CARD_WIDTH,
                  top: '50%',
                  left: '50%',
                  transform: `translateX(calc(-50% + ${translateX}px)) translateY(-50%) scale(${scale})`,
                  opacity: visible ? opacity : 0,
                  pointerEvents: visible ? 'auto' : 'none',
                  transition: 'transform 300ms ease, opacity 300ms ease',
                  willChange: 'transform, opacity',
                  zIndex: 10 - abs,
                }}
              >
                <iframe
                  style={{
                    borderRadius: '12px',
                    display: 'block',
                    pointerEvents: abs === 0 ? 'auto' : 'none',
                  }}
                  src={`https://open.spotify.com/embed/track/${id}?utm_source=generator`}
                  width="100%"
                  height={152}
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={next}
          aria-label="Next track"
          className="z-10 flex-none p-2 ml-3 rounded-full border border-border bg-background hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {TRACK_IDS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCenter(i)}
            aria-label={`Go to track ${i + 1}`}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === center ? 'bg-foreground scale-125' : 'bg-muted-foreground/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

export default SpotifyPlayer;
