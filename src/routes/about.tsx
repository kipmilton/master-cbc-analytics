import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";
import { LayoutGrid, ListChecks, Users, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Master CBC" },
      { name: "description", content: "Our mission: built in Nairobi staff rooms to eliminate late-night marksheets and empower teachers." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const navy = "text-[#16213E]";
  const orange = "text-[#F97316]";
  const orangeBg = "bg-[#F97316]";

  const features = [
    { icon: LayoutGrid, label: "CBC rubrics for Junior & Senior Secondary" },
    { icon: ListChecks, label: "KCSE-style grading for Form 3–4" },
    { icon: Users, label: "Two admin seats per school (Principal & Deputy)" },
    { icon: ShieldCheck, label: "Complete school data privacy — no school sees another's data" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <h1 className={`text-4xl font-extrabold tracking-tight ${navy}`}>
            About Master CBC
          </h1>

          <blockquote className="mt-8 border-l-4 border-[#F97316] pl-5 bg-slate-50 py-3 rounded-r-lg">
            <p className={`text-xl font-serif leading-relaxed ${navy}`}>
              Master CBC was born in Nairobi staff rooms — watching teachers lose
              whole evenings tallying marks while principals waited days for a
              class mean.
            </p>
          </blockquote>

          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-600">
            We built one platform that respects how Kenyan schools actually run:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${orange}`} />
                <p className="text-sm leading-relaxed text-slate-600 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Before / After Card */}
          <div className="mt-12 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <div className="px-6 py-6 bg-white">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Before</p>
                <p className={`mt-2 text-3xl font-bold ${navy}`}>Days</p>
                <p className="mt-1 text-sm text-slate-500">
                  from exam done to a class mean
                </p>
              </div>
              <div className="bg-[#FFF7ED] px-6 py-6">
                <p className="text-sm font-semibold text-[#F97316] uppercase tracking-wider">After</p>
                <p className={`mt-2 text-3xl font-bold ${navy}`}>Minutes</p>
                <p className="mt-1 text-sm text-slate-600">
                  from exam done to actionable insight
                </p>
              </div>
            </div>
          </div>

          <p className="mt-10 text-[15px] text-slate-500 leading-relaxed">
            That&apos;s the goal, plainly: cut the time from exam done to actionable
            insight from days to minutes.
          </p>

          <div className="mt-8">
            <Link
              to="/signup"
              className={`inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold text-white ${orangeBg} hover:opacity-95 shadow-sm transition-all`}
            >
              See how it works
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
