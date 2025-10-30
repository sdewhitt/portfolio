/**
 * Shared TypeScript interfaces for content extraction and pushing
 */

export interface ContentChunk {
  slug: string;
  title: string;
  content: string;
  metadata?: {
    contentType?:
      | "project"
      | "career"
      | "education"
      | "page"
      | "social"
      | "navigation"
      | "experience"
      | "experience-technical"
      | "experience-contribution"
      | "skills";
    enrichment?: string[];
    technologies?: string[];
    company?: string;
    position?: string;
    duration?: string;
    location?: string;
  };
}

export interface ExtractedContent {
  timestamp: string;
  content: ContentChunk[];
}
