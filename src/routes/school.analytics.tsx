import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { streams, subjects, exams, examMean, streamCompositeMean, gradeDistribution } from "@/lib/mock-data";
import { useSession } from "@/hooks/use-session";
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line } from "recharts";

export const Route = createFileRoute("/school/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Master CBC" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const schoolStreams = streams.filter((s) => s.schoolId === schoolId);
  const grades = Array.from(new Set(schoolStreams.map((s) => s.grade)));
  const [grade, setGrade] = useState(grades[0] ?? "Grade 10");

  const parallelStreams = schoolStreams.filter((s) => s.grade === grade);

  const compareData = parallelStreams.map((s) => {
    const ex = exams.filter((e) => e.streamId === s.id);
    const bySubject: Record<string, number> = {};
    ex.forEach((e) => {
      const sub = subjects.find((x) => x.id === e.subjectId)!;
      bySubject[sub.name] = examMean(e).points;
    });
    return { name: `${s.grade} ${s.name}`, ...bySubject };
  });

  const subjectNames = useMemo(() => {
    const set = new Set<string>();
    compareData.forEach((r) => Object.keys(r).forEach((k) => k !== "name" && set.add(k)));
    return Array.from(set);
  }, [compareData]);

  const colors = ["var(--brand-orange)", "var(--brand-blue)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  const trendData = ["Term 1 - Opener", "Term 1 - Mid", "Term 1 - End", "Term 2 - Opener", "Term 2 - End"].map((term) => {
    const row: Record<string, string | number> = { term };
    parallelStreams.forEach((s) => {
      const ex = exams.filter((e) => e.streamId === s.id && e.term === term);
      const avg = ex.length ? ex.reduce((a, e) => a + examMean(e).points, 0) / ex.length : 0;
      row[`${s.grade} ${s.name}`] = Math.round(avg * 100) / 100;
    });
    return row;
  });

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Global Analytics"
        subtitle="Top-down view of every class and stream in your school."
        action={
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {parallelStreams.map((s) => (
          <Card key={s.id} className="border-border/70"><CardContent className="p-5">
            <div className="text-xs text-muted-foreground">{s.grade}</div>
            <div className="text-lg font-semibold">Stream {s.name}</div>
            <div className="mt-3 text-2xl font-bold text-primary">{streamCompositeMean(s.id)}</div>
            <div className="text-xs text-muted-foreground">Composite mean points</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70"><CardContent className="p-5">
          <div className="mb-3 text-sm font-semibold">Subject performance — side by side</div>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {subjectNames.map((s, i) => (
                  <Bar key={s} dataKey={s} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-5">
          <div className="mb-3 text-sm font-semibold">Term-over-term trend</div>
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="term" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {parallelStreams.map((s, i) => (
                  <Line key={s.id} type="monotone" dataKey={`${s.grade} ${s.name}`} stroke={colors[i % colors.length]} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>
      </div>

      <Card className="mt-6 border-border/70"><CardContent className="p-0">
        <div className="border-b border-border px-5 py-3 text-sm font-semibold">Grade distribution breakdown</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Stream</th>
                <th className="px-5 py-3">System</th>
                <th className="px-5 py-3">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parallelStreams.map((s) => {
                const dist = gradeDistribution(s.id);
                const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
                return (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-medium">{s.grade} {s.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.system}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(dist).map(([g, v]) => (
                          <span key={g} className="rounded-md bg-secondary px-2 py-1 text-xs">
                            <span className="font-semibold">{v}</span> {g} <span className="text-muted-foreground">({Math.round((v/total)*100)}%)</span>
                          </span>
                        ))}
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
