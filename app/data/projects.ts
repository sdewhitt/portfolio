export type Project = {
  id: string;
  title: string;
  description: string;
  tech: string[];
  github?: string;
  live?: string;
  image?: string;
};

export const projects: Project[] = [
  {
    id: "proj-1",
    title: "Evallm",
    description: "A Next.js + Tailwind app demonstrating component patterns and a clean UI.",
    tech: ["Next.js", "TypeScript", "React", "Tailwind", "OAuth2", "MongoDB"],
    github: "https://github.com/your-username/example-app",
    live: "https://example.com",
    image: "/EvallmLogo.png",
  },
  {
    id: "proj-2",
    title: "API Service",
    description: "A small serverless API showcasing typed endpoints and automated tests.",
    tech: ["Node", "TypeScript", "Serverless"],
    github: "https://github.com/your-username/api-service",
    image: "/project-2.png",
  },
];

export default projects;
