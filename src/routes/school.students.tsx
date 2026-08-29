import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSchoolData } from "@/hooks/use-school-data";
import {
  saveStudents, setStudentStatus, assignStudentsToStream, saveStream, deleteStream,
  type Gender, type Stream, type SystemType,
} from "@/lib/school-data.functions";
import { listSchoolStaff, type StaffRow } from "@/lib/staff.functions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, UserMinus, UserX, Search, Plus, Loader2, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/school/students")({
  head: () => ({
    meta: [
      { title: "Students & Streams — Master CBC" },
      { name: "description", content: "Import learners, manage the master pool, archive records and organise streams with class teachers." },
      { property: "og:title", content: "Students & Streams — Master CBC" },
      { property: "og:description", content: "Import learners, manage lifecycle and organise streams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentsPage,
});

interface ImportRow {
  name: string;
  admissionNo: string;
  gender: Gender;
  yearOfBirth: number;
  status: "active";
}

function StudentsPage() {
  const { students, streams, refresh, isLoading } = useSchoolData();
  const staff = useQuery({ queryKey: ["schoolStaff"], queryFn: () => listSchoolStaff(), staleTime: 30_000 });
  const teachers = (staff.data ?? []).filter((t) => t.role === "teacher");

  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pool" | "assigned" | "archived">("all");

  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Something went wrong");

  const importer = useMutation({
    mutationFn: (rows: ImportRow[]) => saveStudents({ data: { students: rows } }),
    onSuccess: (_d, rows) => { refresh(); toast.success(`Imported ${rows.length} learner(s) into the master pool.`); },
    onError: fail,
  });

  const archiver = useMutation({
    mutationFn: (v: { id: string; status: "archived-transfer" | "archived-expelled" }) => setStudentStatus({ data: v }),
    onSuccess: () => { refresh(); toast.success("Learner archived. Academic history preserved."); },
    onError: fail,
  });

  const assigner = useMutation({
    mutationFn: (v: { studentIds: string[]; streamId: string | null }) => assignStudentsToStream({ data: v }),
    onSuccess: () => { refresh(); toast.success("Stream assignment updated."); },
    onError: fail,
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return students
      .filter((s) => {
        if (filter === "pool") return !s.streamId && s.status === "active";
        if (filter === "assigned") return !!s.streamId && s.status === "active";
        if (filter === "archived") return s.status.startsWith("archived");
        return true;
      })
      .filter((s) => !needle || s.name.toLowerCase().includes(needle) || s.admissionNo.toLowerCase().includes(needle));
  }, [students, filter, q]);

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        const additions: ImportRow[] = [];
        parsed.forEach((r) => {
          const name = String(r["Name"] ?? r["Student Name"] ?? r["name"] ?? "").trim();
          const admissionNo = String(r["Admission Number"] ?? r["Adm"] ?? r["admissionNo"] ?? "").trim();
          const genderRaw = String(r["Gender"] ?? r["gender"] ?? "M").trim().toUpperCase();
          const yob = Number(r["Year of Birth"] ?? r["YOB"] ?? r["yearOfBirth"] ?? 2008);
          if (!name || !admissionNo) return;
          additions.push({
            name,
            admissionNo,
            gender: genderRaw.startsWith("F") ? "F" : "M",
            yearOfBirth: Number.isFinite(yob) ? yob : 2008,
            status: "active",
          });
        });
        if (!additions.length) {
          toast.error("No valid rows found. Required columns: Name, Admission Number, Gender, Year of Birth.");
          return;
        }
        importer.mutate(additions);
      } catch {
        toast.error("Could not parse file. Please upload a valid Excel/CSV.");
      }
    };
    reader.readAsBinaryString(file);
  }

  const stats = {
    total: students.filter((s) => s.status === "active").length,
    pool: students.filter((s) => !s.streamId && s.status === "active").length,
    archived: students.filter((s) => s.status.startsWith("archived")).length,
  };

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Student Directory & Streams"
        subtitle="The master pool of every learner in your school. Import rosters, manage lifecycle, and organise streams."
        action={
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={importer.isPending}>
              {importer.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import Roster (Excel/CSV)
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MiniStat label="Active learners" value={stats.total} tint="blue" />
        <MiniStat label="Unassigned pool" value={stats.pool} tint="emerald" />
        <MiniStat label="Archived records" value={stats.archived} tint="slate" />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Master Directory</TabsTrigger>
          <TabsTrigger value="streams">Streams &amp; Class Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-4">
          <Card className="border-border/70"><CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or admission number…" className="pl-9" />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All learners</SelectItem>
                  <SelectItem value="pool">Unassigned pool</SelectItem>
                  <SelectItem value="assigned">Assigned to stream</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent></Card>

          <Card className="mt-4 border-border/70"><CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Admission</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">YOB</th>
                    <th className="px-4 py-3">Stream</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.slice(0, 300).map((s) => {
                    const archived = s.status.startsWith("archived");
                    return (
                      <tr key={s.id} className={archived ? "opacity-60" : ""}>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                        <td className="px-4 py-2 font-medium">{s.name}</td>
                        <td className="px-4 py-2">{s.gender}</td>
                        <td className="px-4 py-2">{s.yearOfBirth}</td>
                        <td className="px-4 py-2">
                          {archived ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <Select
                              value={s.streamId ?? "__pool"}
                              onValueChange={(v) => assigner.mutate({ studentIds: [s.id], streamId: v === "__pool" ? null : v })}
                            >
                              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__pool">Master pool</SelectItem>
                                {streams.map((st) => (
                                  <SelectItem key={st.id} value={st.id}>{st.grade} {st.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {s.status === "active" && <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">Active</Badge>}
                          {s.status === "archived-transfer" && <Badge variant="secondary">Transferred</Badge>}
                          {s.status === "archived-expelled" && <Badge variant="destructive">Expelled</Badge>}
                          {s.status === "pending-approval" && <Badge className="bg-amber-500/15 text-amber-700">Pending</Badge>}
                        </td>
                        <td className="px-4 py-2">
                          {!archived && (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => archiver.mutate({ id: s.id, status: "archived-transfer" })}>
                                <UserMinus className="mr-1 h-3.5 w-3.5" />Transfer
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => archiver.mutate({ id: s.id, status: "archived-expelled" })}>
                                <UserX className="mr-1 h-3.5 w-3.5" />Expel
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      {isLoading ? "Loading learners…" : "No learners match. Import a roster to get started."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="streams" className="mt-4">
          <StreamsPanel streams={streams} teachers={teachers} onChanged={refresh} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function MiniStat({ label, value, tint }: { label: string; value: number; tint: "blue" | "emerald" | "slate" }) {
  const tintClasses = tint === "blue" ? "text-[color:var(--brand-blue)]" : tint === "emerald" ? "text-emerald-600" : "text-slate-600";
  return (
    <Card className="border-border/70"><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tintClasses}`}>{value.toLocaleString()}</div>
    </CardContent></Card>
  );
}

function StreamsPanel({ streams, teachers, onChanged }: { streams: Stream[]; teachers: StaffRow[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [name, setName] = useState("");
  const [system, setSystem] = useState<SystemType>("CBC");
  const [classTeacherId, setClassTeacherId] = useState("");

  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Something went wrong");

  const upsert = useMutation({
    mutationFn: (v: { id?: string; grade: string; name: string; system: SystemType; classTeacherId: string | null }) =>
      saveStream({ data: v }),
    onSuccess: () => { onChanged(); toast.success("Stream saved."); },
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStream({ data: { id } }),
    onSuccess: () => { onChanged(); toast.success("Stream deleted."); },
    onError: fail,
  });

  function create() {
    if (!grade.trim() || !name.trim()) { toast.error("Grade and stream name are required."); return; }
    upsert.mutate(
      { grade: grade.trim(), name: name.trim(), system, classTeacherId: classTeacherId || null },
      { onSuccess: () => { setOpen(false); setGrade(""); setName(""); setClassTeacherId(""); } },
    );
  }

  return (
    <Card className="border-border/70"><CardContent className="p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-sm font-semibold">Streams ({streams.length})</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />New stream</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create stream</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Grade / Form</Label><Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Grade 10" /></div>
                <div><Label>Stream name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. West" /></div>
              </div>
              <div>
                <Label>Curriculum</Label>
                <Select value={system} onValueChange={(v) => setSystem(v as SystemType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="CBC">CBC</SelectItem><SelectItem value="8-4-4">8-4-4</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class Teacher</Label>
                <Select value={classTeacherId || "__none"} onValueChange={(v) => setClassTeacherId(v === "__none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Assign later or now…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— unassigned —</SelectItem>
                    {teachers.map((t) => <SelectItem key={t.userId} value={t.userId}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={upsert.isPending}>
                {upsert.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Create stream
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-2">Grade</th>
              <th className="px-5 py-2">Stream</th>
              <th className="px-5 py-2">System</th>
              <th className="px-5 py-2">Class Teacher</th>
              <th className="px-5 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {streams.map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3 font-medium">{s.grade}</td>
                <td className="px-5 py-3">{s.name}</td>
                <td className="px-5 py-3"><Badge variant="outline">{s.system}</Badge></td>
                <td className="px-5 py-3">
                  <Select
                    value={s.classTeacherId ?? "__none"}
                    onValueChange={(v) =>
                      upsert.mutate({
                        id: s.id, grade: s.grade, name: s.name, system: s.system,
                        classTeacherId: v === "__none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="w-64"><SelectValue placeholder="— unassigned —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— unassigned —</SelectItem>
                      {teachers.map((t) => <SelectItem key={t.userId} value={t.userId}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {!streams.length && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                No streams yet. Create the first one to start mapping learners.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContent></Card>
  );
}
