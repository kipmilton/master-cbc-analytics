import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, BookOpenCheck, ShieldCheck, Users, GraduationCap, LineChart, Building2, CheckCircle2 } from "lucide-react";
import { testimonials } from "@/lib/mock-data";
import { ContactInquiryForm } from "@/components/ContactInquiryForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Master CBC — Performance Analytics for Kenyan Schools" },
      { name: "description", content: "Multi-tenant analytics and revision platform for Kenyan CBC (Grades 7-12) and 8-4-4 (Form 3-4) schools." },
      { property: "og:title", content: "Master CBC — Performance Analytics for Kenyan Schools" },
      { property: "og:description", content: "CBC rubric tracking, 8-4-4 grade analysis, and instant class mean computations." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <Hero />
      <Features />
      <Testimonials />
      <SocialProof />
      <ContactSection />
      <PublicFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-accent/40 via-background to-secondary/40" />
      <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -left-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-(--brand-blue)/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Multi-tenant • RLS enforced • Kenya-first
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Master <span className="text-primary">CBC</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
            Transform exam marks into clear, actionable performance insight — for every learning area, every stream, every term. Built for CBC Junior &amp; Senior Secondary and the 8-4-4 Form 3-4 system.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/signup">Get Started <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Login to your school</Link>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-6 border-t border-border pt-5 text-sm">
            <div><div className="text-2xl font-bold text-foreground">120+</div><div className="text-muted-foreground">Schools</div></div>
            <div><div className="text-2xl font-bold text-foreground">48k</div><div className="text-muted-foreground">Learners</div></div>
            <div><div className="text-2xl font-bold text-foreground">99.9%</div><div className="text-muted-foreground">Uptime</div></div>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-primary/10">
            <div className="rounded-xl bg-linear-to-br from-secondary to-background p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Grade 10 — Stream Performance</div>
                  <div className="text-lg font-semibold">Mid-Term Composite Mean</div>
                </div>
                <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">+4.2% MoM</div>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Grade 10 East", v: 78, color: "var(--brand-orange)" },
                  { name: "Grade 10 West", v: 71, color: "var(--brand-blue)" },
                  { name: "Grade 10 North", v: 63, color: "var(--brand-orange)" },
                  { name: "Grade 10 South", v: 58, color: "var(--brand-blue)" },
                ].map((r) => (
                  <div key={r.name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{r.name}</span><span className="text-muted-foreground">{r.v}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${r.v}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { l: "EE", v: 12, c: "bg-emerald-100 text-emerald-700" },
                  { l: "ME", v: 48, c: "bg-blue-100 text-blue-700" },
                  { l: "AE", v: 22, c: "bg-orange-100 text-orange-700" },
                  { l: "BE", v: 6, c: "bg-rose-100 text-rose-700" },
                ].map((t) => (
                  <div key={t.l} className={`rounded-md p-2 ${t.c}`}>
                    <div className="text-base font-bold">{t.v}</div><div>{t.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Users, title: "Multi-role access", body: "Super Admin, School Admin (2 seats), and unlimited Teachers — each with strictly scoped row-level access." },
    { icon: BookOpenCheck, title: "CBC rubric tracking", body: "Capture EE, ME, AE and BE per learning area for Grades 7-12 with auto-rolled-up insights." },
    { icon: GraduationCap, title: "8-4-4 grade analysis", body: "Form 3-4 percentage entry with KCSE-style grade conversion, mean score and mean points." },
    { icon: LineChart, title: "Instant class mean", body: "Composite stream mean is auto-computed the moment subject teachers submit their marks." },
    { icon: BarChart3, title: "Stream comparisons", body: "Side-by-side parallel-stream graphs: Grade 10 East vs West, Form 4 Blue vs Green." },
    { icon: ShieldCheck, title: "Bank-grade tenancy", body: "Total data isolation between schools via Supabase Auth + strict RLS. Your data stays yours." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Why choose Master CBC?</h2>
        <p className="mt-3 text-muted-foreground">A single platform that respects how Kenyan schools actually run — from staff room to principal's office.</p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <Card key={f.title} className="border-border/70 transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-secondary/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Loved by educators across Kenya</h2>
          <p className="mt-3 text-muted-foreground">Real feedback from principals and teachers in the classroom.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border/70">
              <CardContent className="p-6">
                <p className="text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                    {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
        <h2 className="text-center text-2xl font-semibold">Trusted by leading schools across Kenya</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">From Nairobi to Kisumu, Mombasa to Eldoret.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              <Building2 className="mr-2 h-4 w-4" /> School Logo
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="bg-secondary/40 py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">Talk to us</h2>
          <p className="mt-3 text-muted-foreground">Tell us about your school and we&apos;ll get you onboarded in under a week.</p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Free onboarding & teacher training",
              "Migration assistance from spreadsheets",
              "Dedicated WhatsApp support line",
              "Compliant with the Kenya Data Protection Act",
            ].map((p) => (
              <li key={p} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" />{p}</li>
            ))}
          </ul>
          <div className="mt-8 rounded-lg border border-border bg-card p-4 text-sm">
            <div className="font-semibold">support@mastercbc.co.ke</div>
            <div className="text-muted-foreground">Mon-Fri, 8am-6pm EAT</div>
          </div>
        </div>
        <ContactInquiryForm />
      </div>
    </section>
  );
}
