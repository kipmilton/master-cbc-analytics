import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { streams, subjects, students, exams, examMean, scoreToGrade, rubricToPoints, type CBCRubric, type ExamEntry } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { Lock, ArrowLeft, Save } from "lucide-react";

export const Route = createFileRoute("/teacher/exams")({
  head: () => ({ meta: [{ title: "Enter Exam — Master CBC" }] }),
  component: ExamEntryPage,
});

type Step = "select" | "input" | "review" | "locked";

function ExamEntryPage() {
  const user = useSession();
  const myStreams = streams.filter((s) => (user?.assignedStreams ?? []).includes(s.id));
  const [streamId, setStreamId] = useState(myStreams[0]?.id ?? "");
  const stream = streams.find((s) => s.id === streamId);
  const availableSubjects = subjects.filter((s) => s.schoolId === user?.schoolId && s.approved && s.system === stream?.system);
  const [subjectId, setSubjectId] = useState(availableSubjects[0]?.id ?? "");
  const [term, setTerm] = useState("Term 2 - End");
  const [examName, setExamName] = useState("End Term 2 Exam");
  const [step, setStep] = useState<Step>("select");

  const streamStudents = useMemo(() => students.filter((x) => x.streamId === streamId), [streamId]);
  const subject = subjects.find((s) => s.id === subjectId);

  const [scores, setScores] = useState<Record<string, { score?: number; rubric?: CBCRubric }>>({});

  function startInput() {
    if (!streamId || !subjectId) { toast.error("Select stream & subject"); return; }
    setScores(Object.fromEntries(streamStudents.map((s) => [s.id, {}])));
    setStep("input");
  }

  const draftExam: ExamEntry | null = subject && stream ? {
    id: "draft",
    schoolId: stream.schoolId,
    streamId,
    subjectId,
    teacherId: user?.id ?? "",
    term,
    examName,
    system: subject.system,
    locked: false,
    createdAt: new Date().toISOString(),
    scores: streamStudents.map((s) => ({ studentId: s.id, ...scores[s.id] })),
  } : null;

  const draftMean = draftExam && draftExam.scores.some((s) => s.score !== undefined || s.rubric) ? examMean(draftExam) : null;

  const historical = exams.filter((e) => e.streamId === streamId && e.subjectId === subjectId);
  const trendData = [...historical, ...(draftExam && draftMean ? [draftExam] : [])].map((e) => ({
    name: e.id === "draft" ? "This exam" : e.term,
    points: examMean(e).points,
    mean: examMean(e).mean,
  }));

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader title="Enter Exam Marks" subtitle="Capture, review, then lock & submit. Locked results flow up to the Principal & Class Teacher." />

      <Card className="mb-6 border-border/70"><CardContent className="p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-2">
            <Label>Stream</Label>
            <Select value={streamId} onValueChange={(v) => { setStreamId(v); setStep("select"); }}>
              <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
              <SelectContent>{myStreams.map((s) => <SelectItem key={s.id} value={s.id}>{s.grade} {s.name} ({s.system})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setStep("select"); }}>
              <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
              <SelectContent>{availableSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2"><Label>Term</Label><Input value={term} onChange={(e) => setTerm(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Exam name</Label><Input value={examName} onChange={(e) => setExamName(e.target.value)} /></div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {streamStudents.length} learners sat for this exam in <span className="font-medium text-foreground">{stream?.grade} {stream?.name}</span>.
          </div>
          {step === "select" && <Button onClick={startInput}>Start mark entry</Button>}
        </div>
      </CardContent></Card>

      {step === "input" && subject && (
        <Card className="border-border/70"><CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-semibold">Mark entry — {subject.name} ({subject.system})</div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("select")}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
              <Button size="sm" onClick={() => setStep("review")}><Save className="mr-1 h-4 w-4" />Review</Button>
            </div>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-5 py-2">Adm.</th><th className="px-5 py-2">Name</th><th className="px-5 py-2 w-56">{subject.system === "CBC" ? "Rubric" : "Score (%)"}</th><th className="px-5 py-2 w-24">Result</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {streamStudents.map((s) => {
                  const v = scores[s.id] ?? {};
                  return (
                    <tr key={s.id}>
                      <td className="px-5 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                      <td className="px-5 py-2">{s.name}</td>
                      <td className="px-5 py-2">
                        {subject.system === "8-4-4" ? (
                          <Input type="number" min={0} max={100} value={v.score ?? ""} onChange={(e) => setScores((p) => ({ ...p, [s.id]: { score: e.target.value === "" ? undefined : Math.min(100, Math.max(0, Number(e.target.value))) } }))} className="h-8" placeholder="0-100" />
                        ) : (
                          <Select value={v.rubric ?? ""} onValueChange={(r) => setScores((p) => ({ ...p, [s.id]: { rubric: r as CBCRubric } }))}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="Select tier" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EE">Exceeding Expectation</SelectItem>
                              <SelectItem value="ME">Meeting Expectation</SelectItem>
                              <SelectItem value="AE">Approaching Expectation</SelectItem>
                              <SelectItem value="BE">Below Expectation</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="px-5 py-2">
                        {subject.system === "8-4-4"
                          ? v.score !== undefined && <Badge variant="outline">{scoreToGrade(v.score)}</Badge>
                          : v.rubric && <Badge variant="outline">{v.rubric} · {rubricToPoints(v.rubric)}</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      {step === "review" && draftExam && draftMean && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-border/70"><CardContent className="p-5">
            <div className="text-sm font-semibold">Review summary</div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-md bg-secondary/50 p-3"><div className="text-xs text-muted-foreground">Subject Mean Mark / Tier</div><div className="text-2xl font-bold text-primary">{draftMean.grade}</div></div>
              <div className="rounded-md bg-secondary/50 p-3"><div className="text-xs text-muted-foreground">Mean Score</div><div className="text-2xl font-bold">{draftMean.mean}</div></div>
              <div className="rounded-md bg-secondary/50 p-3"><div className="text-xs text-muted-foreground">Mean Points</div><div className="text-2xl font-bold text-[color:var(--brand-blue)]">{draftMean.points}</div></div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("input")}><ArrowLeft className="mr-1 h-4 w-4" />Edit</Button>
              <Button className="flex-1" onClick={() => { setStep("locked"); toast.success("Exam locked & submitted. Results pushed to admin."); }}>
                <Lock className="mr-1 h-4 w-4" />Confirm & Submit
              </Button>
            </div>
          </CardContent></Card>

          <Card className="lg:col-span-2 border-border/70"><CardContent className="p-5">
            <div className="mb-3 text-sm font-semibold">Performance trend — {subject?.name}</div>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="points" stroke="var(--brand-orange)" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="mean" stroke="var(--brand-blue)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Distribution preview</div>
              <div className="mt-2 h-48">
                <ResponsiveContainer>
                  <BarChart data={buildDistribution(draftExam)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="var(--brand-orange)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent></Card>
        </div>
      )}

      {step === "locked" && (
        <Card className="border-border/70"><CardContent className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-bold">Exam locked & submitted</h3>
          <p className="mt-2 text-sm text-muted-foreground">Results have been pushed to the Principal, Deputy Principal, and the Class Teacher dashboard.</p>
          <Button className="mt-6" onClick={() => { setStep("select"); setScores({}); }}>Enter another exam</Button>
        </CardContent></Card>
      )}
    </AppShell>
  );
}

function buildDistribution(ex: ExamEntry) {
  const dist: Record<string, number> = {};
  if (ex.system === "CBC") {
    ["EE", "ME", "AE", "BE"].forEach((k) => (dist[k] = 0));
    ex.scores.forEach((s) => s.rubric && (dist[s.rubric] = (dist[s.rubric] ?? 0) + 1));
  } else {
    ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"].forEach((k) => (dist[k] = 0));
    ex.scores.forEach((s) => {
      if (s.score === undefined) return;
      const g = scoreToGrade(s.score);
      dist[g] = (dist[g] ?? 0) + 1;
    });
  }
  return Object.entries(dist).map(([label, count]) => ({ label, count }));
}
