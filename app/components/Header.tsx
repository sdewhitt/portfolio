"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          Home
        </Link>
        <Link href="/chat" className="text-lg font-semibold">
          Chat
        </Link>

        <nav className="flex gap-4 text-sm">
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
