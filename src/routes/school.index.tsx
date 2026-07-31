import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard, PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useStudents } from "@/lib/student-store";
import { useStreams } from "@/lib/stream-store";
import { useSubjects } from "@/lib/subject-store";
import { useExams, examMean, compositeMeanOf } from "@/lib/exam-store";
import { GraduationCap, BookOpen, Users, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/school/")({
  head: () => ({ meta: [{ title: "School Dashboard — Master CBC" }] }),
  component: SchoolHome,
});

function SchoolHome() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [allStudents] = useStudents();
  const [allStreams] = useStreams();
  const [allSubjects] = useSubjects();
  const [allExams] = useExams();

  const schoolStudents = allStudents.filter((s) => s.schoolId === schoolId && s.status === "active");
  const schoolStreams = allStreams.filter((s) => s.schoolId === schoolId);
  const subjects = allSubjects.filter((s) => s.schoolId === schoolId);
  const schoolExams = allExams.filter((e) => e.schoolId === schoolId);
  const streams = schoolStreams;
  const recent = schoolExams.slice(-6);

  const lockedExams = schoolExams.filter((e) => e.locked);
  const overallMean = lockedExams.length
    ? Math.round((lockedExams.reduce((a, e) => a + examMean(e).points, 0) / lockedExams.length) * 100) / 100
    : 0;

  const streamData = schoolStreams.map((s) => ({
    name: `${s.grade} ${s.name}`,
    mean: compositeMeanOf(schoolExams, s.id),
  }));


  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Welcome to Master CBC"
        subtitle={`Signed in as ${user?.title} — viewing Riverside Senior School`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={schoolStudents.length} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Streams" value={schoolStreams.length} hint="Across all grades" icon={<Users className="h-5 w-5" />} accent="blue" />
        <StatCard label="Approved Subjects" value={schoolSubjects.filter((s) => s.approved).length} hint={`${schoolSubjects.filter((s) => !s.approved).length} pending review`} icon={<BookOpen className="h-5 w-5" />} accent="emerald" />
        <StatCard label="Composite Mean Trend" value="+2.1%" hint="Over last term" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70"><CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><div className="text-sm font-semibold">Composite mean by stream</div><div className="text-xs text-muted-foreground">Across all subjects and terms</div></div>
            <Button asChild size="sm" variant="outline"><Link to="/school/analytics">Open analytics</Link></Button>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={streamData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="mean" fill="var(--brand-orange)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">Recent submissions</div>
          <div className="mt-3 space-y-2 text-sm">
            {recent.map((e) => {
              const sub = subjects.find((s) => s.id === e.subjectId);
              const st = streams.find((s) => s.id === e.streamId);
              const m = examMean(e);
              return (
                <div key={e.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <div className="font-medium">{sub?.name}</div>
                    <div className="text-xs text-muted-foreground">{st?.grade} {st?.name} • {e.term}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{m.grade}</div>
                    <div className="text-xs text-muted-foreground">{m.mean}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
