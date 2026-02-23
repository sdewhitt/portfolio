import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  readingTime: string;
  coverImage?: string;
  draft?: boolean;
}

export interface BlogPostWithContent extends BlogPost {
  content: string;
}

function ensureDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
}

export function getAllPosts(): BlogPost[] {
  ensureDir();
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts = files
    .map((filename) => {
      const slug = filename.replace(/\.mdx?$/, "");
      const filePath = path.join(POSTS_DIR, filename);
      const source = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(source);

      return {
        slug,
        title: data.title ?? slug,
        date: data.date ? String(data.date) : "",
        excerpt: data.excerpt ?? "",
        tags: data.tags ?? [],
        readingTime: readingTime(content).text,
        coverImage: data.coverImage,
        draft: data.draft ?? false,
      } satisfies BlogPost;
    })
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return posts;
}

export function getPostBySlug(slug: string): BlogPostWithContent | null {
  ensureDir();
  const extensions = [".mdx", ".md"];
  for (const ext of extensions) {
    const filePath = path.join(POSTS_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      const source = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(source);
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ? String(data.date) : "",
        excerpt: data.excerpt ?? "",
        tags: data.tags ?? [],
        readingTime: readingTime(content).text,
        coverImage: data.coverImage,
        draft: data.draft ?? false,
        content,
      };
    }
  }
  return null;
}
