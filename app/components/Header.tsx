"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold hover:text-muted-foreground transition-colors">
            Home
          </Link>
          <Link 
            href="/chat" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </Link>
        </div>

        <nav className="flex gap-6 text-sm font-medium">
          <a href="#projects" className="hover:underline">
            Projects
          </a>
          <a href="#about" className="hover:underline">
            About
          </a>
          <a href="mailto:sethjtdewhitt@gmail.com" className="hover:underline">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
