import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { streams, students, exams, examMean, streamCompositeMean } from "@/lib/mock-data";

export const Route = createFileRoute("/teacher/classes")({
  head: () => ({ meta: [{ title: "My Classes — Master CBC" }] }),
  component: MyClasses,
});

function MyClasses() {
  const user = useSession();
  const myStreamIds = user?.assignedStreams ?? [];
  const myStreams = streams.filter((s) => myStreamIds.includes(s.id));

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader title="My Classes" subtitle="Only the streams assigned to you by school administration." />
      <div className="grid gap-4 lg:grid-cols-2">
        {myStreams.map((s) => {
          const learners = students.filter((x) => x.streamId === s.id);
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
                  <div className="text-xl font-bold text-primary">{streamCompositeMean(s.id)}</div>
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
                </div>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </AppShell>
  );
}
