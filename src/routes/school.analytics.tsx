import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSchoolData } from "@/hooks/use-school-data";
import { examMean, compositeMeanOf, distributionOf, EXAM_TERMS } from "@/lib/analytics";
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line } from "recharts";

export const Route = createFileRoute("/school/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Master CBC" },
      { name: "description", content: "Compare parallel streams, track term-over-term trends and inspect grade distributions." },
      { property: "og:title", content: "Analytics — Master CBC" },
      { property: "og:description", content: "Compare parallel streams and track term-over-term performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

const COLORS = ["var(--brand-orange)", "var(--brand-blue)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function AnalyticsPage() {
  const { streams, subjects, exams, isLoading } = useSchoolData();

  const grades = useMemo(() => Array.from(new Set(streams.map((s) => s.grade))).sort(), [streams]);
  const [grade, setGrade] = useState<string>("");
  const activeGrade = grade || grades[0] || "";

  const parallelStreams = streams.filter((s) => s.grade === activeGrade);

  const compareData = parallelStreams.map((s) => {
    const bySubject: Record<string, number> = {};
    exams
      .filter((e) => e.streamId === s.id && e.locked)
      .forEach((e) => {
        const sub = subjects.find((x) => x.id === e.subjectId);
        if (sub) bySubject[sub.name] = examMean(e).points;
      });
    return { name: `${s.grade} ${s.name}`, ...bySubject };
  });

  const subjectNames = useMemo(() => {
    const set = new Set<string>();
    compareData.forEach((r) => Object.keys(r).forEach((k) => k !== "name" && set.add(k)));
    return Array.from(set);
  }, [compareData]);

  const trendData = EXAM_TERMS.map((term) => {
    const row: Record<string, string | number> = { term };
    parallelStreams.forEach((s) => {
      const ex = exams.filter((e) => e.streamId === s.id && e.term === term && e.locked);
      const avg = ex.length ? ex.reduce((a, e) => a + examMean(e).points, 0) / ex.length : 0;
      row[`${s.grade} ${s.name}`] = Math.round(avg * 100) / 100;
    });
    return row;
  });

  const empty = !isLoading && parallelStreams.length === 0;

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Global Analytics"
        subtitle="Top-down view of every class and stream in your school."
        action={
          grades.length > 0 ? (
            <Select value={activeGrade} onValueChange={setGrade}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          ) : undefined
        }
      />

      {empty && (
        <Card className="border-dashed"><CardContent className="p-10 text-center text-sm text-muted-foreground">
          No streams yet. Add streams and record exams to unlock analytics.
        </CardContent></Card>
      )}

      {parallelStreams.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {parallelStreams.map((s) => (
              <Card key={s.id} className="border-border/70"><CardContent className="p-5">
                <div className="text-xs text-muted-foreground">{s.grade}</div>
                <div className="text-lg font-semibold">Stream {s.name}</div>
                <div className="mt-3 text-2xl font-bold text-primary">{compositeMeanOf(exams, s.id) || "—"}</div>
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
                      <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
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
                      <Line key={s.id} type="monotone" dataKey={`${s.grade} ${s.name}`} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
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
                    const dist = distributionOf(exams, s.id);
                    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
                    return (
                      <tr key={s.id}>
                        <td className="px-5 py-3 font-medium">{s.grade} {s.name}</td>
                        <td className="px-5 py-3 text-muted-foreground">{s.system}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(dist).map(([g, v]) => (
                              <span key={g} className="rounded-md bg-secondary px-2 py-1 text-xs">
                                <span className="font-semibold">{v}</span> {g}{" "}
                                <span className="text-muted-foreground">({Math.round((v / total) * 100)}%)</span>
                              </span>
                            ))}
                            {!Object.keys(dist).length && <span className="text-xs text-muted-foreground">No locked results yet</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </>
      )}
    </AppShell>
  );
}
