import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { schools as seed } from "@/lib/mock-data";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, Ban } from "lucide-react";

export const Route = createFileRoute("/admin/schools")({
  head: () => ({ meta: [{ title: "Schools — Master CBC" }] }),
  component: SchoolsPage,
});

function SchoolsPage() {
  const [rows, setRows] = useState(seed);
  function setStatus(id: string, status: "active" | "pending" | "suspended") {
    setRows((r) => r.map((s) => (s.id === id ? { ...s, status } : s)));
    toast.success(`School ${status}`);
  }
  return (
    <AppShell allow={["super_admin"]}>
      <PageHeader title="School Management" subtitle="Approve, suspend, or inspect any tenant on Master CBC." />
      <Card className="border-border/70">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">County</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Onboarded</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.county}</td>
                    <td className="px-4 py-3">{s.students.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.createdAt}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "active" ? "default" : s.status === "pending" ? "secondary" : "destructive"} className="capitalize">{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {s.status === "pending" && <Button size="sm" onClick={() => setStatus(s.id, "active")}><CheckCircle2 className="mr-1 h-4 w-4" />Approve</Button>}
                        {s.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "suspended")}><Ban className="mr-1 h-4 w-4" />Suspend</Button>}
                        {s.status === "suspended" && <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "active")}><CheckCircle2 className="mr-1 h-4 w-4" />Reactivate</Button>}
                        <Button size="sm" variant="ghost" onClick={() => toast.info("Drill-in view coming with Supabase wiring")}><Eye className="mr-1 h-4 w-4" />Analytics</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
