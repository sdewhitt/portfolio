import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/home/BlogCard";
import { ArrowRight } from "lucide-react";

export function BlogPreview() {
  const posts = getAllPosts().slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <section id="blog" className="scroll-mt-20 mt-10">
      <div className="mb-12 flex items-end justify-between gap-4">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">From the Blog</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Thoughts on software, things I&apos;m building, and stuff I&apos;m learning.
          </p>
        </div>
        <Link
          href="/blog"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          All posts <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <div
            key={post.slug}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <BlogCard post={post} />
          </div>
        ))}
      </div>

      {/* Mobile "all posts" link */}
      <div className="mt-8 sm:hidden">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          All posts <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
