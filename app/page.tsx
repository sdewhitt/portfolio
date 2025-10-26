"use client";

import Image from "next/image";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "./data/projects";

export default function Home() {
  return (
    <div className="bg-background text-foreground font-sans">
      <main className="container mx-auto px-6 py-16">
        <section className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Your Name
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              I am a software engineer focused on building accessible, performant,
              and delightful web applications. I enjoy working on front-end
              architecture, TypeScript, and design systems.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#projects"
                className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                View Projects
              </a>
              <a
                href="mailto:your.email@example.com"
                className="inline-flex items-center rounded-full border border-solid border-foreground px-4 py-2 text-sm font-medium"
              >
                Contact Me
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Image
                src="/profile-placeholder.png"
                alt="Profile"
                fill
                sizes="(min-width: 768px) 48rem, 100vw"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </div>
        </section>

        <section id="projects" className="mt-16">
          <h2 className="text-2xl font-semibold">Selected Projects</h2>
          <p className="mt-2 text-muted-foreground">
            A short selection of projects showcasing problem-solving, product
            thinking and code quality.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
