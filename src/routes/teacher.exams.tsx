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
import { useSchoolData } from "@/hooks/use-school-data";
import { saveExam, type CBCRubric } from "@/lib/school-data.functions";
import { computeEight, computeCBC } from "@/lib/grading";
import { EXAM_TERMS } from "@/lib/analytics";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, ArrowLeft, Printer, GraduationCap, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/teacher/exams")({
  head: () => ({
    meta: [
      { title: "Enter Exam Marks — Master CBC" },
      { name: "description", content: "Capture CBC bands or 8-4-4 marks for your streams and lock them straight into the school analytics." },
      { property: "og:title", content: "Enter Exam Marks — Master CBC" },
      { property: "og:description", content: "Capture and lock exam marks for your assigned streams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExamEntryPage,
});

type Workspace = "8-4-4" | "CBC";
type CBCLevelFilter = "All" | "Junior Secondary" | "Senior Secondary";

function ExamEntryPage() {
  const user = useSession();
  const { schoolName, streams, subjects, students, grading: cfg, refresh } = useSchoolData();

  const [workspace, setWorkspace] = useState<Workspace>("CBC");
  const [cbcFilter, setCbcFilter] = useState<CBCLevelFilter>("All");

  const myStreams = streams.filter((s) => (user?.assignedStreams ?? []).includes(s.id) && s.system === workspace);
  const filteredStreams = workspace === "CBC" && cbcFilter !== "All"
    ? myStreams.filter((s) =>
        cbcFilter === "Junior Secondary"
          ? ["Grade 7", "Grade 8", "Grade 9"].includes(s.grade)
          : ["Grade 10", "Grade 11", "Grade 12"].includes(s.grade),
      )
    : myStreams;

  const [streamId, setStreamId] = useState("");
  const stream = streams.find((s) => s.id === streamId);
  const mySubjectIds = user?.assignedSubjects ?? [];
  const availableSubjects = subjects.filter(
    (s) => s.approved && s.system === workspace && (mySubjectIds.length === 0 || mySubjectIds.includes(s.id)),
  );
  const [subjectId, setSubjectId] = useState("");
  const subject = subjects.find((s) => s.id === subjectId);
  const [term, setTerm] = useState<string>(EXAM_TERMS[5]);
  const [examType, setExamType] = useState("End Term Exam");
  const [locked, setLocked] = useState(false);

  const streamStudents = useMemo(
    () => students.filter((x) => x.streamId === streamId && x.status === "active"),
    [students, streamId],
  );
  const [scores, setScores] = useState<Record<string, number | undefined>>({});

  const cbcBands = cfg.splitCBC ? cfg.cbc8 : cfg.cbc4;
  const filled = streamStudents.filter((s) => typeof scores[s.id] === "number");
  const avg = filled.length ? filled.reduce((a, s) => a + (scores[s.id] ?? 0), 0) / filled.length : 0;

  const save = useMutation({
    mutationFn: (input: NonNullable<Parameters<typeof saveExam>[0]>["data"]) => saveExam({ data: input }),
    onSuccess: () => {
      refresh();
      setLocked(true);
      toast.success("Exam locked & submitted. Results pushed to the school dashboards.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not submit the exam"),
  });

  function submit() {
    if (!subjectId || !streamId) return toast.error("Pick a stream and subject");
    if (filled.length === 0) return toast.error("Enter at least one score");
    save.mutate({
      streamId,
      subjectId,
      term,
      examName: examType.trim() || term,
      system: workspace,
      locked: true,
      scores: filled.map((stu) => {
        const raw = scores[stu.id] ?? 0;
        if (workspace === "8-4-4") return { studentId: stu.id, score: raw };
        const code = computeCBC(raw, cbcBands).code;
        const rubric = (["EE", "ME", "AE", "BE"] as CBCRubric[]).find((r) => code.startsWith(r)) ?? "ME";
        return { studentId: stu.id, rubric };
      }),
    });
  }

  function reset() {
    setLocked(false); setScores({}); setStreamId(""); setSubjectId("");
  }

  return (
    <AppShell allow={["teacher"]}>
      <div className="print:hidden">
        <PageHeader title="Enter Exam Marks" subtitle="Switch curriculum workspace, pick a stream, then capture marks. Locked results flow to the Principal." />

        <Card className="mb-4 border-border/70"><CardContent className="p-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-border bg-secondary/40 p-1">
              {(["8-4-4", "CBC"] as Workspace[]).map((w) => (
                <button key={w} onClick={() => { setWorkspace(w); setStreamId(""); setSubjectId(""); setScores({}); setLocked(false); }}
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
              <Select value={streamId} onValueChange={(v) => { setStreamId(v); setLocked(false); setScores({}); }}>
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
                <SelectContent>{EXAM_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Exam type</Label>
              <Input value={examType} onChange={(e) => setExamType(e.target.value)} />
            </div>
          </div>
          {filteredStreams.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              You have no {workspace} streams assigned. Ask your Principal or Deputy to assign you from Staff & Teachers.
            </p>
          )}
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
                <Button size="sm" onClick={submit} disabled={save.isPending}>
                  {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Lock className="mr-1 h-4 w-4" />}Lock & Submit
                </Button>
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
                  {streamStudents.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">This stream has no active learners.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}
      </div>

      {streamId && subjectId && (
        <div className="hidden print:block">
          <div className="mb-6 border-b-2 border-black pb-3">
            <div className="text-2xl font-bold">{schoolName || "School"}</div>
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
                const r = v === undefined
                  ? null
                  : workspace === "CBC"
                    ? computeCBC(v, cbcBands)
                    : { code: computeEight(v, cfg.eight).grade, points: computeEight(v, cfg.eight).points };
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
            <div>Teacher: {user?.name}<br />Signature: __________________ Date: __________</div>
            <div>Class Teacher: __________________<br />Signature: __________________ Date: __________</div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
