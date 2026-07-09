import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRosters } from "@/lib/roster-store";
import { useStudents, type StudentExt } from "@/lib/student-store";
import { useStreams } from "@/lib/stream-store";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Inbox } from "lucide-react";

export const Route = createFileRoute("/school/rosters")({
  head: () => ({ meta: [{ title: "Roster Approvals — Master CBC" }] }),
  component: RostersPage,
});

function RostersPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [rosters, setRosters] = useRosters();
  const [students, setStudents] = useStudents();
  const [streams] = useStreams();

  const pending = rosters.filter((r) => r.schoolId === schoolId && r.status === "pending");
  const history = rosters.filter((r) => r.schoolId === schoolId && r.status !== "pending" && r.status !== "draft");

  function approve(id: string) {
    const roster = rosters.find((r) => r.id === id);
    if (!roster) return;
    // Assign pool students to stream + create new students
    const updated: StudentExt[] = students.map((s) => roster.studentIds.includes(s.id) ? { ...s, streamId: roster.streamId } : s);
    roster.newStudents.forEach((n, i) => {
      updated.push({
        id: `new-${roster.id}-${i}`,
        schoolId: roster.schoolId,
        streamId: roster.streamId,
        name: n.name,
        admissionNo: n.admissionNo,
        gender: n.gender,
        yearOfBirth: n.yearOfBirth,
        status: "active",
      });
    });
    setStudents(updated);
    setRosters(rosters.map((r) => r.id === id ? { ...r, status: "approved", reviewedAt: new Date().toISOString().slice(0, 10) } : r));
    toast.success("Roster approved. Students mapped to stream.");
  }

  function reject(id: string) {
    setRosters(rosters.map((r) => r.id === id ? { ...r, status: "rejected", reviewedAt: new Date().toISOString().slice(0, 10) } : r));
    toast("Roster returned to teacher for revision.");
  }

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader title="Roster Approval Queue" subtitle="Review class rosters submitted by class teachers before mapping learners to their streams." />

      {!pending.length && (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" />
          <div className="text-sm">No pending rosters. Class teachers will queue submissions here.</div>
        </CardContent></Card>
      )}

      <div className="grid gap-4">
        {pending.map((r) => {
          const stream = streams.find((s) => s.id === r.streamId);
          const pooled = students.filter((s) => r.studentIds.includes(s.id));
          return (
            <Card key={r.id} className="border-border/70"><CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Submitted by {r.teacherName} · {r.submittedAt}</div>
                  <div className="text-lg font-semibold">{stream?.grade} {stream?.name} <Badge variant="outline" className="ml-2">{stream?.system}</Badge></div>
                  <div className="mt-1 text-xs text-muted-foreground">{pooled.length} from pool · {r.newStudents.length} new registration(s)</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => reject(r.id)}><XCircle className="mr-1 h-4 w-4" />Reject</Button>
                  <Button onClick={() => approve(r.id)}><CheckCircle2 className="mr-1 h-4 w-4" />Approve & Map</Button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">From master pool</div>
                  <div className="max-h-52 overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-border">
                        {pooled.map((s) => (
                          <tr key={s.id}><td className="px-3 py-1.5 font-mono text-muted-foreground">{s.admissionNo}</td><td className="px-3 py-1.5">{s.name}</td><td className="px-3 py-1.5">{s.gender} · {s.yearOfBirth}</td></tr>
                        ))}
                        {!pooled.length && <tr><td className="px-3 py-3 text-center text-muted-foreground">—</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">New registrations</div>
                  <div className="max-h-52 overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-border">
                        {r.newStudents.map((s, i) => (
                          <tr key={i}><td className="px-3 py-1.5 font-mono text-muted-foreground">{s.admissionNo}</td><td className="px-3 py-1.5">{s.name}</td><td className="px-3 py-1.5">{s.gender} · {s.yearOfBirth}</td></tr>
                        ))}
                        {!r.newStudents.length && <tr><td className="px-3 py-3 text-center text-muted-foreground">—</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent></Card>
          );
        })}
      </div>

      {history.length > 0 && (
        <Card className="mt-6 border-border/70"><CardContent className="p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Review history</div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-5 py-2">Reviewed</th><th className="px-5 py-2">Stream</th><th className="px-5 py-2">Teacher</th><th className="px-5 py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((r) => {
                const stream = streams.find((s) => s.id === r.streamId);
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-2 text-muted-foreground">{r.reviewedAt}</td>
                    <td className="px-5 py-2">{stream?.grade} {stream?.name}</td>
                    <td className="px-5 py-2">{r.teacherName}</td>
                    <td className="px-5 py-2">{r.status === "approved" ? <Badge className="bg-emerald-500/15 text-emerald-700">Approved</Badge> : <Badge variant="destructive">Rejected</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent></Card>
      )}
    </AppShell>
  );
}
