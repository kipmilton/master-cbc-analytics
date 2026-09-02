import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { useSchoolData } from "@/hooks/use-school-data";
import { compositeMeanOf, examMean } from "@/lib/analytics";

export const Route = createFileRoute("/teacher/classes")({
  head: () => ({
    meta: [
      { title: "My Classes — Master CBC" },
      { name: "description", content: "The streams assigned to you, their learner counts, composite means and your recent submissions." },
      { property: "og:title", content: "My Classes — Master CBC" },
      { property: "og:description", content: "Streams assigned to you with live learner counts and means." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyClasses,
});

function MyClasses() {
  const user = useSession();
  const { streams, students, exams, isLoading } = useSchoolData();

  const myStreamIds = user?.assignedStreams ?? [];
  const myStreams = streams.filter((s) => myStreamIds.includes(s.id));
  const active = students.filter((s) => s.status === "active");

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader title="My Classes" subtitle="Only the streams assigned to you by school administration." />
      {!isLoading && myStreams.length === 0 && (
        <Card className="border-dashed"><CardContent className="p-10 text-center text-sm text-muted-foreground">
          No streams have been assigned to you yet.
        </CardContent></Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {myStreams.map((s) => {
          const learners = active.filter((x) => x.streamId === s.id);
          const myExams = exams.filter((e) => e.streamId === s.id && e.teacherId === user?.id);
          return (
            <Card key={s.id} className="border-border/70"><CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{s.system}</div>
                  <div className="text-lg font-semibold">{s.grade} {s.name}</div>
                </div>
                <Badge variant="outline">{learners.length} learners</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-secondary/50 p-3">
                  <div className="text-xs text-muted-foreground">Composite mean</div>
                  <div className="text-xl font-bold text-primary">{compositeMeanOf(exams, s.id)}</div>
                </div>
                <div className="rounded-md bg-secondary/50 p-3">
                  <div className="text-xs text-muted-foreground">My submissions</div>
                  <div className="text-xl font-bold">{myExams.length}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent results</div>
                <div className="mt-2 space-y-1.5">
                  {myExams.slice(-4).map((e) => {
                    const m = examMean(e);
                    return (
                      <div key={e.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{e.term}</span>
                        <span className="font-semibold">{m.grade} <span className="text-xs text-muted-foreground">({m.mean})</span></span>
                      </div>
                    );
                  })}
                  {myExams.length === 0 && <div className="text-xs text-muted-foreground">Nothing submitted yet.</div>}
                </div>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </AppShell>
  );
}
