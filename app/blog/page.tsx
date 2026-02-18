import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/home/BlogCard";

export const metadata = {
  title: "Blog",
  description: "Thoughts on software, things I'm building, and stuff I'm learning.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="bg-background text-foreground font-sans">
      <main className="container mx-auto px-6 py-20 md:py-28">
        <div className="mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">All Blog Posts</h1>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet — check back soon.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
