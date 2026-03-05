/**
 * ATS-style PDF Resume Parser
 * 
 * Scans a PDF resume from /public, extracts structured content,
 * and writes it to the JSON data files consumed by the RAG pipeline.
 */

import * as fs from 'fs';
import * as path from 'path';
// Import the inner lib directly to avoid pdf-parse's index.js which tries
// to read a test PDF at module load time (known issue with the package).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedExperience {
  id: number;
  company: string;
  position: string;
  duration: string;
  location: string;
  description: string;
  technologies: string[];
  achievements: string[];
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  duration: string;
  details: string[];
}

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
}

export interface ParsedResume {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  experience: ParsedExperience[];
  education: ParsedEducation[];
  skills: Record<string, string[]>;
  projects: ParsedProject[];
  rawText: string;
}

// ─── Section detection ────────────────────────────────────────────────────────

/** Common ATS resume section headings (case-insensitive) */
const SECTION_PATTERNS: Record<string, RegExp> = {
  experience: /^(?:(?:work|professional|relevant)\s+)?experience$/i,
  education: /^education(?:\s+(?:&|and)\s+certifications?)?$/i,
  skills: /^(?:(?:technical|core|key|professional)\s+)?skills(?:\s+(?:&|and)\s+(?:tools|technologies))?$/i,
  projects: /^(?:(?:personal|notable|selected|relevant)\s+)?projects$/i,
  certifications: /^certifications?$/i,
  summary: /^(?:(?:professional|career)\s+)?(?:summary|profile|objective|about)$/i,
  awards: /^(?:awards?|honors?)(?:\s+(?:&|and)\s+(?:awards?|honors?))?$/i,
  activities: /^(?:(?:extracurricular|leadership)\s+)?activities(?:\s+(?:&|and)\s+leadership)?$/i,
};

/** Date patterns commonly found in resumes */
const DATE_RANGE_RE =
  /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\.?\s*\d{4}|(?:Spring|Summer|Fall|Winter)\s*\d{4}|\d{4})\s*[-–—]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\.?\s*\d{4}|Present|Current|Ongoing|(?:Spring|Summer|Fall|Winter)\s*\d{4}|\d{4})/i;

const SINGLE_DATE_RE =
  /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\.?\s*\d{4}|(?:Spring|Summer|Fall|Winter)\s*\d{4}|\d{4})/i;

/** US state abbreviations for strict location matching */
const US_STATES = 'AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC';

/**
 * Strict location pattern: "City Name, ST" where ST is a 2-letter US state code.
 * Also matches "Remote".
 */
const LOCATION_RE = new RegExp(
  `(?:[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*),\\s*(?:${US_STATES})|Remote`,
);

/**
 * Extract location from the END of a string (where PDF text glues it).
 * Returns { location, rest } where rest is the string with location stripped.
 */
function extractTrailingLocation(text: string): { location: string; rest: string } {
  // Match "City, ST" at the very end (possibly glued to previous word)
  const trailingLocRe = new RegExp(
    `([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*),\\s*(${US_STATES})\\s*$`
  );
  const m = trailingLocRe.exec(text);
  if (m) {
    return {
      location: m[0].trim(),
      rest: text.substring(0, m.index).trim(),
    };
  }
  if (/Remote\s*$/i.test(text)) {
    return { location: 'Remote', rest: text.replace(/Remote\s*$/i, '').trim() };
  }
  return { location: '', rest: text };
}

/** Email pattern */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/** Phone pattern */
const PHONE_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

/** LinkedIn URL */
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i;

/** GitHub URL */
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/i;

/** Website URL */
const WEBSITE_RE = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.[a-z]{2,}(?:\/[^\s]*)?/i;

// ─── Text extraction ──────────────────────────────────────────────────────────

/**
 * Extract raw text from a PDF file
 */
export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  return data.text;
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

/**
 * Identify which section a line belongs to
 */
function identifySection(line: string): string | null {
  const trimmed = line.trim();
  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(trimmed)) {
      return section;
    }
  }
  return null;
}

/**
 * Check if a line looks like a bullet point / achievement
 */
function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  return /^[•●○◦▪▸►\-–—]\s*\S/.test(trimmed) ||
         /^\d+[\.\)]\s/.test(trimmed) ||
         /^\*\s/.test(trimmed);
}

/**
 * Strip bullet character from line
 */
function stripBullet(line: string): string {
  return line.trim().replace(/^[•●○◦▪▸►\-–—*]\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
}

/**
 * Try to extract common technology keywords from text
 */
const TECH_KEYWORDS = new Set([
  // Languages
  'Python', 'TypeScript', 'JavaScript', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'SQL', 'HTML', 'CSS', 'Bash',
  'Shell', 'MATLAB', 'Dart', 'Lua', 'Perl', 'Haskell', 'Elixir',
  // Frameworks & Libraries
  'React', 'Next.js', 'Angular', 'Vue.js', 'Vue', 'Svelte', 'Express', 'FastAPI',
  'Flask', 'Django', 'Spring', 'Spring Boot', 'Node.js', 'Deno', 'Bun',
  'Tailwind', 'TailwindCSS', 'Bootstrap', 'Material UI', 'Vite',
  // ML/AI
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'XGBoost', 'LightGBM', 'Keras',
  'Pandas', 'NumPy', 'Numpy', 'Matplotlib', 'Seaborn', 'Jupyter', 'Jupyter Notebooks',
  'OpenAI', 'LangChain', 'Hugging Face', 'NLTK', 'spaCy',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
  'Jenkins', 'GitHub Actions', 'CI/CD', 'Vercel', 'Netlify', 'Heroku',
  'AWS Lambda', 'AWS ECS', 'AWS RDS', 'AWS EFS', 'AWS Kinesis',
  'AWS Fargate', 'AWS S3', 'AWS EC2', 'AWS SQS', 'AWS SNS',
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'DynamoDB', 'Supabase',
  'Firebase', 'Prisma', 'Drizzle',
  // Tools
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
  'Figma', 'Postman', 'VS Code', 'IntelliJ',
  // Platforms / APIs
  'REST', 'GraphQL', 'gRPC', 'WebSockets', 'OAuth', 'OAuth2', 'JWT',
  'Shopify', 'WooCommerce', 'Stripe',
  // Other
  'Agile', 'Scrum', 'RAG', 'LLM', 'NLP', 'Machine Learning',
  'Deep Learning', 'Data Science', 'ETL', 'Data Engineering',
]);

function extractTechnologies(text: string): string[] {
  const found = new Set<string>();
  for (const tech of TECH_KEYWORDS) {
    // Word-boundary match (case-insensitive for some, exact for abbreviations)
    const escapedTech = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[\\s,;|/(:])${escapedTech}(?=[\\s,;|/):.]|$)`, 'i');
    if (re.test(text)) {
      found.add(tech);
    }
  }
  return Array.from(found);
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/** Full date-range regex that can sit mid-string (no anchors) */
const INLINE_DATE_RANGE_RE =
  /(?:(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s*\.?\s*\d{4}|(?:Spring|Summer|Fall|Winter)\s*\d{4}|\d{4})\s*[-–—]\s*(?:(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s*\.?\s*\d{4}|Present|Current|Ongoing|(?:Spring|Summer|Fall|Winter)\s*\d{4}|\d{4})/i;

/**
 * Pre-process raw PDF text to normalise common extraction quirks:
 *  1. Merge lone bullet markers (•) with their continuation on the next line
 *  2. Insert a newline before dates that are glued to the preceding word
 *     e.g. "Software Engineering InternJune 2025" → two tokens
 */
function preprocessLines(rawText: string): string[] {
  // Normalise line endings and split
  let lines = rawText.replace(/\r\n?/g, '\n').split('\n');

  // Pass 1 – merge orphan bullet markers with following line
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^[•●○◦▪▸►]$/.test(trimmed) && i + 1 < lines.length) {
      // Bullet char alone → prepend to next line
      merged.push(`${trimmed} ${lines[i + 1].trim()}`);
      i++; // skip next line, we consumed it
    } else {
      merged.push(lines[i]);
    }
  }

  // Pass 2 – split lines where a date range is glued to preceding text
  // e.g. "Research Lead & Teaching AssistantAugust 2025 – Present"
  const result: string[] = [];
  for (const line of merged) {
    const m = INLINE_DATE_RANGE_RE.exec(line);
    if (m && m.index > 0) {
      const before = line.substring(0, m.index).trimEnd();
      const dateAndAfter = line.substring(m.index).trimStart();
      if (before.length > 0) {
        result.push(before);
      }
      result.push(dateAndAfter);
    } else {
      result.push(line);
    }
  }

  return result.map(l => l.trimEnd());
}

/**
 * Parse raw resume text into structured sections
 */
export function parseResumeText(rawText: string): ParsedResume {
  const lines = preprocessLines(rawText);

  // ── 1. Split into sections ──
  const sections: Record<string, string[]> = { header: [] };
  let currentSection = 'header';

  for (const line of lines) {
    const detected = identifySection(line);
    if (detected) {
      currentSection = detected;
      if (!sections[currentSection]) sections[currentSection] = [];
      continue; // skip the heading line itself
    }
    if (!sections[currentSection]) sections[currentSection] = [];
    sections[currentSection].push(line);
  }

  // ── 2. Parse header / contact info ──
  const headerText = (sections.header || []).join(' ');
  const name = extractName(sections.header || []);
  const contact = {
    email: EMAIL_RE.exec(headerText)?.[0],
    phone: PHONE_RE.exec(headerText)?.[0],
    location: undefined as string | undefined,
    linkedin: LINKEDIN_RE.exec(headerText)?.[0],
    github: GITHUB_RE.exec(headerText)?.[0],
    website: undefined as string | undefined,
  };

  // Extract location from individual pipe-separated header segments
  for (const headerLine of (sections.header || [])) {
    const segments = headerLine.split('|').map(p => p.trim());
    for (const seg of segments) {
      // Look for "City, ST" pattern in each segment individually, not in joined text
      const locMatch = LOCATION_RE.exec(seg);
      if (locMatch && !seg.includes('@') && !seg.includes('.com')) {
        contact.location = locMatch[0];
        break;
      }
    }
    if (contact.location) break;
  }

  // Try to find a personal website that isn't linkedin/github/gmail
  const urlMatches = headerText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.[a-z]{2,}(?:\/[^\s,)|]*)?/gi) || [];
  for (const url of urlMatches) {
    if (!url.includes('linkedin.com') && !url.includes('github.com') && !url.includes('gmail.com')) {
      contact.website = url;
      break;
    }
  }

  // ── 3. Parse experience ──
  const experience = parseExperienceSection(sections.experience || []);

  // ── 4. Parse education ──
  const education = parseEducationSection(sections.education || []);

  // ── 5. Parse skills ──
  const skills = parseSkillsSection(sections.skills || []);

  // ── 6. Parse projects ──
  const projects = parseProjectsSection(sections.projects || []);

  return {
    name,
    contact,
    experience,
    education,
    skills,
    projects,
    rawText,
  };
}

/**
 * Extract the name from header lines (typically the first non-empty line)
 */
function extractName(headerLines: string[]): string {
  for (const line of headerLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (EMAIL_RE.test(trimmed)) continue;
    if (PHONE_RE.test(trimmed)) continue;
    if (/^https?:\/\//.test(trimmed)) continue;
    if (/linkedin|github/i.test(trimmed)) continue;
    if (trimmed.includes('|') && (trimmed.includes('@') || trimmed.includes('.com'))) continue;
    if (trimmed.length > 1 && trimmed.length < 60) {
      return trimmed;
    }
  }
  return 'Unknown';
}

/**
 * Parse the Experience section into structured entries.
 *
 * Expected PDF format (after preprocessing):
 *   Line A: "Research Lead & Teaching Assistant"      ← position (date was split off)
 *   Line B: "August 2025 – Present"                  ← date range
 *   Line C: "The Data Mine, Purdue University|Python, TypeScript...West Lafayette, IN"
 *   Line D+: "• bullet achievement text"
 */
function parseExperienceSection(lines: string[]): ParsedExperience[] {
  const experiences: ParsedExperience[] = [];
  let current: Partial<ParsedExperience> | null = null;
  let prevNonEmpty = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // --- Bullet point → achievement on current entry ---
    if (isBulletLine(line)) {
      if (current) {
        const text = stripBullet(line);
        if (text.length > 3) {
          current.achievements = current.achievements || [];
          current.achievements.push(text);
        }
      }
      prevNonEmpty = line;
      continue;
    }

    // --- Date-range line → starts a new entry ---
    const dateMatch = DATE_RANGE_RE.exec(line);
    if (dateMatch) {
      // Save previous entry
      if (current) finalizeExperience(current, experiences);

      // The previous non-empty, non-bullet line is the position/title
      const position = prevNonEmpty && !isBulletLine(prevNonEmpty) && !DATE_RANGE_RE.test(prevNonEmpty)
        ? prevNonEmpty
        : '';

      current = {
        id: experiences.length + 1,
        company: '',
        position: position,
        duration: dateMatch[0],
        location: '',
        description: '',
        technologies: [],
        achievements: [],
      };

      // Check if there's extra text on the date line besides the date itself
      const withoutDate = line.replace(DATE_RANGE_RE, '').trim();
      if (withoutDate.length > 2 && !current.position) {
        current.position = withoutDate;
      }

      // Peek at next line for company|tech|location
      const nextLine = (lines[i + 1] || '').trim();
      if (nextLine && !isBulletLine(nextLine) && !DATE_RANGE_RE.test(nextLine) && !identifySection(nextLine)) {
        parseCompanyTechLocation(nextLine, current);
        i++; // consume it
      }

      prevNonEmpty = line;
      continue;
    }

    // --- Non-bullet, non-date line while inside an entry ---
    if (current) {
      // If we don't have company yet → company/tech/location line
      if (!current.company) {
        parseCompanyTechLocation(line, current);
        prevNonEmpty = line;
        continue;
      }
      // Otherwise → continuation text from a wrapped bullet/achievement
      // BUT: if the NEXT line is a date range, then THIS line is likely
      // the position title for the next entry, NOT a continuation.
      const nextLineAhead = (lines[i + 1] || '').trim();
      const nextIsDate = DATE_RANGE_RE.test(nextLineAhead);
      if (!nextIsDate && current.achievements && current.achievements.length > 0 && line.length > 3) {
        // Append to the last achievement (PDF wraps long bullets)
        current.achievements[current.achievements.length - 1] += ' ' + line;
        prevNonEmpty = line;
        continue;
      }
    }

    // Remember for next iteration (might be a position title before its date)
    prevNonEmpty = line;
  }

  if (current) finalizeExperience(current, experiences);
  return experiences;
}

/**
 * Parse a line like "Chewy|Python, React, Vite, FastAPI, Docker...Bellevue, WA"
 * or "The Data Mine, Purdue University|Agile, Python...West Lafayette, IN"
 * into company, technologies, and location on the current entry.
 */
function parseCompanyTechLocation(line: string, entry: Partial<ParsedExperience>): void {
  // 1. Extract location from the END of the string (where PDF text glues it)
  const { location, rest: lineWithoutLoc } = extractTrailingLocation(line);
  if (location) {
    entry.location = location;
  }

  // 2. Split remaining text on pipes: "Company|Tech1, Tech2, ..."
  const parts = lineWithoutLoc.split('|').map(p => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    entry.company = parts[0];
    // Everything after the first pipe is tech keywords
    const techText = parts.slice(1).join(', ');
    entry.technologies = extractTechnologies(techText);
    // Fallback: comma-separated raw values
    if (entry.technologies.length === 0) {
      entry.technologies = techText.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
  } else if (parts.length === 1) {
    entry.company = parts[0];
  }

  // 3. If position contains "|" with a subtitle like "Bayer Crop Sciences, Syngenta"
  if (entry.position) {
    const posParts = entry.position.split('|').map(p => p.trim()).filter(Boolean);
    if (posParts.length >= 2) {
      entry.position = posParts[0];
      if (entry.company) {
        entry.company = `${entry.company} (${posParts.slice(1).join(', ')})`;
      }
    }
  }
}

function finalizeExperience(partial: Partial<ParsedExperience>, list: ParsedExperience[]) {
  // Gather techs from achievements + description + any already-found techs
  const allText = [
    partial.description || '',
    ...(partial.achievements || []),
  ].join(' ');
  const inferredTechs = extractTechnologies(allText);
  const techs = [...new Set([...(partial.technologies || []), ...inferredTechs])];

  list.push({
    id: partial.id || list.length + 1,
    company: partial.company || 'Unknown Company',
    position: partial.position || 'Unknown Position',
    duration: partial.duration || '',
    location: partial.location || '',
    description: partial.achievements?.[0] || partial.description || '',
    technologies: techs,
    achievements: partial.achievements || [],
  });
}

/**
 * Parse the Education section.
 *
 * Expected PDF format (after preprocessing):
 *   "Purdue University"                             ← institution (date split off)
 *   "August 2023 – May 2027"                         ← date range line
 *   "B.S. in Computer Science, Software Engineering concentrationGPA: 3.6/4.0"
 *   "Relevant Coursework:  Data Structures, ..."
 *   "Activities:  ..."
 *   "Awards:  ..."
 */
function parseEducationSection(lines: string[]): ParsedEducation[] {
  const entries: ParsedEducation[] = [];
  let current: Partial<ParsedEducation> | null = null;
  let prevNonEmpty = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Date range → start a new entry
    const dateMatch = DATE_RANGE_RE.exec(trimmed) || SINGLE_DATE_RE.exec(trimmed);
    if (dateMatch && !isBulletLine(trimmed)) {
      if (current) entries.push(finalizeEducation(current));

      // Previous non-empty line is institution name (possibly with location glued)
      // e.g. "Purdue University,West Lafayette, IN" → extract "Purdue University"
      const { location: _eduLoc, rest: institutionText } = extractTrailingLocation(prevNonEmpty);
      // Also strip trailing commas/pipes left over
      const institution = institutionText.replace(/[,|]\s*$/, '').trim();

      current = {
        institution: institution || '',
        degree: '',
        duration: dateMatch[0],
        details: [],
      };

      // Rest of the date line (after date) might have extra info
      const withoutDate = trimmed.replace(DATE_RANGE_RE, '').replace(SINGLE_DATE_RE, '').trim();
      if (withoutDate.length > 3 && !current.institution) {
        current.institution = withoutDate;
      }

      prevNonEmpty = trimmed;
      continue;
    }

    if (current) {
      // Degree line (first non-date, non-bullet line after the entry starts)
      if (!current.degree && !isBulletLine(trimmed) && trimmed.length > 3) {
        // Degree may have GPA glued on: "B.S. in Computer Science...GPA: 3.6/4.0"
        const gpaMatch = /GPA:\s*[\d.]+\/[\d.]+/.exec(trimmed);
        if (gpaMatch) {
          current.degree = trimmed.substring(0, gpaMatch.index).trim();
          current.details = current.details || [];
          current.details.push(gpaMatch[0]);
        } else {
          current.degree = trimmed;
        }
        prevNonEmpty = trimmed;
        continue;
      }

      // Labelled detail lines: "Relevant Coursework:", "Activities:", "Awards:"
      const labelMatch = /^(Relevant Coursework|Coursework|Activities|Awards|Honors|GPA)\s*:\s*/i.exec(trimmed);
      if (labelMatch) {
        current.details = current.details || [];
        current.details.push(trimmed);
        prevNonEmpty = trimmed;
        continue;
      }

      // Bullet details
      if (isBulletLine(trimmed)) {
        current.details = current.details || [];
        current.details.push(stripBullet(trimmed));
        prevNonEmpty = trimmed;
        continue;
      }

      // Any other continuation text → detail
      if (trimmed.length > 3) {
        current.details = current.details || [];
        current.details.push(trimmed);
      }
    }

    prevNonEmpty = trimmed;
  }

  if (current) entries.push(finalizeEducation(current));
  return entries;
}

function finalizeEducation(partial: Partial<ParsedEducation>): ParsedEducation {
  return {
    institution: partial.institution || 'Unknown Institution',
    degree: partial.degree || 'Unknown Degree',
    duration: partial.duration || '',
    details: partial.details || [],
  };
}

/**
 * Parse the Skills section
 */
function parseSkillsSection(lines: string[]): Record<string, string[]> {
  const skills: Record<string, string[]> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skills often formatted as "Category: skill1, skill2, skill3"
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0 && colonIndex < 40) {
      const category = trimmed.substring(0, colonIndex).trim();
      const skillList = trimmed
        .substring(colonIndex + 1)
        .split(/[,;|]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      if (skillList.length > 0) {
        skills[category] = skillList;
      }
    } else if (isBulletLine(trimmed)) {
      const skill = stripBullet(trimmed);
      if (!skills['General']) skills['General'] = [];
      skills['General'].push(skill);
    }
  }

  // If no categorised skills found, extract from all text
  if (Object.keys(skills).length === 0) {
    const allText = lines.join(' ');
    const techs = extractTechnologies(allText);
    if (techs.length > 0) {
      skills['Technologies'] = techs;
    }
  }

  return skills;
}

/**
 * Parse the Projects section.
 *
 * Expected PDF format (after preprocessing):
 *   "MyPort|TypeScript, OpenAI, LangChain, Supabase|GitHub|Link"
 *   "October 2025"                          (date split to own line by preprocessor)
 *   "• Pioneered RAG portfolio chatbot..."
 *   "• Reduced latency by 20%..."
 *
 * Edge cases handled:
 *   - "|Link" at start of line (garbage from PDF extraction, skip)
 *   - Continuation lines (text without bullet that wraps from prev line)
 */
function parseProjectsSection(lines: string[]): ParsedProject[] {
  const projects: ParsedProject[] = [];
  let current: Partial<ParsedProject> | null = null;
  const linkLabels = new Set(['github', 'link', 'live', 'demo', 'website', 'site']);

  /**
   * Detect if a line looks like a new project header.
   * Headers contain pipe-separated segments: Name|Tech|Links
   */
  function isProjectHeader(line: string): boolean {
    // Must contain at least one pipe and start with a word character
    if (!line.includes('|')) return false;
    if (/^[|]/.test(line)) return false; // starts with pipe → garbage
    // First segment should be a short project name (< 40 chars)
    const firstName = line.split('|')[0].trim();
    return firstName.length > 0 && firstName.length < 50;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip garbage lines starting with pipe ("|Link", "|GitHub")
    if (/^\|/.test(trimmed)) continue;

    // Bullet → achievement on current project
    if (isBulletLine(trimmed)) {
      if (current) {
        const text = stripBullet(trimmed);
        if (text.length > 3) {
          if (!current.description) {
            current.description = text;
          } else {
            current.description += ' ' + text;
          }
          const moreTech = extractTechnologies(text);
          current.technologies = [...new Set([...(current.technologies || []), ...moreTech])];
        }
      }
      continue;
    }

    // Date-only line → skip (metadata for current project)
    if (DATE_RANGE_RE.test(trimmed) || SINGLE_DATE_RE.test(trimmed)) {
      const withoutDate = trimmed.replace(DATE_RANGE_RE, '').replace(SINGLE_DATE_RE, '').trim();
      if (withoutDate.length < 3) continue;
    }

    // Project header → new project
    if (isProjectHeader(trimmed)) {
      if (current) projects.push(finalizeProject(current));

      // Strip date from end if glued
      let headerText = trimmed.replace(DATE_RANGE_RE, '').replace(SINGLE_DATE_RE, '').trim();
      const parts = headerText.split('|').map(p => p.trim()).filter(Boolean);

      const projectName = parts[0] || headerText;
      const techs = extractTechnologies(headerText);
      const filteredTechs = techs.filter(t => !linkLabels.has(t.toLowerCase()));

      current = {
        name: projectName,
        description: '',
        technologies: filteredTechs,
      };

      // Fallback: try comma-separated values from parts[1]
      if (filteredTechs.length === 0 && parts.length >= 2) {
        current.technologies = parts[1].split(',').map(t => t.trim()).filter(t =>
          t.length > 0 && !linkLabels.has(t.toLowerCase())
        );
      }
      continue;
    }

    // Non-bullet, non-header → continuation text (belongs to current project description)
    if (current && trimmed.length > 3) {
      if (!current.description) {
        current.description = trimmed;
      } else {
        current.description += ' ' + trimmed;
      }
      const moreTech = extractTechnologies(trimmed);
      current.technologies = [...new Set([...(current.technologies || []), ...moreTech])];
    }
  }

  if (current) projects.push(finalizeProject(current));
  return projects;
}

function finalizeProject(partial: Partial<ParsedProject>): ParsedProject {
  return {
    name: partial.name || 'Untitled Project',
    description: partial.description || '',
    technologies: partial.technologies || [],
  };
}

// ─── JSON file writers ────────────────────────────────────────────────────────

/**
 * Write parsed resume data to the RAG resume.json
 */
function writeResumeJson(parsed: ParsedResume): void {
  const resumePath = path.join(process.cwd(), 'app/data/RAG/resume.json');

  const resumeData: any = {
    experience: parsed.experience.map((exp, i) => ({
      id: i + 1,
      company: exp.company,
      position: exp.position,
      duration: exp.duration,
      location: exp.location,
      description: exp.description,
      technologies: exp.technologies,
      achievements: exp.achievements,
    })),
  };

  // Add education if present
  if (parsed.education.length > 0) {
    resumeData.education = parsed.education.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      year: edu.duration,
      details: edu.details.join('. '),
    }));
  }

  // Add skills if present
  if (Object.keys(parsed.skills).length > 0) {
    resumeData.skills = parsed.skills;
  }

  fs.writeFileSync(resumePath, JSON.stringify(resumeData, null, 4), 'utf-8');
  console.log(`✓ Wrote resume.json (${parsed.experience.length} experiences, ${parsed.education.length} education entries)`);
}

/**
 * Write parsed data to career.json (matches Experience schema)
 */
function writeCareerJson(parsed: ParsedResume): void {
  const careerPath = path.join(process.cwd(), 'app/data/career.json');

  const careerData = {
    career: parsed.experience.map(exp => {
      // Parse duration into start/end
      const { start, end } = parseDuration(exp.duration);
      return {
        name: exp.company,
        href: '',
        title: exp.position,
        logo: '',
        start,
        ...(end ? { end } : {}),
        description: exp.achievements.length > 0 ? exp.achievements : [exp.description],
        links: [],
      };
    }),
  };

  fs.writeFileSync(careerPath, JSON.stringify(careerData, null, 2), 'utf-8');
  console.log(`✓ Wrote career.json (${careerData.career.length} entries)`);
}

/**
 * Write parsed data to education.json (matches Experience schema)
 */
function writeEducationJson(parsed: ParsedResume): void {
  const educationPath = path.join(process.cwd(), 'app/data/education.json');

  const educationData = {
    education: parsed.education.map(edu => {
      const { start, end } = parseDuration(edu.duration);
      return {
        name: edu.institution,
        href: '',
        title: edu.degree,
        logo: '',
        start,
        end: end || '',
        description: edu.details,
        links: [],
      };
    }),
  };

  fs.writeFileSync(educationPath, JSON.stringify(educationData, null, 2), 'utf-8');
  console.log(`✓ Wrote education.json (${educationData.education.length} entries)`);
}

/**
 * Parse a duration string like "Aug 2025 - Present" into { start, end }
 */
function parseDuration(duration: string): { start: string; end?: string } {
  if (!duration) return { start: '' };
  
  const parts = duration.split(/\s*[-–—]\s*/);
  return {
    start: parts[0]?.trim() || '',
    end: parts[1]?.trim() === 'Present' ? undefined : parts[1]?.trim(),
  };
}

// ─── Main entry points ───────────────────────────────────────────────────────

/**
 * Find the PDF resume in /public
 */
export function findResumePDF(): string | null {
  const publicDir = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(publicDir)) {
    console.warn('public/ directory not found');
    return null;
  }

  const files = fs.readdirSync(publicDir);
  const pdfFiles = files.filter(f => 
    f.toLowerCase().endsWith('.pdf') && 
    f.toLowerCase().includes('resume')
  );

  if (pdfFiles.length === 0) {
    // Fall back to any PDF
    const anyPdf = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    if (anyPdf.length > 0) {
      return path.join(publicDir, anyPdf[0]);
    }
    return null;
  }

  return path.join(publicDir, pdfFiles[0]);
}

/**
 * Parse the PDF resume and return the structured data
 * (does NOT write to files — call writeAllJsonFiles for that)
 */
export async function parseResumePDF(pdfPath?: string): Promise<ParsedResume> {
  const resolvedPath = pdfPath || findResumePDF();
  if (!resolvedPath) {
    throw new Error('No PDF resume found in /public. Place a file like "Resume.pdf" there.');
  }

  console.log(`📄 Parsing PDF: ${resolvedPath}`);
  const rawText = await extractTextFromPDF(resolvedPath);
  console.log(`📝 Extracted ${rawText.length} characters of text`);

  const parsed = parseResumeText(rawText);
  console.log(`✅ Parsed: ${parsed.experience.length} experiences, ${parsed.education.length} education, ${Object.keys(parsed.skills).length} skill categories, ${parsed.projects.length} projects`);

  return parsed;
}

/**
 * Write all JSON data files from a parsed resume.
 * Set `merge: true` to keep existing manually-curated fields (logos, hrefs, links)
 * and only update content fields from the PDF.
 */
export function writeAllJsonFiles(parsed: ParsedResume, options: { merge?: boolean } = {}): void {
  const { merge = true } = options;

  if (merge) {
    mergeAndWriteCareerJson(parsed);
    mergeAndWriteEducationJson(parsed);
  } else {
    writeCareerJson(parsed);
    writeEducationJson(parsed);
  }
  // resume.json is always overwritten (it's the RAG source-of-truth from the PDF)
  writeResumeJson(parsed);
}

/**
 * Merge parsed data into existing career.json, preserving logos/hrefs/links
 */
function mergeAndWriteCareerJson(parsed: ParsedResume): void {
  const careerPath = path.join(process.cwd(), 'app/data/career.json');
  let existing: any = { career: [] };

  try {
    if (fs.existsSync(careerPath)) {
      existing = JSON.parse(fs.readFileSync(careerPath, 'utf-8'));
    }
  } catch { /* ignore */ }

  const existingMap = new Map<string, any>();
  for (const job of existing.career || []) {
    existingMap.set(normalizeKey(job.name, job.title), job);
  }

  const merged = parsed.experience.map(exp => {
    const { start, end } = parseDuration(exp.duration);
    const key = normalizeKey(exp.company, exp.position);
    const prev = existingMap.get(key);
    
    return {
      name: exp.company,
      href: prev?.href || '',
      title: exp.position,
      logo: prev?.logo || '',
      start,
      ...(end ? { end } : {}),
      description: exp.achievements.length > 0 ? exp.achievements : [exp.description],
      links: prev?.links || [],
    };
  });

  fs.writeFileSync(careerPath, JSON.stringify({ career: merged }, null, 2), 'utf-8');
  console.log(`✓ Merged career.json (${merged.length} entries, preserved logos/hrefs/links)`);
}

/**
 * Merge parsed data into existing education.json, preserving logos/hrefs/links
 */
function mergeAndWriteEducationJson(parsed: ParsedResume): void {
  const educationPath = path.join(process.cwd(), 'app/data/education.json');
  let existing: any = { education: [] };

  try {
    if (fs.existsSync(educationPath)) {
      existing = JSON.parse(fs.readFileSync(educationPath, 'utf-8'));
    }
  } catch { /* ignore */ }

  const existingMap = new Map<string, any>();
  for (const edu of existing.education || []) {
    existingMap.set(normalizeKey(edu.name, edu.title), edu);
  }

  const merged = parsed.education.map(edu => {
    const { start, end } = parseDuration(edu.duration);
    const key = normalizeKey(edu.institution, edu.degree);
    const prev = existingMap.get(key);

    return {
      name: edu.institution,
      href: prev?.href || '',
      title: edu.degree,
      logo: prev?.logo || '',
      start,
      end: end || '',
      description: edu.details,
      links: prev?.links || [],
    };
  });

  fs.writeFileSync(educationPath, JSON.stringify({ education: merged }, null, 2), 'utf-8');
  console.log(`✓ Merged education.json (${merged.length} entries, preserved logos/hrefs/links)`);
}

function normalizeKey(...parts: string[]): string {
  return parts.map(p => p.toLowerCase().replace(/\s+/g, ' ').trim()).join('::');
}

/**
 * Full pipeline: parse PDF → write JSON files
 */
export async function syncPDFToJsonFiles(options: {
  pdfPath?: string;
  merge?: boolean;
} = {}): Promise<ParsedResume> {
  const parsed = await parseResumePDF(options.pdfPath);
  writeAllJsonFiles(parsed, { merge: options.merge ?? true });
  return parsed;
}
