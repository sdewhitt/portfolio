import Image from "next/image";
import type { Project } from "../data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-md bg-zinc-900">
          {project.image ? (
            <Image src={project.image} alt={project.title} fill style={{ objectFit: "contain" }} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Image</div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold">{project.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {project.tech.map((t) => (
              <span key={t} className="rounded-md border px-2 py-1">{t}</span>
            ))}
          </div>

          <div className="mt-3 flex gap-3 text-sm">
            {project.github && (
              <a href={project.github} target="_blank" rel="noreferrer" className="hover:underline">Code</a>
            )}
            {project.live && (
              <a href={project.live} target="_blank" rel="noreferrer" className="hover:underline">Live</a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
