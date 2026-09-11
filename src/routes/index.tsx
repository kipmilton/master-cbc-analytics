import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, BookOpenCheck, ShieldCheck, Users, GraduationCap, LineChart, Building2, CheckCircle2 } from "lucide-react";
const testimonials = [
  { name: "Mr. Wycliffe Onyango", title: "Principal, Lakeside Secondary", quote: "Master CBC cut our results processing from three days to under an hour. Our staff actually look forward to exam season now." },
  { name: "Mrs. Hellen Wairimu", title: "Deputy Principal, Karen Girls", quote: "The stream comparisons are pure gold. We finally see exactly where each class needs attention." },
  { name: "Mr. Samuel Kiptoo", title: "Teacher, Eldoret Boys", quote: "Entering CBC rubric marks is finally simple. The instant analytics keep me honest as a subject teacher." },
  { name: "Ms. Beatrice Njoki", title: "Principal, Thika Hill Academy", quote: "Two admin seats with shared visibility is exactly how our office runs. It just fits Kenyan schools." },
];
import { ContactInquiryForm } from "@/components/ContactInquiryForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Master CBC — Performance Analytics for Kenyan Schools" },
      { name: "description", content: "Performance analytics and revision platform for Kenyan CBC (Grades 7-12) and 8-4-4 (Form 3-4) schools." },
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
      <FoundingSchools />
      <WhyWeBuiltThis />
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
            <div><div className="text-2xl font-bold text-foreground">5+</div><div className="text-muted-foreground">Schools</div></div>
            <div><div className="text-2xl font-bold text-foreground">1k</div><div className="text-muted-foreground">Learners</div></div>
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
  const ledgerItems = [
    {
      idx: "01",
      icon: Users,
      title: "Role-based staff access",
      body: "The school principal can add up to two deputy principals and the dean of studies, plus teachers assigned only to their own classes and subjects.",
      evidence: (
        <div className="flex flex-wrap gap-1.5 justify-end">
          <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground">Principal</span>
          <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground">Deputies & Dean</span>
          <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground">Teachers</span>
        </div>
      ),
    },
    {
      idx: "02",
      icon: BookOpenCheck,
      title: "CBC rubric tracking",
      body: "Exceeding, Meeting, Approaching, and Below Expectation, captured per learning area for Grades 7–12, with the roll-up done for you.",
      evidence: (
        <div className="flex gap-2">
          {[
            { label: "EE", color: "#2F9E63" },
            { label: "ME", color: "#3B5B92" },
            { label: "AE", color: "#D98A2B" },
            { label: "BE", color: "#C1554B" },
          ].map((r) => (
            <div key={r.label} className="flex min-w-8 flex-col items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-[10px] font-bold text-muted-foreground">{r.label}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      idx: "03",
      icon: GraduationCap,
      title: "8-4-4 grade analysis",
      body: "Form 3 and 4 percentage entry converts straight to KCSE-style grades, with mean score and mean points calculated for you.",
      evidence: (
        <div className="flex gap-1.5">
          {["A", "B+", "C+"].map((t) => (
            <span key={t} className="rounded bg-muted px-2 py-1 text-xs font-bold text-foreground font-mono">
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      idx: "04",
      icon: LineChart,
      title: "Instant class mean",
      body: "The moment a subject teacher submits marks, the class and stream composite mean recalculates — no waiting on a spreadsheet.",
      evidence: (
        <div className="flex h-7 items-end gap-1">
          {[10, 16, 12, 22, 18, 26].map((h, i) => (
            <span key={i} className="w-1.5 rounded-xs bg-primary" style={{ height: `${h}px` }} />
          ))}
        </div>
      ),
    },
    {
      idx: "05",
      icon: BarChart3,
      title: "Stream comparisons",
      body: "Line up Grade 10 East against West, or Form 4 Blue against Green, side by side, term over term.",
      evidence: (
        <div className="w-40 sm:w-44 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: "78%" }} />
            </div>
            <span className="w-7 text-right text-[10.5px] text-muted-foreground font-mono">78%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground/70" style={{ width: "71%" }} />
            </div>
            <span className="w-7 text-right text-[10.5px] text-muted-foreground font-mono">71%</span>
          </div>
        </div>
      ),
    },
    {
      idx: "06",
      icon: ShieldCheck,
      title: "Complete school data privacy",
      body: "Built so every school's records are completely isolated and private from any other school by default — not by configuration.",
      evidence: (
        <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
          100% Private
        </span>
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-10 max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Built around how a Kenyan staff room actually runs
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Every role sees exactly their own record — the principal&apos;s office, the staff room, and every subject teacher&apos;s mark sheet, kept in one system instead of six spreadsheets.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4 text-xs sm:text-sm">
          <span className="text-muted-foreground">Master CBC — platform record</span>
          <span className="font-semibold text-foreground">Term 2, 2026</span>
        </div>

        <div className="divide-y divide-border">
          {ledgerItems.map((item) => (
            <div key={item.idx} className="grid grid-cols-[auto_1fr] sm:grid-cols-[28px_24px_1fr_auto] gap-4 sm:gap-6 items-center p-5 sm:p-6">
              <div className="text-xs font-mono text-muted-foreground">{item.idx}</div>
              <div className="hidden sm:flex text-foreground items-center justify-center">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xl">{item.body}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center justify-start sm:justify-end">
                {item.evidence}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 text-sm font-semibold">
        <Link to="/signup" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          See how a report card gets built, start to finish <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function FoundingSchools() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-10 rounded-2xl bg-[#1B3A66] p-8 sm:p-12 text-white lg:grid-cols-[1.15fr_0.85fr] lg:items-center shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Join as a founding school</h2>
          <p className="mt-4 text-base text-[#C7D0E2] sm:text-lg max-w-xl leading-relaxed">
            Master CBC is new. Instead of asking you to trust a track record we don&apos;t have yet, we&apos;re asking a handful of schools to help us build the right one — and giving them the best terms we&apos;ll ever offer in return.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-[#E4E9F2]">
            {[
              "Free access for your first full term",
              "Direct line to the founder for setup and support",
              "Your feedback shapes what we build next",
            ].map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#E8672E] mt-0.5" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="bg-[#E8672E] hover:bg-[#C6511F] text-white font-semibold px-6 py-3 border-none">
              <Link to="/signup">Apply as a founding school</Link>
            </Button>
            <span className="text-xs text-[#9FAAC2]">Takes 2 minutes — we&apos;ll call you back</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/12 bg-white/5 p-6 sm:p-8 flex flex-col justify-center">
          <span className="text-xs text-[#9FAAC2] font-medium">Founding cohort</span>
          <div className="mt-2 text-4xl sm:text-5xl font-bold text-white font-serif">
            0<span className="text-xl sm:text-2xl font-sans text-[#9FAAC2] font-normal">&nbsp;/&nbsp;20 spots</span>
          </div>
          <div className="mt-2 text-sm text-[#9FAAC2]">Open for Term 3, 2026</div>
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/12">
            <div className="h-full w-0 rounded-full bg-[#E8672E]" />
          </div>
          <div className="mt-3 text-xs text-[#7C88A3]">Closes once 20 schools are onboarded</div>
        </div>
      </div>
    </section>
  );
}

function WhyWeBuiltThis() {
  const cards = [
    {
      num: "01",
      title: "Built for CBC, not adapted to it",
      body: "Rubric grading (EE/ME/AE/BE) and 8-4-4 percentage grading live in the same system, because most schools are running both right now.",
    },
    {
      num: "02",
      title: "Every school's data stands alone",
      body: "Built so one school's records are completely private and isolated from another — enforced at every level of the system.",
    },
    {
      num: "03",
      title: "Priced for how schools actually pay",
      body: "No per-student licensing that punishes you for growing. One school, one flat plan, unlimited teachers.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 border-t border-border">
      <div className="mb-10 max-w-2xl">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Why we&apos;re building this</h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          We&apos;re not claiming a track record yet — here&apos;s what&apos;s actually true about the product today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.num} className="border-border/70 bg-card">
            <CardContent className="p-6">
              <span className="font-serif text-sm font-semibold text-primary">{c.num}</span>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-6 sm:p-8">
        <span className="text-xs font-medium text-muted-foreground">A note from the founder</span>
        <p className="mt-3 text-base text-foreground italic leading-relaxed">
          &ldquo;As a trained teacher, have spent my career teaching computer science. Every report card season looked the same — teachers hunched over mark sheets late into the evening, principals waiting on results they couldn&apos;t see coming, and no easy way for any of us to tell if a class was actually improving until it was too late to do anything about it. I built Master CBC because grading and lesson management shouldn&apos;t take more effort than teaching does.&rdquo;
        </p>
        <div className="mt-4 text-sm font-medium text-muted-foreground">
          — Sophia Kariuki, Founder
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
