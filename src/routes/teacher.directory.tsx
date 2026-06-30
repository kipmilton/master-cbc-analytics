import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { students, users, streams } from "@/lib/mock-data";

export const Route = createFileRoute("/teacher/directory")({
  head: () => ({ meta: [{ title: "Directory — Master CBC" }] }),
  component: Directory,
});

function Directory() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [q, setQ] = useState("");

  const allStudents = students.filter((s) => s.schoolId === schoolId && (s.name.toLowerCase().includes(q.toLowerCase()) || s.admissionNo.includes(q)));
  const fellowTeachers = users.filter((u) => u.role === "teacher" && u.schoolId === schoolId);

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader title="School Directory" subtitle="Read-only context: every student and every fellow teacher in your school." />
      <Card className="mb-4 border-border/70"><CardContent className="p-4">
        <Input placeholder="Search by name or admission number…" value={q} onChange={(e) => setQ(e.target.value)} />
      </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70"><CardContent className="p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Students ({allStudents.length})</div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-5 py-2">Adm.</th><th className="px-5 py-2">Name</th><th className="px-5 py-2">Stream</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allStudents.slice(0, 200).map((s) => {
                  const st = streams.find((x) => x.id === s.streamId);
                  return (
                    <tr key={s.id}>
                      <td className="px-5 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                      <td className="px-5 py-2">{s.name}</td>
                      <td className="px-5 py-2"><Badge variant="outline">{st?.grade} {st?.name}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">Fellow teachers</div>
          <div className="mt-3 space-y-2">
            {fellowTeachers.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
