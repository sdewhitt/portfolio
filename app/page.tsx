"use client";

import Image from "next/image";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "./data/projects";

import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern"
import { Skills } from "@/components/Skills";

export default function Home() {
  return (
    <div className="bg-background text-foreground font-sans">
        <DotPattern
            className={cn(
            "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
            )}
        />
      <main className="container mx-auto px-6 py-20 md:py-28">
        {/* Hero Section */}
        <section className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-16 md:items-center mb-32">
          <div className="space-y-6 animate-fade-in">
            
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Seth DeWhitt
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                Full-Stack Software Engineer based in Seattle, WA
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="#projects"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-base font-semibold text-background transition-all hover:scale-105 hover:shadow-lg active:scale-95"
              >
                View Projects
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="mailto:sethjtdewhitt@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border-2 border-foreground px-6 py-3 text-base font-semibold transition-all hover:bg-foreground hover:text-background active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Me
              </a>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 pt-2">
              <a
                href="https://github.com/sdewhitt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/in/sethdewhitt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end animate-fade-in-delay">
            <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-emerald-600 via-purple-600 to-yellow-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative h-64 w-64 md:h-80 md:w-80 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 ring-1 ring-border">
                <Image
                  src="/Headshot.JPG"
                  alt="Seth DeWhitt"
                  fill
                  sizes="(min-width: 768px) 20rem, 16rem"
                  style={{ objectFit: "cover" }}
                  priority
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>

        
        {/* About and Skills Section */}
        <section className="mt-32 scroll-mt-20 pt-8">
          <div className="flex space-x-15">
            <div className="w-1/2">
              {/* About Me Section */}
              <section>
                <h2 className="text-3xl font-bold">About Me</h2>
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed max-w-3xl mt-4">
                  <p>
                    I'm passionate about creating elegant solutions to complex problems. 
                    With experience in full-stack development, I focus on building applications 
                    that are not only functional but also delightful to use.
                  </p>
                  <p>
                    Currently exploring the intersection of AI and web development, with a 
                    particular interest in creating tools that enhance developer productivity 
                    and user experiences.
                  </p>
                </div>
              </section>
            </div>
            <div className="w-1/2">
              {/* Skills Section */}
              <section>
                <h2 className="text-3xl font-bold">Skills</h2>
                <Skills />
              </section>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="scroll-mt-20">
          <div className="mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Featured Projects</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Here are some of my favorite projects :)
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {projects.map((p, index) => (
              <div 
                key={p.id} 
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProjectCard project={p} />
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
