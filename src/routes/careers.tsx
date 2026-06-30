import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";

export const Route = createFileRoute("/careers")({
  head: () => ({ meta: [{ title: "Careers — Master CBC" }, { name: "description", content: "Join the team building the analytics backbone of Kenyan education." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h1 className="text-4xl font-bold">Careers</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          We&apos;re a small, focused team working out of Nairobi. We&apos;re always interested in talking to engineers, educators, and customer success folks who care about Kenyan schools.
        </p>
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <div className="text-sm font-semibold">Send your CV to</div>
          <a href="mailto:careers@mastercbc.co.ke" className="text-primary">careers@mastercbc.co.ke</a>
        </div>
      </section>
      <PublicFooter />
    </div>
  ),
});
