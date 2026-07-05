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
import { streams, students, schools } from "@/lib/mock-data";
import { useSubjects } from "@/lib/subject-store";
import { useGradingConfig, computeEight, computeCBC } from "@/lib/grading-store";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, ArrowLeft, Save, Printer, GraduationCap, Sparkles } from "lucide-react";

export const Route = createFileRoute("/teacher/exams")({
  head: () => ({ meta: [{ title: "Enter Exam — Master CBC" }] }),
  component: ExamEntryPage,
});

type Workspace = "8-4-4" | "CBC";
type CBCLevelFilter = "All" | "Junior Secondary" | "Senior Secondary";

function ExamEntryPage() {
  const user = useSession();
  const [subjects] = useSubjects();
  const [cfg] = useGradingConfig();

  const [workspace, setWorkspace] = useState<Workspace>("CBC");
  const [cbcFilter, setCbcFilter] = useState<CBCLevelFilter>("All");

  const myStreams = streams.filter((s) => (user?.assignedStreams ?? []).includes(s.id) && s.system === workspace);

  const filteredStreams = workspace === "CBC" && cbcFilter !== "All"
    ? myStreams.filter((s) => (cbcFilter === "Junior Secondary" ? ["Grade 7", "Grade 8", "Grade 9"].includes(s.grade) : ["Grade 10", "Grade 11", "Grade 12"].includes(s.grade)))
    : myStreams;

  const [streamId, setStreamId] = useState("");
  const stream = streams.find((s) => s.id === streamId);
  const availableSubjects = subjects.filter((s) => s.schoolId === user?.schoolId && s.approved && s.system === workspace);
  const [subjectId, setSubjectId] = useState("");
  const subject = subjects.find((s) => s.id === subjectId);
  const [term, setTerm] = useState("Term 2 - End");
  const [examType, setExamType] = useState("End Term Exam");
  const [locked, setLocked] = useState(false);

  const streamStudents = useMemo(() => students.filter((x) => x.streamId === streamId), [streamId]);
  // For CBC we still accept 0-100 raw and compute band from admin bands (fallback chain: school-wide default here).
  const [scores, setScores] = useState<Record<string, number | undefined>>({});

  const cbcBands = cfg.splitCBC ? cfg.cbc8 : cfg.cbc4;

  const filled = streamStudents.filter((s) => scores[s.id] !== undefined && scores[s.id] !== null);
  const avg = filled.length ? filled.reduce((a, s) => a + (scores[s.id] ?? 0), 0) / filled.length : 0;

  function submit() {
    if (!subjectId || !streamId) return toast.error("Pick a stream and subject");
    if (filled.length === 0) return toast.error("Enter at least one score");
    setLocked(true);
    toast.success("Exam locked & submitted. Results pushed to admin.");
  }

  function reset() {
    setLocked(false); setScores({}); setStreamId(""); setSubjectId("");
  }

  const school = schools.find((s) => s.id === user?.schoolId);

  return (
    <AppShell allow={["teacher"]}>
      <div className="print:hidden">
        <PageHeader title="Enter Exam Marks" subtitle="Switch curriculum workspace, pick a stream, then capture marks. Locked results flow to the Principal." />

        {/* Workspace toggle */}
        <Card className="mb-4 border-border/70"><CardContent className="p-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-border bg-secondary/40 p-1">
              {(["8-4-4", "CBC"] as Workspace[]).map((w) => (
                <button key={w} onClick={() => { setWorkspace(w); setStreamId(""); setSubjectId(""); }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${workspace === w ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {w === "CBC" ? <Sparkles className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                  {w}
                </button>
              ))}
            </div>
            {workspace === "CBC" && (
              <div className="inline-flex rounded-md border border-border p-1">
                {(["All", "Junior Secondary", "Senior Secondary"] as CBCLevelFilter[]).map((f) => (
                  <button key={f} onClick={() => setCbcFilter(f)}
                    className={`rounded-sm px-3 py-1 text-xs font-medium ${cbcFilter === f ? "bg-[color:var(--brand-blue)] text-white" : "text-muted-foreground hover:text-foreground"}`}>
                    {f}
                  </button>
                ))}
              </div>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              Active rule: <strong className="text-foreground">{workspace === "8-4-4" ? cfg.meanRule.toUpperCase() : (cfg.splitCBC ? "CBC · 8 sub-levels" : "CBC · 4 bands")}</strong>
            </span>
          </div>
        </CardContent></Card>

        <Card className="mb-6 border-border/70"><CardContent className="p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label>Stream</Label>
              <Select value={streamId} onValueChange={(v) => { setStreamId(v); setLocked(false); }}>
                <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                <SelectContent>{filteredStreams.map((s) => <SelectItem key={s.id} value={s.id}>{s.grade} {s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setLocked(false); }}>
                <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                <SelectContent>{availableSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Term 1 - Opener", "Term 1 - Mid", "Term 1 - End", "Term 2 - Opener", "Term 2 - Mid", "Term 2 - End", "Term 3 - End"].map((t) =>
                    <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Exam type</Label>
              <Input value={examType} onChange={(e) => setExamType(e.target.value)} />
            </div>
          </div>
        </CardContent></Card>

        {streamId && subjectId && (
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {streamStudents.length} learners · {filled.length} entered · Mean {avg ? avg.toFixed(1) : "—"}%
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1 h-4 w-4" />Print / Download Score Sheet
              </Button>
              {!locked ? (
                <Button size="sm" onClick={submit}><Lock className="mr-1 h-4 w-4" />Lock & Submit</Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={reset}><ArrowLeft className="mr-1 h-4 w-4" />New entry</Button>
              )}
            </div>
          </div>
        )}

        {streamId && subjectId && (
          <Card className="border-border/70"><CardContent className="p-0">
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2">Adm.</th>
                    <th className="px-5 py-2">Name</th>
                    <th className="px-5 py-2 w-40">Raw score (0-100)</th>
                    <th className="px-5 py-2 w-56">{workspace === "CBC" ? "Performance band" : "Grade · Points"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {streamStudents.map((s) => {
                    const v = scores[s.id];
                    return (
                      <tr key={s.id}>
                        <td className="px-5 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                        <td className="px-5 py-2">{s.name}</td>
                        <td className="px-5 py-2">
                          <Input type="number" min={0} max={100} disabled={locked} value={v ?? ""}
                            onChange={(e) => setScores((p) => ({ ...p, [s.id]: e.target.value === "" ? undefined : Math.min(100, Math.max(0, Number(e.target.value))) }))}
                            className="h-8" placeholder="0-100" />
                        </td>
                        <td className="px-5 py-2">
                          {workspace === "CBC" ? (
                            <Select disabled={locked} value={v !== undefined ? computeCBC(v, cbcBands).code : ""}
                              onValueChange={(code) => {
                                const b = cbcBands.find((x) => x.code === code);
                                if (b) setScores((p) => ({ ...p, [s.id]: Math.round((b.min + b.max) / 2) }));
                              }}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                              <SelectContent>
                                {cbcBands.map((b) => <SelectItem key={b.code} value={b.code}>{b.code} · {b.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : v !== undefined ? (
                            <Badge variant="outline" className="font-semibold">
                              {computeEight(v, cfg.eight).grade} · {computeEight(v, cfg.eight).points} pts
                            </Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}
      </div>

      {/* Print-only sheet */}
      {streamId && subjectId && (
        <div className="hidden print:block">
          <div className="mb-6 border-b-2 border-black pb-3">
            <div className="text-2xl font-bold">{school?.name ?? "School"}</div>
            <div className="text-sm">Class: {stream?.grade} {stream?.name} · Subject: {subject?.name} · Term: {term} · Exam: {examType}</div>
            <div className="text-xs">Curriculum: {workspace} {workspace === "CBC" ? (cfg.splitCBC ? "(8 sub-levels)" : "(4 bands)") : ""}</div>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="border border-black px-2 py-1 text-left">#</th>
                <th className="border border-black px-2 py-1 text-left">Admission</th>
                <th className="border border-black px-2 py-1 text-left">Learner Name</th>
                <th className="border border-black px-2 py-1 text-left">Raw Mark</th>
                <th className="border border-black px-2 py-1 text-left">{workspace === "CBC" ? "Band" : "Grade"}</th>
                <th className="border border-black px-2 py-1 text-left">Points</th>
                <th className="border border-black px-2 py-1 text-left">Signature</th>
              </tr>
            </thead>
            <tbody>
              {streamStudents.map((s, i) => {
                const v = scores[s.id];
                const r = v === undefined ? null : workspace === "CBC" ? computeCBC(v, cbcBands) : { code: computeEight(v, cfg.eight).grade, points: computeEight(v, cfg.eight).points };
                return (
                  <tr key={s.id}>
                    <td className="border border-black px-2 py-1">{i + 1}</td>
                    <td className="border border-black px-2 py-1">{s.admissionNo}</td>
                    <td className="border border-black px-2 py-1">{s.name}</td>
                    <td className="border border-black px-2 py-1">{v ?? ""}</td>
                    <td className="border border-black px-2 py-1">{r?.code ?? ""}</td>
                    <td className="border border-black px-2 py-1">{r?.points ?? ""}</td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
            <div>Teacher: {user?.name}<br/>Signature: __________________ Date: __________</div>
            <div>Class Teacher: __________________<br/>Signature: __________________ Date: __________</div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
