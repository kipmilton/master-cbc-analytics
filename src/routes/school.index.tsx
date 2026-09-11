import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard, PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useSchoolData } from "@/hooks/use-school-data";
import { examMean, compositeMeanOf } from "@/lib/analytics";
import { getGreeting } from "@/lib/utils";
import { GraduationCap, BookOpen, Users, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/school/")({
  head: () => ({
    meta: [
      { title: "School Dashboard — Master CBC" },
      { name: "description", content: "Live enrolment, stream performance and exam activity for your school." },
      { property: "og:title", content: "School Dashboard — Master CBC" },
      { property: "og:description", content: "Live enrolment, stream performance and exam activity for your school." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SchoolHome,
});

function SchoolHome() {
  const user = useSession();
  const { streams, subjects, students, exams, rosters, isLoading } = useSchoolData();

  const activeStudents = students.filter((s) => s.status === "active");
  const lockedExams = exams.filter((e) => e.locked);
  const pendingRosters = rosters.filter((r) => r.status === "pending");
  const recent = exams.slice(0, 6);

  const overallMean = lockedExams.length
    ? Math.round((lockedExams.reduce((a, e) => a + examMean(e).points, 0) / lockedExams.length) * 100) / 100
    : 0;

  const streamData = streams.map((s) => ({
    name: `${s.grade} ${s.name}`,
    mean: compositeMeanOf(exams, s.id),
  }));

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title={getGreeting(user?.name)}
        subtitle={user?.schoolName ? `Managing ${user.schoolName}` : "School Management Dashboard"}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Learners" value={activeStudents.length} hint={`${students.length - activeStudents.length} archived`} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Streams" value={streams.length} hint="Across all grades" icon={<Users className="h-5 w-5" />} accent="blue" />
        <StatCard label="Approved Subjects" value={subjects.filter((s) => s.approved).length} hint={`${subjects.filter((s) => !s.approved).length} pending review`} icon={<BookOpen className="h-5 w-5" />} accent="emerald" />
        <StatCard label="Composite Mean" value={overallMean || "—"} hint={`${lockedExams.length} locked record(s)`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {pendingRosters.length > 0 && (
        <Card className="mt-4 border-amber-300/60 bg-amber-50/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <strong>{pendingRosters.length}</strong> class roster{pendingRosters.length > 1 ? "s are" : " is"} waiting for your approval.
            </div>
            <Button asChild size="sm"><Link to="/school/rosters">Review now</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70"><CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Composite mean by stream</div>
              <div className="text-xs text-muted-foreground">Locked records only, across all subjects and terms</div>
            </div>
            <Button asChild size="sm" variant="outline"><Link to="/school/analytics">Open analytics</Link></Button>
          </div>
          <div className="h-72">
            {streamData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-center text-xs text-muted-foreground">
                {isLoading ? "Loading your school data…" : "Create streams under Students & Streams to see performance here."}
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={streamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Bar dataKey="mean" fill="var(--brand-orange)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Recent exam records</div>
            <Button asChild size="sm" variant="ghost"><Link to="/school/exams">Manage</Link></Button>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {recent.length === 0 && (
              <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                No exam records yet. Create one under Exams &amp; Results.
              </div>
            )}
            {recent.map((e) => {
              const sub = subjects.find((s) => s.id === e.subjectId);
              const st = streams.find((s) => s.id === e.streamId);
              const m = examMean(e);
              return (
                <div key={e.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{sub?.name ?? "Subject"}</div>
                    <div className="truncate text-xs text-muted-foreground">{st?.grade} {st?.name} • {e.term}</div>
                  </div>
                  <div className="ml-2 text-right">
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
