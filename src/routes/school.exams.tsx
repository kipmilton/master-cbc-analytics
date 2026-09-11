import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSchoolData } from "@/hooks/use-school-data";
import { saveExam, setExamLocked, deleteExam, type CBCRubric, type ExamEntry } from "@/lib/school-data.functions";
import { EXAM_TERMS, RUBRICS, examMean, scoreToGrade } from "@/lib/analytics";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Lock, LockOpen, Pencil, Trash2, Save, Loader2, Printer } from "lucide-react";

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

function AdminExamsPage() {
  const { streams, subjects, students, exams, isLoading, refresh } = useSchoolData();

  const approvedSubjects = subjects.filter((s) => s.approved);

  const [filterStream, setFilterStream] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");

  const rows = exams.filter(
    (e) => (filterStream === "all" || e.streamId === filterStream) && (filterTerm === "all" || e.term === filterTerm),
  );

  const [newStream, setNewStream] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newTerm, setNewTerm] = useState<string>(EXAM_TERMS[5]);
  const [newName, setNewName] = useState("End Term Exam");

  const createStream = streams.find((s) => s.id === newStream);
  const createSubjects = createStream ? approvedSubjects.filter((s) => s.system === createStream.system) : approvedSubjects;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number | CBCRubric | undefined>>({});
  const editing = useMemo(() => exams.find((e) => e.id === editingId) ?? null, [exams, editingId]);
  const editingRoster = editing ? students.filter((s) => s.streamId === editing.streamId && s.status === "active") : [];

  const save = useMutation({
    mutationFn: (input: NonNullable<Parameters<typeof saveExam>[0]>["data"]) => saveExam({ data: input }),
    onSuccess: () => refresh(),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not save the exam record"),
  });

  const lock = useMutation({
    mutationFn: (input: { id: string; locked: boolean }) => setExamLocked({ data: input }),
    onSuccess: (_r, v) => {
      refresh();
      toast.success(v.locked ? "Exam locked — now counted in analytics." : "Exam unlocked for editing.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not change the lock state"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteExam({ data: { id } }),
    onSuccess: () => { refresh(); toast.success("Exam record deleted."); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not delete the exam record"),
  });

  async function createExam() {
    if (!newStream || !newSubject) return toast.error("Pick a stream and a subject");
    const stream = streams.find((s) => s.id === newStream)!;
    const roster = students.filter((s) => s.streamId === newStream && s.status === "active");
    if (!roster.length) return toast.error("That stream has no active learners yet");
    await save.mutateAsync({
      streamId: newStream,
      subjectId: newSubject,
      term: newTerm,
      examName: newName.trim() || newTerm,
      system: stream.system,
      locked: false,
      scores: roster.map((s) =>
        stream.system === "8-4-4" ? { studentId: s.id } : { studentId: s.id, rubric: "ME" as CBCRubric },
      ),
    });
    toast.success("Exam record created — open it to enter the marks.");
  }

  function openEditor(ex: ExamEntry) {
    setEditingId(ex.id);
    setDraft(Object.fromEntries(ex.scores.map((s) => [s.studentId, ex.system === "8-4-4" ? s.score : s.rubric])));
  }

  async function saveEditor() {
    if (!editing) return;
    await save.mutateAsync({
      id: editing.id,
      streamId: editing.streamId,
      subjectId: editing.subjectId,
      term: editing.term,
      examName: editing.examName,
      system: editing.system,
      locked: editing.locked,
      scores: editingRoster.map((stu) => {
        const v = draft[stu.id];
        return editing.system === "8-4-4"
          ? { studentId: stu.id, score: typeof v === "number" ? v : undefined }
          : { studentId: stu.id, rubric: (typeof v === "string" ? v : "ME") as CBCRubric };
      }),
    });
    setEditingId(null);
    toast.success("Marks saved — dashboards updated.");
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
        action={
          <Link to="/teacher/report-cards">
            <Button size="sm" className="bg-[#E8672E] hover:bg-[#C6511F] text-white">
              <Printer className="mr-1.5 h-4 w-4" /> Print Student Report Cards
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-border/70 xl:col-span-2"><CardContent className="p-5">
          <div className="text-sm font-semibold">Create an exam record</div>
          <div className="mt-4 space-y-3">
            <div className="grid gap-2">
              <Label>Stream</Label>
              <Select value={newStream} onValueChange={(v) => { setNewStream(v); setNewSubject(""); }}>
                <SelectTrigger><SelectValue placeholder="Pick stream" /></SelectTrigger>
                <SelectContent>{streams.map((s) => <SelectItem key={s.id} value={s.id}>{s.grade} {s.name} ({s.system})</SelectItem>)}</SelectContent>
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
            <Button className="w-full" onClick={createExam} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Create & enter marks
            </Button>
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
                  {streams.map((s) => <SelectItem key={s.id} value={s.id}>{s.grade} {s.name}</SelectItem>)}
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
                {isLoading && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">Loading exam records…</td></tr>
                )}
                {!isLoading && rows.length === 0 && (
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
                          <Button size="sm" variant="ghost" disabled={lock.isPending} onClick={() => lock.mutate({ id: ex.id, locked: !ex.locked })}>
                            {ex.locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(ex.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
            <Button onClick={saveEditor} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}Save marks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
