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
