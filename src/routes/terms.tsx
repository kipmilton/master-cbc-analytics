import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Calendar, FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Master CBC" },
      { name: "description", content: "Master CBC Terms of Service for Primary & Secondary Schools, Principals, Teachers, and Administrative Staff in Kenya." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Legal Agreement — Kenyan Educational System
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Terms of Service
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Effective Date: 12 August 2026
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Applicable to Primary &amp; Secondary Schools, Principals, Teachers &amp; Staff
            </span>
          </div>
        </div>

        <Card className="border-border/70 bg-card mb-8">
          <CardContent className="p-6 text-sm text-muted-foreground leading-relaxed">
            By registering for, accessing, or using the Master CBC platform (&ldquo;Platform,&rdquo; &ldquo;Service,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you (&ldquo;User,&rdquo; &ldquo;School,&rdquo; &ldquo;Principal,&rdquo; or &ldquo;Teacher&rdquo;) enter into a legally binding agreement to comply with and be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not access or use the Platform.
          </CardContent>
        </Card>

        <article className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Definitions</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">&ldquo;Platform&rdquo;:</strong> The Master CBC web and mobile application, including all associated dashboards, APIs, report-generation tools, and related services.</li>
              <li><strong className="text-foreground">&ldquo;School&rdquo;:</strong> The institution that registers for the Platform and on whose behalf a Principal or Head of Institution accepts these Terms.</li>
              <li><strong className="text-foreground">&ldquo;School Administrator&rdquo;:</strong> A Principal or Deputy Principal account holder with school-wide administrative visibility.</li>
              <li><strong className="text-foreground">&ldquo;Staff Account&rdquo;:</strong> Any Teacher or administrative account provisioned under a School&apos;s instance of the Platform.</li>
              <li><strong className="text-foreground">&ldquo;Student Data&rdquo;:</strong> Any information relating to an identified or identifiable learner processed through the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Description of Service</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Master CBC is a local school grading, mark-entry, report card generation, and exam analysis platform designed for institutions operating within the Kenyan educational system. The Platform supports both the legacy 8-4-4 system and the Competency-Based Curriculum (CBC) framework (spanning Junior Secondary Grades 7–9 and Senior Secondary Grades 10–12).
            </p>
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
              <strong className="text-foreground">Local Scope Disclaimer:</strong> Master CBC is a self-contained administrative and internal academic tool. It is not affiliated with, connected to, or integrated into national examination or placement bodies such as the Kenya National Examinations Council (KNEC) or KUCCPS.
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. Institutional Accounts &amp; Seat Limits</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Registration Approval:</strong> School applications are reviewed and verified before account activation.</li>
              <li><strong className="text-foreground">Administrative Seats:</strong> Each approved school is strictly permitted one (1) Principal Account and up to two (2) Deputy Principal Accounts (Deputy Principal Academics and Deputy Principal Administration / Dean of Studies).</li>
              <li><strong className="text-foreground">Authority to Bind:</strong> The individual registering a school warrants that they are a legally authorized institutional representative with full power to bind the school to these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Staff Accounts &amp; Password Security</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>School Administrators may onboard teachers via email invitations or direct manual entry.</li>
              <li>When teachers are added manually with temporary passwords, users must complete a password update upon first sign-in.</li>
              <li>Users are responsible for preserving the confidentiality of their login credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Data Ownership &amp; Acceptable Use</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">School Data Ownership:</strong> The school retains full ownership of all institutional data, student records, raw examination marks, and generated report cards.</li>
              <li><strong className="text-foreground">Acceptable Use:</strong> Users agree not to attempt unauthorized access to another institution&apos;s records, extract core source code, or upload false records.</li>
            </ul>
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="text-xl font-bold text-foreground">6. Contact Information</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If you have any questions regarding these Terms of Service, please contact our administrative team at:
            </p>
            <a href="mailto:support@mastercbc.co.ke" className="mt-2 inline-block font-semibold text-primary hover:underline">
              support@mastercbc.co.ke
            </a>
          </section>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
