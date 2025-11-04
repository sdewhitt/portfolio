import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";

export function Projects() {
  return (
    <section id="projects" className="scroll-mt-20 mt-10">
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
  );
}

export default Projects;
