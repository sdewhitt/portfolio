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
        title: "ControVirtual",
        description: "Streamlined and upscaled use of AMD SO-101 Robot Arms for industry experts via remote use of a Meta Quest S3, voice & natural language processing, and a Vision-Language-Action (VLA) model. Honorable Mention for \"Best Use of AMD Tech\" at StarkHacks 2026.",
        tech: ['Python', 'C#', 'OpenCV', 'PyTorch', 'Flask', 'LeRobot', 'Meta Quest S3', 'AMD SO-101 Robot Arm'],
        github: "https://github.com/sdewhitt/StarkHacks-Team-Too",
        live: "",
        image: "/controvirtuallive.jpg",
    },
    {
        id: "proj-2",
        title: "SlopMop",
        description: "Chrome/Firefox browser extension that detects AI-generated content in social media feeds",
        tech: ['Python', 'Vite', 'TypeScript', 'React', 'AWS', 'PyTorch', 'Firebase'],
        github: "https://github.com/sdewhitt/SlopMop",
        live: "",
        image: "SlopMop.svg",
    },
    {
        id: "proj-3",
        title: "Evallm",
        description: "Web platform to assess performance of large language models",
        tech: ["Next.js", "Vercel", "TypeScript", "React", "Tailwind", "OAuth2", "MongoDB", "Groq API"],
        github: "https://github.com/sdewhitt/evallm-v2",
        live: "https://evallm.vercel.app/",
        image: "/EvallmLogo.png",
    },
    /*{
        id: "proj-4",
        title: "RAG Portfolio Bot",
        description: "A RAG chatbot built to answer questions about my experience, integrated into this website!",
        tech: ["Next.js", "Vercel", "TypeScript", "React", "Tailwind", "OpenAI API", "LangChain", "AI SDK", "Supabase"],
        github: "https://github.com/sdewhitt/portfolio",
        live: "https://www.sdewhitt.com/chat",
        image: "/bot.svg",
    },*/
];

export default projects;
