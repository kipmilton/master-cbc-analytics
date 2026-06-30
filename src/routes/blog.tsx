import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — Master CBC" }, { name: "description", content: "Insights on CBC, school analytics, and education in Kenya." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h1 className="text-4xl font-bold">Blog</h1>
        <p className="mt-3 text-muted-foreground">Stories, guides, and updates from the Master CBC team.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {["From Spreadsheets to Stream Comparisons", "Understanding CBC Rubrics in Senior Secondary", "Three Things Every Deputy Principal Should Track Weekly"].map((t) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6">
              <div className="text-xs text-primary">Coming soon</div>
              <h3 className="mt-2 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Subscribe to be notified when we publish.</p>
            </div>
          ))}
        </div>
      </section>
      <PublicFooter />
    </div>
  ),
});
