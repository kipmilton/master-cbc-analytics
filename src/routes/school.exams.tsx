import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { useStreams } from "@/lib/stream-store";
import { useSubjects } from "@/lib/subject-store";
import { useStudents } from "@/lib/student-store";
import { useExams, examMean, EXAM_TERMS, type ExamEntry, type CBCRubric } from "@/lib/exam-store";
import { scoreToGrade } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Lock, LockOpen, Pencil, Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/school/exams")({
  head: () => ({
    meta: [
      { title: "Exams & Results — Master CBC" },
      { name: "description", content: "Create, edit, lock and audit every exam record that feeds your school dashboards." },
      { property: "og:title", content: "Exams & Results — Master CBC" },
      { property: "og:description", content: "Admin control over every exam record feeding school analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminExamsPage,
});

const RUBRICS: CBCRubric[] = ["EE", "ME", "AE", "BE"];

function AdminExamsPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [streams] = useStreams();
  const [subjects] = useSubjects();
  const [students] = useStudents();
  const [exams, setExams] = useExams();

  const schoolStreams = streams.filter((s) => s.schoolId === schoolId);
  const schoolSubjects = subjects.filter((s) => s.schoolId === schoolId && s.approved);
  const schoolExams = exams.filter((e) => e.schoolId === schoolId);

  const [filterStream, setFilterStream] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");

  const rows = schoolExams.filter(
    (e) => (filterStream === "all" || e.streamId === filterStream) && (filterTerm === "all" || e.term === filterTerm),
  );

  // ----- create form -----
  const [newStream, setNewStream] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newTerm, setNewTerm] = useState("Term 2 - End");
  const [newName, setNewName] = useState("End Term Exam");

  const createStream = schoolStreams.find((s) => s.id === newStream);
  const createSubjects = createStream ? schoolSubjects.filter((s) => s.system === createStream.system) : schoolSubjects;

  function createExam() {
    if (!newStream || !newSubject) return toast.error("Pick a stream and a subject");
    const stream = schoolStreams.find((s) => s.id === newStream)!;
    const roster = students.filter((s) => s.streamId === newStream && s.status === "active");
    if (!roster.length) return toast.error("That stream has no active learners yet");
    const entry: ExamEntry = {
      id: `ex-${Date.now()}`,
      schoolId,
      streamId: newStream,
      subjectId: newSubject,
      teacherId: stream.classTeacherId ?? user?.id ?? "admin",
      term: newTerm,
      examName: newName.trim() || newTerm,
      system: stream.system,
      locked: false,
      createdAt: new Date().toISOString().slice(0, 10),
      scores: roster.map((s) => (stream.system === "8-4-4" ? { studentId: s.id } : { studentId: s.id, rubric: "ME" as CBCRubric })),
    };
    setExams([...exams, entry]);
    setEditingId(entry.id);
    setDraft(Object.fromEntries(entry.scores.map((s) => [s.studentId, stream.system === "8-4-4" ? s.score : s.rubric])));
    toast.success("Exam record created — enter the marks.");
  }

  // ----- editing -----
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number | CBCRubric | undefined>>({});
  const editing = useMemo(() => schoolExams.find((e) => e.id === editingId) ?? null, [schoolExams, editingId]);
  const editingRoster = editing ? students.filter((s) => s.streamId === editing.streamId && s.status === "active") : [];

  function openEditor(ex: ExamEntry) {
    setEditingId(ex.id);
    setDraft(
      Object.fromEntries(ex.scores.map((s) => [s.studentId, ex.system === "8-4-4" ? s.score : s.rubric])),
    );
  }

  function saveEditor() {
    if (!editing) return;
    const next = exams.map((e) =>
      e.id === editing.id
        ? {
            ...e,
            scores: editingRoster.map((stu) => {
              const v = draft[stu.id];
              return editing.system === "8-4-4"
                ? { studentId: stu.id, score: typeof v === "number" ? v : undefined }
                : { studentId: stu.id, rubric: (typeof v === "string" ? v : "ME") as CBCRubric };
            }),
          }
        : e,
    );
    setExams(next);
    setEditingId(null);
    toast.success("Marks saved — dashboards updated.");
  }

  function toggleLock(id: string) {
    const next = exams.map((e) => (e.id === id ? { ...e, locked: !e.locked } : e));
    setExams(next);
    const now = next.find((e) => e.id === id);
    toast.success(now?.locked ? "Exam locked — now counted in analytics." : "Exam unlocked for editing.");
  }

  function removeExam(id: string) {
    setExams(exams.filter((e) => e.id !== id));
    toast.success("Exam record deleted.");
  }

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";
  const streamName = (id: string) => {
    const s = streams.find((x) => x.id === id);
    return s ? `${s.grade} ${s.name}` : "—";
  };

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Exams & Results"
        subtitle="Every figure on the Overview and Analytics dashboards is computed from these records."
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-border/70 xl:col-span-2"><CardContent className="p-5">
          <div className="text-sm font-semibold">Create an exam record</div>
          <div className="mt-4 space-y-3">
            <div className="grid gap-2">
              <Label>Stream</Label>
              <Select value={newStream} onValueChange={(v) => { setNewStream(v); setNewSubject(""); }}>
                <SelectTrigger><SelectValue placeholder="Pick stream" /></SelectTrigger>
                <SelectContent>{schoolStreams.map((s) => <SelectItem key={s.id} value={s.id}>{s.grade} {s.name} ({s.system})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select value={newSubject} onValueChange={setNewSubject} disabled={!newStream}>
                <SelectTrigger><SelectValue placeholder="Pick subject" /></SelectTrigger>
                <SelectContent>{createSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Term</Label>
              <Select value={newTerm} onValueChange={setNewTerm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXAM_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Exam name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. End Term Exam" />
            </div>
            <Button className="w-full" onClick={createExam}><Plus className="mr-1 h-4 w-4" />Create & enter marks</Button>
            <p className="text-[11px] text-muted-foreground">
              Only <strong>locked</strong> records feed the composite means, trends and grade distributions.
            </p>
          </div>
        </CardContent></Card>

        <Card className="border-border/70 xl:col-span-3"><CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
            <div className="text-sm font-semibold">Exam records</div>
            <div className="ml-auto flex gap-2">
              <Select value={filterStream} onValueChange={setFilterStream}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All streams</SelectItem>
                  {schoolStreams.map((s) => <SelectItem key={s.id} value={s.id}>{s.grade} {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All terms</SelectItem>
                  {EXAM_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Stream / Subject</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Mean</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">No exam records match this filter.</td></tr>
                )}
                {rows.map((ex) => {
                  const m = examMean(ex);
                  return (
                    <tr key={ex.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{subjectName(ex.subjectId)}</div>
                        <div className="text-xs text-muted-foreground">{streamName(ex.streamId)} · {ex.system}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{ex.term}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{m.mean}</span>{" "}
                        <span className="text-xs text-muted-foreground">{m.grade}</span>
                      </td>
                      <td className="px-4 py-3">
                        {ex.locked
                          ? <Badge className="bg-emerald-600 text-white"><Lock className="mr-1 h-3 w-3" />Locked</Badge>
                          : <Badge variant="secondary"><LockOpen className="mr-1 h-3 w-3" />Draft</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditor(ex)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleLock(ex.id)}>
                            {ex.locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeExam(ex.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `${subjectName(editing.subjectId)} — ${streamName(editing.streamId)}` : ""}</DialogTitle>
            <DialogDescription>
              {editing ? `${editing.term} · ${editing.system}. Changes flow straight into the dashboards.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Adm.</th>
                  <th className="px-4 py-2">Learner</th>
                  <th className="px-4 py-2 w-44">{editing?.system === "CBC" ? "Band" : "Score / Grade"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {editingRoster.map((stu) => {
                  const v = draft[stu.id];
                  return (
                    <tr key={stu.id}>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{stu.admissionNo}</td>
                      <td className="px-4 py-2">{stu.name}</td>
                      <td className="px-4 py-2">
                        {editing?.system === "CBC" ? (
                          <Select value={typeof v === "string" ? v : ""} onValueChange={(code) => setDraft((p) => ({ ...p, [stu.id]: code as CBCRubric }))}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="Band" /></SelectTrigger>
                            <SelectContent>{RUBRICS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number" min={0} max={100} className="h-8"
                              value={typeof v === "number" ? v : ""}
                              onChange={(e) => setDraft((p) => ({
                                ...p,
                                [stu.id]: e.target.value === "" ? undefined : Math.min(100, Math.max(0, Number(e.target.value))),
                              }))}
                            />
                            <span className="w-8 text-xs text-muted-foreground">{typeof v === "number" ? scoreToGrade(v) : "—"}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {editingRoster.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-xs text-muted-foreground">This stream has no active learners.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={saveEditor}><Save className="mr-1 h-4 w-4" />Save marks</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
