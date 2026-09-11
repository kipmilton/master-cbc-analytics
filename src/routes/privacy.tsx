import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Calendar, FileText } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Master CBC" },
      { name: "description", content: "Master CBC Privacy Policy under the Kenya Data Protection Act, 2019." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Compliance Framework: Kenya Data Protection Act (DPA), 2019
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Effective Date: 12 August 2026
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> For Schools, Principals, Deputy Principals, Teachers &amp; Staff in Kenya
            </span>
          </div>
        </div>

        <Card className="border-border/70 bg-card mb-8">
          <CardContent className="p-6 text-sm text-muted-foreground leading-relaxed">
            By creating an account, signing in, or using the Master CBC platform, you confirm that you have read, understood, and agree to be bound by this Privacy Policy on behalf of yourself and your institution.
          </CardContent>
        </Card>

        <article className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Master CBC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects the privacy of schools, teachers, administrators, and students. This Privacy Policy details how we collect, process, store, protect, and disclose personal and academic data when using our Platform. It applies to all Schools, Principals, Deputy Principals, Teachers, and other authorized users who access Master CBC, and should be read together with our Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Roles Under the Data Protection Act, 2019</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>
                <strong className="text-foreground">Data Controller:</strong> The School (represented by the Principal and Administrators) acts as the Data Controller regarding all student personal data, teacher lists, and examination scores uploaded to Master CBC. The School determines what data is collected and for what internal academic purpose.
              </li>
              <li>
                <strong className="text-foreground">Data Processor:</strong> Master CBC acts as the Data Processor, processing personal data strictly under the instruction of the School and in accordance with the functionality of the Platform. We do not determine the purposes for which student or staff data is collected beyond operating the Service.
              </li>
              <li>
                <strong className="text-foreground">MasterCBC Admin Oversight:</strong> MasterCBC Admins may access platform-level metadata (such as account status and system logs) for security, support, and compliance purposes, but do not access a School&apos;s academic records except as necessary to provide support or investigate a reported issue.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. Information We Collect</h2>
            <p className="mt-2 text-sm text-muted-foreground">We collect the following categories of data necessary to provide school grading and exam analytics services:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Administrative &amp; Staff Data:</strong> Full Name, Institutional Email Address, Phone Number, School Role (Principal, Deputy Principal, Teacher), Assigned Streams, and Assigned Subjects.</li>
              <li><strong className="text-foreground">Student Data:</strong> Student Name, Admission Number, Gender, Year of Birth, Assigned Class/Stream, Elective/Pathway Selections (Senior Secondary), and Historic Assessment Scores/Rubric Ratings.</li>
              <li><strong className="text-foreground">System &amp; Technical Logs:</strong> IP addresses, login timestamps, device profiles, browser type, and system audit logs to preserve data security and verify role-based operations.</li>
              <li><strong className="text-foreground">Account &amp; Billing Information:</strong> Where applicable, institutional billing contacts and subscription details, excluding sensitive payment card data.</li>
              <li><strong className="text-foreground">Support Communications:</strong> Records of correspondence between School staff and Master CBC Support for quality assurance and issue resolution.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Legal Basis for Processing</h2>
            <p className="mt-2 text-sm text-muted-foreground">Under the Kenya Data Protection Act, 2019, Master CBC processes personal data on the following legal bases:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Performance of a Contract:</strong> Processing necessary to deliver the grading, reporting, and analytics functionality the School has signed up for.</li>
              <li><strong className="text-foreground">Legitimate Interests:</strong> Processing necessary for platform security, fraud prevention, and service improvement.</li>
              <li><strong className="text-foreground">Legal Obligation:</strong> Processing necessary to comply with applicable Kenyan laws and regulatory requirements.</li>
              <li><strong className="text-foreground">Consent:</strong> Where required for specific, non-essential processing activities, consent will be obtained from the relevant School Administrator.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. How We Use Your Information</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Authenticating users and enforcing strict role-based dashboard access.</li>
              <li>Calculating overall class means, subject performance trends, point averages, and CBC performance bands (EE, ME, AE, BE).</li>
              <li>Generating printable score sheets, stream comparisons, and student report cards.</li>
              <li>Sending automated system invitations and password reset emails.</li>
              <li>Preventing unauthorized access across school boundaries.</li>
              <li>Monitoring system performance, diagnosing technical issues, and improving platform reliability.</li>
              <li>Communicating important service updates, maintenance notices, or policy changes to School Administrators.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">6. Student Data &amp; Children&apos;s Privacy</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We recognize that a significant portion of the data processed through the Platform relates to learners who are minors. Student accounts are not created or managed directly by students; all Student Data is entered and managed by School Administrators and Teachers acting on behalf of the School, which serves as the responsible Data Controller for that data. Master CBC does not knowingly collect data directly from students, does not permit students to create their own login credentials, and does not use Student Data for marketing or advertising purposes of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">7. Data Isolation &amp; Security Controls</h2>
            <p className="mt-2 text-sm text-muted-foreground">We apply enterprise-grade security controls to ensure data protection:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Strict School Data Isolation:</strong> All database queries are isolated at the database level by a unique school identifier. No user, teacher, or principal can query, view, or alter records belonging to a different school.</li>
              <li><strong className="text-foreground">Encryption:</strong> Data in transit is protected using modern TLS/SSL encryption protocols.</li>
              <li><strong className="text-foreground">Password Policy:</strong> Mandatory password updates are enforced on all manually provisioned teacher accounts upon initial login.</li>
              <li><strong className="text-foreground">Access Logging:</strong> System audit logs record login activity and key administrative actions to support security monitoring.</li>
              <li><strong className="text-foreground">Least-Privilege Access:</strong> Internal personnel access to production data is restricted to authorized engineers strictly on a need-to-know basis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">8. Data Sharing &amp; Third-Party Providers</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We do not sell, rent, trade, or monetize any student, teacher, or institutional data to third parties or advertisers. Data is shared strictly with essential infrastructure providers (such as cloud database hosting and transactional email dispatch services) necessary to operate the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">9. Your Data Protection Rights</h2>
            <p className="mt-2 text-sm text-muted-foreground">Under the Kenya Data Protection Act, 2019, you have the right to request access to, correction of, or deletion of your personal data held on the platform. Authorized School Administrators can export student rosters, score matrices, and exam analysis sheets into printable formats or spreadsheets at any time.</p>
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="text-xl font-bold text-foreground">10. Contact Us</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If you have any questions regarding this Privacy Policy, please contact our administrative team at:
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
