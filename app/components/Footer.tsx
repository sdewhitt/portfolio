export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-6 py-6 text-sm text-muted-foreground flex items-center justify-between">
        <p>© {new Date().getFullYear()} Seth DeWhitt. All rights reserved.</p>

        <div className="flex gap-4">
          <a href="https://github.com/sdewhitt" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          <a href="https://www.linkedin.com/in/seth-dewhitt" target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
