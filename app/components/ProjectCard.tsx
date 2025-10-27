import Image from "next/image";
import type { Project } from "../data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group rounded-2xl border border-border p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-foreground/20 hover:-translate-y-1 bg-background">
      <div className="flex flex-col gap-4">
        <div className="relative h-48 w-full overflow-hidden rounded-lg bg-zinc-700 dark:bg-zinc-900">
          {project.image ? (
            <Image 
              src={project.image} 
              alt={project.title} 
              fill 
              style={{ objectFit: "contain" }} 
              className="transition-transform duration-300 group-hover:scale-105 p-4"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No Image</div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold mb-2">
            {project.live ? 
              <a 
                href={project.live} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-muted-foreground transition-colors inline-flex items-center gap-2"
              >
                {project.title}
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a> 
              : project.title
            }
          </h3>
          <p className="text-base text-muted-foreground leading-relaxed">{project.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {project.tech.map((t) => (
              <span 
                key={t} 
                className="rounded-full bg-foreground/5 border border-border px-3 py-1.5 font-medium transition-colors hover:bg-foreground/10"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-6 flex gap-4 text-sm font-medium">
            {project.github && (
              <a 
                href={project.github} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </a>
            )}
            {project.live && (
              <a 
                href={project.live} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Link
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
