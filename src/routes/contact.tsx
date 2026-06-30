import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Master CBC" }, { name: "description", content: "Get in touch with the Master CBC team." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 text-center">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="mt-4 text-muted-foreground">Use the contact form on our homepage, or email us directly.</p>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left">
          <div className="text-sm text-muted-foreground">Support</div>
          <a className="text-lg font-semibold text-primary" href="mailto:support@mastercbc.co.ke">support@mastercbc.co.ke</a>
          <div className="mt-4 text-sm text-muted-foreground">Sales</div>
          <a className="text-lg font-semibold text-primary" href="mailto:sales@mastercbc.co.ke">sales@mastercbc.co.ke</a>
        </div>
        <Link to="/" className="mt-8 inline-block text-sm text-primary hover:underline">← Back to homepage</Link>
      </section>
      <PublicFooter />
    </div>
  ),
});
