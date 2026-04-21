"use client";

import Image from "next/image";
import { useState } from "react";

export function Hero() {
  const images = [
    { src: "/Me/Headshot.JPG", alt: "Headshot" },
    { src: "/Me/sax.JPEG", alt: "Playing saxophone" },
    { src: "/Me/skinks.jpg", alt: "Picture of me!" },
    { src: "/Me/JEN.jpg", alt: "Presenting at a Jazz Education Network workshop" },
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <section className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-16 md:items-center mb-20">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
          Seth DeWhitt 🎷
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
          Software Engineer <span className="text-muted-foreground/60">•</span> Jazz Musician <span className="text-muted-foreground/60">•</span> Seattle, WA
        </p>

        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
          If you have any questions about my experience, projects, or skills, start a  <a href="/chat" className="text-foreground font-medium hover:underline">chat</a>!
        </p>

        {/* Social Links */}
        <div className="flex gap-4 pt-2">
          <a
            href="https://github.com/sdewhitt"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-6 h-6 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/seth-dewhitt"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-muted-foreground hover:text-foreground transition-colors"
            aria-label="LinkedIn"
          >
            <svg className="w-6 h-6 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a
            href="mailto:sethjtdewhitt@gmail.com"
            className="group text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Email"
          >
            <svg className="w-6 h-6 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
          <a
            href="/Seth_DeWhitt_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Resume (PDF)"
          >
            <svg className="w-6 h-6 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="flex items-center justify-center md:justify-end animate-fade-in-delay">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative h-64 w-64 md:h-80 md:w-80 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 ring-1 ring-border">
            {/* Images with transition */}
            {images.map((image, index) => (
              <Image
                key={image.src}
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 20rem, 16rem"
                style={{ objectFit: "cover" }}
                priority={index === 0}
                className={`transition-opacity duration-500 ${
                  index === currentImageIndex ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}

            {/* Navigation buttons */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentImageIndex
                      ? "w-4 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
