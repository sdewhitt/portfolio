#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { ContentChunk, ExtractedContent } from "./content-types";
import { enhanceExperiencesBatch, createExperienceChunks } from "../lib/content-enhancer";

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

/**
 * Extract homepage content from page.tsx
 */
function extractHomepageContent(): ContentChunk[] {
  return [
    {
      slug: "/",
      title: "Homepage - Portfolio Introduction",
      content: "Welcome to my portfolio website. I'm a software engineer and data scientist with experience in full-stack development, machine learning, and cloud infrastructure. Explore my projects, career experience, and skills.",
      metadata: {
        contentType: "page",
        enrichment: [
          "This is my portfolio homepage showcasing my work and experience",
          "I'm a software engineer with expertise in full-stack development and data science",
          "This site showcases my projects, career experience, and technical skills",
          "You can learn about my work at companies like Chewy, The Data Mine, and OMP",
          "I have experience with React, TypeScript, Python, AWS, and machine learning",
        ],
      },
    },
  ];
}

/**
 * Extract chat page content
 */
function extractChatPageContent(): ContentChunk[] {
  return [
    {
      slug: "/chat",
      title: "Chat Interface",
      content: "Interactive chat interface powered by AI to answer questions about my experience, projects, and skills. The chatbot uses RAG (Retrieval-Augmented Generation) to provide accurate, contextual responses based on my portfolio content.",
      metadata: {
        contentType: "page",
        enrichment: [
          "Chat with an AI assistant to learn about my experience and projects",
          "The chatbot can answer questions about my technical skills and work history",
          "Ask about specific technologies, projects, or experiences",
          "The AI uses retrieval-augmented generation for accurate responses",
        ],
      },
    },
  ];
}

/**
 * Extract enhanced career/experience data from resume.json
 */
async function extractEnhancedExperienceData(): Promise<ContentChunk[]> {
  const filePath = path.join(process.cwd(), "app/data/RAG/resume.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const chunks: ContentChunk[] = [];

  // Check if OPENAI_API_KEY is set for enhancement
  const shouldEnhance = !!process.env.OPENAI_API_KEY;

  if (shouldEnhance) {
    console.log("Enhancing experiences with AI...");
    try {
      const enhanced = await enhanceExperiencesBatch(data.experience);

      // Create multiple chunks per experience for better RAG coverage
      for (const exp of enhanced) {
        const experienceChunks = createExperienceChunks(exp);
        chunks.push(...experienceChunks);
      }
    } catch (error) {
      console.error("Error enhancing experiences, falling back to basic extraction:", error);
      // Fall back to basic extraction if enhancement fails
      data.experience.forEach((exp: any) => {
        chunks.push(...extractBasicExperience(exp));
      });
    }
  } else {
    console.log("Skipping AI enhancement (OPENAI_API_KEY not set), using basic extraction...");
    data.experience.forEach((exp: any) => {
      chunks.push(...extractBasicExperience(exp));
    });
  }

  return chunks;
}

/**
 * Extract basic experience without AI enhancement
 */
function extractBasicExperience(exp: any): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  // Main experience chunk
  const expText = `${exp.position} at ${exp.company}. Duration: ${exp.duration}. Location: ${exp.location}. ${exp.description} Technologies used: ${exp.technologies.join(", ")}. Key achievements: ${exp.achievements.join(" ")}`;

  chunks.push({
    slug: `experience:${toKebabCase(exp.company)}-${toKebabCase(exp.position)}`,
    title: `${exp.position} at ${exp.company}`,
    content: expText,
    metadata: {
      contentType: "experience",
      company: exp.company,
      position: exp.position,
      duration: exp.duration,
      location: exp.location,
      technologies: exp.technologies,
      enrichment: [
        `I worked at ${exp.company} as a ${exp.position}`,
        `My role at ${exp.company} was ${exp.position}`,
        `During my time at ${exp.company}, I worked with ${exp.technologies.join(", ")}`,
        ...exp.achievements.map((a: string) => `Achievement: ${a}`),
      ],
    },
  });

  return chunks;
}

/**
 * Extract structured data from projects.ts
 */
function extractProjectsData(): ContentChunk[] {
  // Note: projects.ts exports projects array, would need to be imported
  // For now, return placeholder - to be implemented based on projects.ts structure
  const filePath = path.join(process.cwd(), "app/data/projects.ts");
  if (!fs.existsSync(filePath)) {
    return [];
  }

  // Basic extraction without running TypeScript
  // In production, you'd want to compile or use a dynamic import
  return [];
}

/**
 * Extract structured data from career JSON
 */
function extractCareerData(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "app/data/career.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const chunks: ContentChunk[] = [];

  data.career.forEach((job: any) => {
    // Create coherent job description with links included
    const jobText = `Company: ${job.name} - ${job.title}. Period: ${job.start}${job.end ? ` to ${job.end}` : " (Current)"}. ${job.description.join(" ")}`;

    const linksText =
      job.links && job.links.length > 0
        ? ` Related Projects: ${job.links.map((link: any) => `${link.name}: ${link.href}`).join(" | ")}`
        : "";

    chunks.push({
      slug: `career:${toKebabCase(job.name)}-${toKebabCase(job.title)}`,
      title: `Career: ${job.name} - ${job.title}`,
      content: jobText + linksText,
      metadata: {
        contentType: "career",
        enrichment: [
          `I worked at ${job.name} as a ${job.title}`,
          `My role at ${job.name} was ${job.title}`,
          `I was employed at ${job.name} from ${job.start}${job.end ? ` to ${job.end}` : " to present"}`,
          `During my time at ${job.name}, I worked as a ${job.title}`,
          `My employment history includes working at ${job.name}`,
          `I gained experience at ${job.name} in the ${job.name.includes("Bank") ? "finance" : job.name.includes("Institute") ? "education" : "technology"} industry`,
          `This was a ${job.title.includes("Intern") ? "internship position" : job.title.includes("Graduate") ? "entry-level graduate role" : "professional position"}`,
        ],
      },
    });
  });

  return chunks;
}

/**
 * Extract structured data from education JSON
 */
function extractEducationData(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "app/data/education.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const chunks: ContentChunk[] = [];

  data.education.forEach((edu: any) => {
    // Create coherent education description with links included
    const eduText = `School: ${edu.name}. Degree: ${edu.title}. Period: ${edu.start} to ${edu.end}. ${edu.description ? edu.description.join(" ") : ""}`;

    const linksText =
      edu.links && edu.links.length > 0
        ? ` Projects: ${edu.links.map((link: any) => `${link.name}: ${link.href}`).join(" | ")}`
        : "";

    chunks.push({
      slug: `education:${toKebabCase(edu.name)}`,
      title: `Education: ${edu.name}`,
      content: eduText + linksText,
      metadata: {
        contentType: "education",
        enrichment: [
          `I studied at ${edu.name} and earned a ${edu.title}`,
          `My education includes ${edu.title} from ${edu.name}`,
          `I attended ${edu.name} from ${edu.start} to ${edu.end}`,
          `I completed my ${edu.title.includes("BS") ? "bachelor's degree" : "diploma"} at ${edu.name}`,
          `My field of study was ${edu.title.includes("Computer Science") ? "computer science" : "game development"}`,
          `I graduated from ${edu.name} with a degree in ${edu.title}`,
          `My academic background includes ${edu.title} from ${edu.name}`,
        ],
      },
    });
  });

  return chunks;
}

/**
 * Extract skills data
 */
function extractSkillsData(): ContentChunk[] {
  // Skills are shown on the homepage via Skills component
  return [
    {
      slug: "skills:overview",
      title: "Technical Skills",
      content: "Proficient in Python, TypeScript, React, Next.js, FastAPI, AWS (Lambda, ECS, RDS, EFS), Docker, PostgreSQL, machine learning frameworks (TensorFlow, scikit-learn, XGBoost, LightGBM), and version control with Git. Experience with Agile methodologies, CI/CD pipelines (Jenkins, Terraform), and RAG chatbot development.",
      metadata: {
        contentType: "skills",
        enrichment: [
          "I have strong skills in full-stack development and data science",
          "My technical expertise includes Python, TypeScript, React, and AWS",
          "I'm proficient in machine learning frameworks and cloud infrastructure",
          "Experience with Docker, PostgreSQL, and modern DevOps practices",
        ],
      },
    },
  ];
}

/**
 * Extract structured data from socials/contact info
 */
function extractSocialsData(): ContentChunk[] {
  // Socials would be in footer or similar
  return [
    {
      slug: "contact:info",
      title: "Contact Information",
      content: "Connect with me via LinkedIn, GitHub, or email. Open to discussing software engineering opportunities, data science projects, and technical collaborations.",
      metadata: {
        contentType: "social",
        enrichment: [
          "You can reach me via email or LinkedIn",
          "My GitHub profile showcases my open-source contributions and projects",
          "I'm available for professional networking and collaboration",
        ],
      },
    },
  ];
}

/**
 * Extract site navigation structure
 */
function extractNavigationContent(): ContentChunk[] {
  return [
    {
      slug: "navigation:routes",
      title: "Site Navigation",
      content: "Main sections: Home (portfolio overview), Chat (AI assistant), Experience (career history and projects). Use the navigation to explore different areas of the portfolio.",
      metadata: {
        contentType: "navigation",
        enrichment: [
          "The website has sections for home, chat, and experience",
          "You can navigate to different pages to explore my portfolio",
          "The chat page lets you interact with an AI assistant",
          "Experience section showcases my career history and technical skills",
        ],
      },
    },
  ];
}

/**
 * Main function to extract all content
 */
async function extractAllContent(): Promise<ExtractedContent> {
  const contentChunks: ContentChunk[] = [
    ...extractHomepageContent(),
    ...extractChatPageContent(),
    ...(await extractEnhancedExperienceData()),
    ...extractCareerData(),
    ...extractEducationData(),
    ...extractSkillsData(),
    ...extractSocialsData(),
    ...extractNavigationContent(),
  ];

  return {
    timestamp: new Date().toISOString(),
    content: contentChunks,
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("Starting content extraction...");

    const extractedContent = await extractAllContent();

    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write extracted content to JSON file
    const outputPath = path.join(outputDir, "extracted-content.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(extractedContent, null, 2),
      "utf-8",
    );

    console.log(`Content extraction completed successfully!`);
    console.log(`Output saved to: ${outputPath}`);
    console.log(
      `Total content chunks extracted: ${extractedContent.content.length}`,
    );

    // Output extracted content summary for build logs
    console.log("\n--- Extracted Content Summary ---");
    extractedContent.content.forEach((chunk, index) => {
      console.log(`[${index + 1}] ${chunk.slug}: ${chunk.title}`);
      console.log(
        `     Content preview: ${chunk.content.substring(0, 100)}...`,
      );
    });
    console.log("--- End of Content Summary ---\n");
  } catch (error) {
    console.error("Error during content extraction:", error);
    process.exit(1);
  }
}

// Run the script if called directly
main();
