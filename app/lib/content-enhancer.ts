/**
 * Content enhancement utilities for making resume experiences more verbose and varied
 */

/**
 * Get OpenAI client only if API key is present
 */
function getOpenAI() {
  const OpenAI = require('openai').default;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

interface ExperienceData {
  id?: number;
  company: string;
  position: string;
  duration: string;
  location: string;
  description: string;
  technologies: string[];
  achievements: string[];
}

/**
 * Enhance a single experience entry with more verbose and varied descriptions
 */
export async function enhanceExperience(
  experience: ExperienceData
): Promise<{
  original: ExperienceData;
  enhanced: {
    summary: string;
    detailedDescription: string;
    keyContributions: string[];
    impact: string;
    technicalContext: string;
    variations: string[];
  };
}> {
  const prompt = `Given the following work experience, create enhanced, varied, and verbose descriptions that can be used for RAG (Retrieval-Augmented Generation) systems. Make the content more conversational, detailed, and suitable for answering various questions about this experience.

Experience:
Company: ${experience.company}
Position: ${experience.position}
Duration: ${experience.duration}
Location: ${experience.location}
Description: ${experience.description}
Technologies: ${experience.technologies.join(', ')}
Achievements: ${experience.achievements.join(' ')}

Please provide:
1. A comprehensive summary (2-3 sentences)
2. A detailed description (4-5 sentences) expanding on the role and responsibilities
3. 3-5 key contributions with specific details
4. A statement about the impact and outcomes of the work
5. Technical context explaining the technologies and methodologies used
6. 5-7 varied phrasings of the same experience (for better retrieval coverage)

Format your response as JSON with these keys: summary, detailedDescription, keyContributions (array), impact, technicalContext, variations (array)`;

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert technical writer specializing in creating comprehensive, varied descriptions of professional experiences for RAG systems. Your goal is to create rich, detailed content that covers multiple angles and phrasings to improve retrieval accuracy.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const enhanced = JSON.parse(response.choices[0].message.content || '{}');

    return {
      original: experience,
      enhanced,
    };
  } catch (error) {
    console.error('Error enhancing experience:', error);
    throw error;
  }
}

/**
 * Batch enhance multiple experiences
 */
export async function enhanceExperiencesBatch(
  experiences: ExperienceData[]
): Promise<
  Array<{
    original: ExperienceData;
    enhanced: {
      summary: string;
      detailedDescription: string;
      keyContributions: string[];
      impact: string;
      technicalContext: string;
      variations: string[];
    };
  }>
> {
  const results = [];

  for (const experience of experiences) {
    try {
      const enhanced = await enhanceExperience(experience);
      results.push(enhanced);

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(
        `Error enhancing experience for ${experience.company}:`,
        error
      );
      // Continue with other experiences even if one fails
    }
  }

  return results;
}

/**
 * Create multiple content chunks from enhanced experience for better RAG coverage
 */
export function createExperienceChunks(enhanced: {
  original: ExperienceData;
  enhanced: {
    summary: string;
    detailedDescription: string;
    keyContributions: string[];
    impact: string;
    technicalContext: string;
    variations: string[];
  };
}): Array<{
  slug: string;
  title: string;
  content: string;
  metadata: any;
}> {
  const { original, enhanced: enh } = enhanced;
  const chunks = [];

  // Main experience chunk
  chunks.push({
    slug: `experience:${toKebabCase(original.company)}-${toKebabCase(original.position)}`,
    title: `${original.position} at ${original.company}`,
    content: `${enh.summary} ${enh.detailedDescription}`,
    metadata: {
      contentType: 'experience',
      company: original.company,
      position: original.position,
      duration: original.duration,
      location: original.location,
      technologies: original.technologies,
      enrichment: [
        enh.summary,
        enh.impact,
        enh.technicalContext,
        ...enh.variations,
      ],
    },
  });

  // Technical context chunk
  chunks.push({
    slug: `experience:${toKebabCase(original.company)}-${toKebabCase(original.position)}-technical`,
    title: `Technical Details: ${original.position} at ${original.company}`,
    content: enh.technicalContext,
    metadata: {
      contentType: 'experience-technical',
      company: original.company,
      position: original.position,
      technologies: original.technologies,
      enrichment: [
        `Technologies used: ${original.technologies.join(', ')}`,
        ...original.technologies.map((tech) => `Experienced with ${tech}`),
      ],
    },
  });

  // Key contributions as separate chunks
  enh.keyContributions.forEach((contribution, index) => {
    chunks.push({
      slug: `experience:${toKebabCase(original.company)}-${toKebabCase(original.position)}-contribution-${index + 1}`,
      title: `Contribution ${index + 1}: ${original.position} at ${original.company}`,
      content: contribution,
      metadata: {
        contentType: 'experience-contribution',
        company: original.company,
        position: original.position,
        enrichment: [
          `At ${original.company}, I ${contribution}`,
          `During my time as ${original.position}, I ${contribution}`,
        ],
      },
    });
  });

  return chunks;
}

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}
