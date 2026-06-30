import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Master CBC" }, { name: "description", content: "Our mission: build trustworthy performance analytics for every Kenyan school." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h1 className="text-4xl font-bold">About Master CBC</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Master CBC was born in Nairobi staff rooms. We noticed teachers losing whole evenings tallying marks while principals waited days for a class mean. We built one platform that respects how Kenyan schools actually run — CBC rubrics for Junior and Senior Secondary, KCSE-style grading for Form 3-4, two admin seats per school for the Principal and Deputy, and proper row-level security so no school ever sees another&apos;s data.
        </p>
        <p className="mt-4 text-lg text-muted-foreground">
          Our goal is simple: cut the time from "exam done" to "actionable insight" from days to minutes.
        </p>
      </section>
      <PublicFooter />
    </div>
  ),
});
