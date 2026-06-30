import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard, PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, GraduationCap, TrendingUp, Activity } from "lucide-react";
import { schools, students } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Super Admin — Master CBC" }] }),
  component: () => (
    <AppShell allow={["super_admin"]}>
      <PageHeader title="System Overview" subtitle="Global view across every school on Master CBC." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered Schools" value={schools.length} hint={`${schools.filter(s=>s.status==="active").length} active`} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Pending Approvals" value={schools.filter(s=>s.status==="pending").length} icon={<Activity className="h-5 w-5" />} accent="blue" />
        <StatCard label="Active Learners" value={students.length.toLocaleString()} hint="Across all tenants" icon={<GraduationCap className="h-5 w-5" />} accent="emerald" />
        <StatCard label="Avg Performance Trend" value="+3.4%" hint="Term over term" icon={<TrendingUp className="h-5 w-5" />} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70"><CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">System-wide performance trend</div>
              <div className="text-xs text-muted-foreground">Mean composite points across all schools</div>
            </div>
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">+3.4%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={[
                { t: "T1 Open", v: 6.2 }, { t: "T1 Mid", v: 6.5 }, { t: "T1 End", v: 6.9 },
                { t: "T2 Open", v: 7.0 }, { t: "T2 Mid", v: 7.4 }, { t: "T2 End", v: 7.7 },
              ]}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="v" stroke="var(--brand-orange)" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>
        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">Tenancy health</div>
          <div className="mt-4 space-y-3 text-sm">
            {[
              { l: "RLS policies enforced", v: "100%", c: "text-emerald-600" },
              { l: "Cross-tenant access attempts", v: "0", c: "text-emerald-600" },
              { l: "Failed logins (24h)", v: "12", c: "text-muted-foreground" },
              { l: "Avg API response", v: "184 ms", c: "text-muted-foreground" },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
                <span className="text-muted-foreground">{r.l}</span><span className={`font-semibold ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  ),
});
