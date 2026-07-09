import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";
import { ContactInquiryForm } from "@/components/ContactInquiryForm";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Master CBC" }, { name: "description", content: "Get in touch with the Master CBC team." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h1 className="text-4xl font-bold">Contact Us</h1>
            <p className="mt-4 text-lg text-muted-foreground">Schools that want to join Master CBC, request a demo, or ask about onboarding can use the form below.</p>
            <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left">
              <div className="text-sm text-muted-foreground">Support</div>
              <a className="mt-1 block text-lg font-semibold text-primary" href="mailto:support@mastercbc.co.ke">support@mastercbc.co.ke</a>
              <div className="mt-4 text-sm text-muted-foreground">Sales</div>
              <a className="mt-1 block text-lg font-semibold text-primary" href="mailto:sales@mastercbc.co.ke">sales@mastercbc.co.ke</a>
            </div>
            <Link to="/" className="mt-8 inline-block text-sm text-primary hover:underline">← Back to homepage</Link>
          </div>
          <ContactInquiryForm />
        </div>
      </section>
      <PublicFooter />
    </div>
  ),
});
