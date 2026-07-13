import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { listPendingApplications, listAllSchools, approveSchoolApplication, rejectSchoolApplication } from "@/lib/tenants.functions";
import { CheckCircle2, Ban, Loader2, Building2 } from "lucide-react";

export const Route = createFileRoute("/admin/schools")({
  head: () => ({ meta: [{ title: "Schools — Master CBC" }] }),
  component: SchoolsPage,
});

function SchoolsPage() {
  const qc = useQueryClient();
  const apps = useQuery({ queryKey: ["applications"], queryFn: () => listPendingApplications() });
  const schools = useQuery({ queryKey: ["allSchools"], queryFn: () => listAllSchools() });

  const approve = useMutation({
    mutationFn: (applicationId: string) => approveSchoolApplication({ data: { applicationId } }),
    onSuccess: () => { toast.success("School approved. Principal now has access."); qc.invalidateQueries(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Approval failed"),
  });
  const reject = useMutation({
    mutationFn: (applicationId: string) => rejectSchoolApplication({ data: { applicationId, reason: "" } }),
    onSuccess: () => { toast.success("Application rejected."); qc.invalidateQueries(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Rejection failed"),
  });

  const pending = (apps.data ?? []).filter((a) => a.status === "pending");
  const reviewed = (apps.data ?? []).filter((a) => a.status !== "pending");

  return (
    <AppShell allow={["super_admin"]}>
      <PageHeader title="School Management" subtitle="Approve applications and inspect every tenant on Master CBC." />

      <Card className="border-border/70">
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Pending applications ({pending.length})</div>
          {apps.isLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
          ) : pending.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No pending applications right now.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">School</th>
                    <th className="px-4 py-3">County</th>
                    <th className="px-4 py-3">System</th>
                    <th className="px-4 py-3">Principal</th>
                    <th className="px-4 py-3">Applied</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending.map((a) => (
                    <tr key={a.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium">{a.school_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.county}</td>
                      <td className="px-4 py-3 uppercase text-xs">{a.system}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.principal_name}</div>
                        <div className="text-xs text-muted-foreground">{a.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(a.id)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" />Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={reject.isPending} onClick={() => reject.mutate(a.id)}>
                            <Ban className="mr-1 h-4 w-4" />Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-border/70">
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" />Active tenants</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">County</th>
                  <th className="px-4 py-3">System</th>
                  <th className="px-4 py-3">Onboarded</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(schools.data ?? []).map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.county}</td>
                    <td className="px-4 py-3 uppercase text-xs">{s.system}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "active" ? "default" : s.status === "pending" ? "secondary" : "destructive"} className="capitalize">{s.status}</Badge>
                    </td>
                  </tr>
                ))}
                {(schools.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">No schools yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {reviewed.length > 0 && (
        <Card className="mt-6 border-border/70">
          <CardContent className="p-5">
            <div className="text-sm font-semibold">Reviewed applications</div>
            <div className="mt-3 space-y-2 text-sm">
              {reviewed.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                  <span>{a.school_name} — {a.principal_name}</span>
                  <Badge variant={a.status === "approved" ? "default" : "destructive"} className="capitalize">{a.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
