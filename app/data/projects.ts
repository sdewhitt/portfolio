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
    description: "Web platform to assess performance of large language models",
    tech: ["Next.js", "Vercel", "TypeScript", "React", "Tailwind", "OAuth2", "MongoDB", "Groq API"],
    github: "https://github.com/sdewhitt/evallm-v2",
    live: "https://evallm.vercel.app/",
    image: "/EvallmLogo.png",
  },
  {
    id: "proj-2",
    title: "RAG Portfolio Bot",
    description: "A RAG chatbot built to answer questions about my experience, integrated into this website!",
    tech: ["Next.js", "Vercel", "TypeScript", "React", "Tailwind", "OpenAI API", "LangChain", "AI SDK"],
    github: "https://github.com/sdewhitt/portfolio",
    image: "/bot.svg",
  },
];

export default projects;
