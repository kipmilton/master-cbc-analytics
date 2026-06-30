import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard, PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { streams, students, exams, examMean } from "@/lib/mock-data";
import { GraduationCap, Users, TrendingUp, ArrowRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Teacher Dashboard — Master CBC" }] }),
  component: TeacherHome,
});

function TeacherHome() {
  const user = useSession();
  const myStreamIds = user?.assignedStreams ?? [];
  const myStreams = streams.filter((s) => myStreamIds.includes(s.id));
  const myStudents = students.filter((s) => myStreamIds.includes(s.streamId));

  const trend = ["Term 1 - Opener", "Term 1 - Mid", "Term 1 - End", "Term 2 - Opener", "Term 2 - End"].map((term) => {
    const ex = exams.filter((e) => myStreamIds.includes(e.streamId) && e.term === term && e.teacherId === user?.id);
    const v = ex.length ? ex.reduce((a, e) => a + examMean(e).points, 0) / ex.length : 0;
    return { term, v: Math.round(v * 100) / 100 };
  });

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader title={`Welcome, Teacher ${user?.name.split(" ")[0]}`} subtitle="Your classes, your students, your data." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Students in my streams" value={myStudents.length} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Classes assigned" value={myStreams.length} icon={<Users className="h-5 w-5" />} accent="blue" />
        <StatCard label="Trend (my exams)" value="+1.8%" hint="Compared to last term" icon={<TrendingUp className="h-5 w-5" />} accent="emerald" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70"><CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><div className="text-sm font-semibold">My subject mean across terms</div><div className="text-xs text-muted-foreground">Across all assigned streams</div></div>
            <Button asChild size="sm"><Link to="/teacher/exams">Enter exam <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="term" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="v" stroke="var(--brand-orange)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">My classes</div>
          <div className="mt-3 space-y-2">
            {myStreams.map((s) => (
              <Link key={s.id} to="/teacher/classes" className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-secondary/40">
                <div>
                  <div className="font-medium">{s.grade} {s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.system} • {students.filter((x) => x.streamId === s.id).length} learners</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
