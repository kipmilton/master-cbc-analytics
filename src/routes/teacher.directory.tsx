import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useSchoolData } from "@/hooks/use-school-data";
import { listSchoolStaff } from "@/lib/staff.functions";
import { roleLabel } from "@/lib/roles";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/teacher/directory")({
  head: () => ({
    meta: [
      { title: "School Directory — Master CBC" },
      { name: "description", content: "Read-only directory of every learner and colleague inside your own school." },
      { property: "og:title", content: "School Directory — Master CBC" },
      { property: "og:description", content: "Learners and colleagues within your school, tenant isolated." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const user = useSession();
  const { streams, students, isLoading } = useSchoolData();
  const [q, setQ] = useState("");

  const staffQuery = useQuery({
    queryKey: ["schoolStaff", user?.schoolId ?? null],
    queryFn: () => listSchoolStaff(),
    enabled: !!user?.schoolId,
  });
  const colleagues = (staffQuery.data ?? []).filter((s) => s.userId !== user?.id);

  const term = q.trim().toLowerCase();
  const rows = students
    .filter((s) => s.status === "active")
    .filter((s) => !term || s.name.toLowerCase().includes(term) || s.admissionNo.toLowerCase().includes(term));

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader title="School Directory" subtitle="Read-only context: every learner and colleague in your school." />
      <Card className="mb-4 border-border/70"><CardContent className="p-4">
        <Input placeholder="Search by name or admission number…" value={q} onChange={(e) => setQ(e.target.value)} />
      </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70"><CardContent className="p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Learners ({rows.length})</div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-5 py-2">Adm.</th><th className="px-5 py-2">Name</th><th className="px-5 py-2">Stream</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <tr><td colSpan={3} className="px-5 py-8 text-center text-xs text-muted-foreground">Loading learners…</td></tr>}
                {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-xs text-muted-foreground">No learners match that search.</td></tr>
                )}
                {rows.slice(0, 200).map((s) => {
                  const st = streams.find((x) => x.id === s.streamId);
                  return (
                    <tr key={s.id}>
                      <td className="px-5 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                      <td className="px-5 py-2">{s.name}</td>
                      <td className="px-5 py-2">
                        {st ? <Badge variant="outline">{st.grade} {st.name}</Badge> : <span className="text-xs text-muted-foreground">Unassigned</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">Colleagues</div>
          <div className="mt-3 space-y-2">
            {staffQuery.isLoading && <div className="text-xs text-muted-foreground">Loading staff…</div>}
            {colleagues.map((t) => (
              <div key={t.userId} className="flex items-center gap-3 rounded-md border border-border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.title || roleLabel(t.role)}</div>
                </div>
              </div>
            ))}
            {!staffQuery.isLoading && colleagues.length === 0 && (
              <div className="text-xs text-muted-foreground">No other staff accounts yet.</div>
            )}
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
