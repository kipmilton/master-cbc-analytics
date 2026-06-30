import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { users, streams } from "@/lib/mock-data";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/school/teachers")({
  head: () => ({ meta: [{ title: "Teachers — Master CBC" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const teachers = users.filter((u) => u.role === "teacher" && u.schoolId === schoolId);
  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader title="Teacher Directory" subtitle="All active teachers in your school and their assigned streams." />
      <Card className="border-border/70"><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-5 py-3">Teacher</th><th className="px-5 py-3">Role / Subject</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Assigned streams</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teachers.map((t) => {
                const assigned = (t.assignedStreams ?? []).map((id) => streams.find((s) => s.id === id)).filter(Boolean);
                return (
                  <tr key={t.id}>
                    <td className="px-5 py-3 font-medium">{t.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.email}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {assigned.map((s) => <Badge key={s!.id} variant="outline">{s!.grade} {s!.name}</Badge>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </AppShell>
  );
}
