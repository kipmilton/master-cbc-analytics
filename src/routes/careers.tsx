import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";
import {
  Mail,
  MapPin,
  Users,
  Code2,
  GraduationCap,
  HeadphonesIcon,
} from "lucide-react";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Master CBC" },
      { name: "description", content: "Join the team building the analytics backbone of Kenyan education in Nairobi." },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  const navy = "text-[#16213E]";
  const orange = "text-[#F97316]";
  const orangeBg = "bg-[#F97316]";

  const values = [
    {
      icon: Users,
      title: "A small, direct team",
      body: "No layers to get lost in. You'll talk to the people using what you build.",
    },
    {
      icon: MapPin,
      title: "Rooted in Nairobi",
      body: "We work from here, on problems we've watched teachers deal with firsthand.",
    },
    {
      icon: GraduationCap,
      title: "Work that reaches classrooms",
      body: "What you ship changes how a principal spends their Monday morning.",
    },
  ];

  const roles = [
    {
      icon: Code2,
      title: "Engineering",
      body: "Building the platform teachers and admins use every day.",
    },
    {
      icon: GraduationCap,
      title: "Education & curriculum",
      body: "Making sure CBC and 8-4-4 grading logic actually fits how schools grade.",
    },
    {
      icon: HeadphonesIcon,
      title: "Customer success",
      body: "Helping schools get set up and stay unblocked.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <h1 className={`text-4xl font-extrabold tracking-tight ${navy}`}>
            Careers
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-600">
            We&apos;re a small, focused team working out of Nairobi. We&apos;re always
            interested in talking to engineers, educators, and customer success
            folks who care about Kenyan schools.
          </p>

          {/* Value strip */}
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <Icon className={`h-5 w-5 ${orange}`} strokeWidth={2} />
                <p className={`mt-3 text-sm font-semibold ${navy}`}>{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {body}
                </p>
              </div>
            ))}
          </div>

          {/* Areas we hire for */}
          <div className="mt-14">
            <p className={`text-sm font-semibold ${navy}`}>
              Where we typically hire
            </p>
            <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {roles.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <p className={`text-sm font-semibold ${navy}`}>{title}</p>
                    <p className="text-sm text-slate-500">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CV card */}
          <div className="mt-8 rounded-xl border border-orange-200 bg-[#FFF7ED] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${orangeBg}`}>
                <Mail className="h-4 w-4 text-white" />
              </div>
              <p className={`text-sm font-semibold ${navy}`}>Send your CV to</p>
            </div>
            <a
              href="mailto:careers@mastercbc.co.ke"
              className="mt-3 inline-block text-[17px] font-medium text-[#F97316] hover:underline"
            >
              careers@mastercbc.co.ke
            </a>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
