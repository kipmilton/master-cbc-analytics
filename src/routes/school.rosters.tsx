import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSchoolData } from "@/hooks/use-school-data";
import { reviewRoster } from "@/lib/school-data.functions";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Inbox, Loader2 } from "lucide-react";

export const Route = createFileRoute("/school/rosters")({
  head: () => ({
    meta: [
      { title: "Roster Approvals — Master CBC" },
      { name: "description", content: "Review and approve class rosters submitted by your class teachers." },
      { property: "og:title", content: "Roster Approvals — Master CBC" },
      { property: "og:description", content: "Review and approve class rosters submitted by class teachers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RostersPage,
});

function RostersPage() {
  const { rosters, students, streams, isLoading, refresh } = useSchoolData();

  const pending = rosters.filter((r) => r.status === "pending");
  const history = rosters.filter((r) => r.status === "approved" || r.status === "rejected");

  const review = useMutation({
    mutationFn: (vars: { id: string; decision: "approved" | "rejected" }) =>
      reviewRoster({ data: { id: vars.id, decision: vars.decision, notes: "" } }),
    onSuccess: (_d, vars) => {
      refresh();
      toast.success(
        vars.decision === "approved"
          ? "Roster approved. Learners mapped to the stream."
          : "Roster returned to the teacher for revision.",
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update this roster"),
  });

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Roster Approval Queue"
        subtitle="Review class rosters submitted by class teachers before mapping learners to their streams."
      />

      {!pending.length && (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Inbox className="h-8 w-8" />}
          <div className="text-sm">{isLoading ? "Loading submissions…" : "No pending rosters. Class teachers will queue submissions here."}</div>
        </CardContent></Card>
      )}

      <div className="grid gap-4">
        {pending.map((r) => {
          const stream = streams.find((s) => s.id === r.streamId);
          const pooled = students.filter((s) => r.studentIds.includes(s.id));
          const busy = review.isPending && review.variables?.id === r.id;
          return (
            <Card key={r.id} className="border-border/70"><CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Submitted by {r.teacherName || "class teacher"}
                    {r.submittedAt ? ` · ${new Date(r.submittedAt).toLocaleDateString()}` : ""}
                  </div>
                  <div className="text-lg font-semibold">
                    {stream?.grade} {stream?.name}
                    {stream && <Badge variant="outline" className="ml-2">{stream.system}</Badge>}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{pooled.length} from pool · {r.newStudents.length} new registration(s)</span>
                    <Badge className="bg-amber-500/15 text-amber-700">Pending Approval</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={busy} onClick={() => review.mutate({ id: r.id, decision: "rejected" })}>
                    <XCircle className="mr-1 h-4 w-4" />Reject
                  </Button>
                  <Button disabled={busy} onClick={() => review.mutate({ id: r.id, decision: "approved" })}>
                    {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Approve &amp; Map
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">From master pool</div>
                  <div className="max-h-52 overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-border">
                        {pooled.map((s) => (
                          <tr key={s.id}>
                            <td className="px-3 py-1.5 font-mono text-muted-foreground">{s.admissionNo}</td>
                            <td className="px-3 py-1.5">{s.name}</td>
                            <td className="px-3 py-1.5">{s.gender} · {s.yearOfBirth}</td>
                          </tr>
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
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-mono text-muted-foreground">{s.admissionNo}</td>
                            <td className="px-3 py-1.5">{s.name}</td>
                            <td className="px-3 py-1.5">{s.gender} · {s.yearOfBirth}</td>
                          </tr>
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
              <tr>
                <th className="px-5 py-2">Reviewed</th>
                <th className="px-5 py-2">Stream</th>
                <th className="px-5 py-2">Teacher</th>
                <th className="px-5 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((r) => {
                const stream = streams.find((s) => s.id === r.streamId);
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-2 text-muted-foreground">{r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-2">{stream?.grade} {stream?.name}</td>
                    <td className="px-5 py-2">{r.teacherName}</td>
                    <td className="px-5 py-2">
                      {r.status === "approved"
                        ? <Badge className="bg-emerald-500/15 text-emerald-700">Approved</Badge>
                        : <Badge variant="destructive">Rejected</Badge>}
                    </td>
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
