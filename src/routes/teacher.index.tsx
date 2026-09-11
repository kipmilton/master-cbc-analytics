import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard, PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useSchoolData } from "@/hooks/use-school-data";
import { EXAM_TERMS, examMean } from "@/lib/analytics";
import { getGreeting } from "@/lib/utils";
import { GraduationCap, Users, ClipboardCheck, ArrowRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/teacher/")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — Master CBC" },
      { name: "description", content: "Your assigned classes, learners and exam performance trend at a glance." },
      { property: "og:title", content: "Teacher Dashboard — Master CBC" },
      { property: "og:description", content: "Your assigned classes, learners and exam performance trend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherHome,
});

function TeacherHome() {
  const user = useSession();
  const { streams, students, exams, isLoading } = useSchoolData();

  const myStreamIds = user?.assignedStreams ?? [];
  const myStreams = streams.filter((s) => myStreamIds.includes(s.id));
  const active = students.filter((s) => s.status === "active");
  const myStudents = active.filter((s) => s.streamId && myStreamIds.includes(s.streamId));
  const myExams = exams.filter((e) => e.teacherId === user?.id);

  const trend = EXAM_TERMS.map((term) => {
    const ex = myExams.filter((e) => e.term === term && e.locked);
    const v = ex.length ? ex.reduce((a, e) => a + examMean(e).points, 0) / ex.length : 0;
    return { term: term.replace("Term ", "T"), v: Math.round(v * 100) / 100 };
  });

  const hasTrend = trend.some((t) => t.v > 0);

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader
        title={getGreeting(user?.name)}
        subtitle="Your classes, your learners, your live data."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Learners in my streams" value={isLoading ? "…" : myStudents.length} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Classes assigned" value={isLoading ? "…" : myStreams.length} icon={<Users className="h-5 w-5" />} accent="blue" />
        <StatCard label="Exams I submitted" value={isLoading ? "…" : myExams.length} hint="Locked records feed analytics" icon={<ClipboardCheck className="h-5 w-5" />} accent="emerald" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70"><CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">My mean across terms</div>
              <div className="text-xs text-muted-foreground">Locked records from all assigned streams</div>
            </div>
            <Button asChild size="sm"><Link to="/teacher/exams">Enter exam <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="h-64">
            {hasTrend ? (
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="term" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="v" stroke="var(--brand-orange)" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {isLoading ? "Loading your results…" : "No locked results yet — submit an exam to see your trend."}
              </div>
            )}
          </div>
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">My classes</div>
          <div className="mt-3 space-y-2">
            {myStreams.map((s) => (
              <Link key={s.id} to="/teacher/classes" className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-secondary/40">
                <div>
                  <div className="font-medium">{s.grade} {s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.system} • {active.filter((x) => x.streamId === s.id).length} learners
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {!isLoading && myStreams.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                No streams assigned yet. Your Principal or Deputy assigns these from Staff & Teachers.
              </div>
            )}
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
