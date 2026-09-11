import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard, PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, GraduationCap, FileSpreadsheet, Activity, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { getGreeting } from "@/lib/utils";
import { getPlatformStats, listAllSchools } from "@/lib/tenants.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Platform Overview — Master CBC" },
      { name: "description", content: "Live tenant counters, onboarding queue and school directory for the Master CBC platform." },
      { property: "og:title", content: "Platform Overview — Master CBC" },
      { property: "og:description", content: "Live tenant counters and onboarding queue across every school." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const user = useSession();
  const stats = useQuery({ queryKey: ["platformStats"], queryFn: () => getPlatformStats(), staleTime: 15_000 });
  const schools = useQuery({ queryKey: ["allSchools"], queryFn: () => listAllSchools(), staleTime: 15_000 });

  const s = stats.data;
  const recent = (Array.isArray(schools.data) ? schools.data : []).slice(0, 8);

  return (
    <AppShell allow={["super_admin"]}>
      <PageHeader
        title={getGreeting(user?.name)}
        subtitle="Global view across every school on Master CBC."
        action={<Button asChild size="sm"><Link to="/admin/schools">Manage schools</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered Schools"
          value={s?.totalSchools ?? "—"}
          hint={s ? `${s.activeSchools} active · ${s.suspendedSchools} suspended` : "Loading…"}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Applications"
          value={s?.pendingApplications ?? "—"}
          hint="Awaiting your approval"
          icon={<Activity className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Active Learners"
          value={(s?.activeLearners ?? 0).toLocaleString()}
          hint="Across all tenants"
          icon={<GraduationCap className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          label="Staff Accounts"
          value={s?.staffAccounts ?? "—"}
          hint={s ? `${s.lockedExams} locked exam record(s)` : "Loading…"}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70"><CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-semibold">Recently onboarded schools</div>
            <Button asChild size="sm" variant="ghost"><Link to="/admin/schools">View all</Link></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-2">School</th>
                  <th className="px-5 py-2">County</th>
                  <th className="px-5 py-2">Curriculum</th>
                  <th className="px-5 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-2 font-medium">{row.name}</td>
                    <td className="px-5 py-2 text-muted-foreground">{row.county ?? "—"}</td>
                    <td className="px-5 py-2">{row.system ?? "—"}</td>
                    <td className="px-5 py-2 capitalize">{row.status}</td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {schools.isLoading ? "Loading schools…" : "No schools onboarded yet."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">Platform activity</div>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Active schools" value={s?.activeSchools ?? "—"} />
            <Row label="Suspended schools" value={s?.suspendedSchools ?? "—"} />
            <Row label="Applications awaiting review" value={s?.pendingApplications ?? "—"} />
            <Row label="Locked exam records" value={s?.lockedExams ?? "—"} />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            Every figure is read server-side with tenant isolation enforced.
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
