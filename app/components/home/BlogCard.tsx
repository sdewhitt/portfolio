import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import { Clock, Calendar, ArrowRight } from "lucide-react";

export function BlogCard({ post }: { post: BlogPost }) {
  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="h-full rounded-2xl border border-border p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-foreground/20 bg-background flex flex-col gap-4">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-foreground/5 border border-border px-3 py-1 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold leading-snug group-hover:text-muted-foreground transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-base text-muted-foreground leading-relaxed flex-1">
            {post.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground" />
        </div>
      </article>
    </Link>
  );
}
