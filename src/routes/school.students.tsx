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
import { useStudents, type StudentExt, type Gender } from "@/lib/student-store";
import { useStreams } from "@/lib/stream-store";
import { useTeachers } from "@/lib/teacher-store";
import { useSession } from "@/hooks/use-session";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, UserMinus, UserX, Search, Plus, Users } from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/school/students")({
  head: () => ({ meta: [{ title: "Student Directory — Master CBC" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [students, setStudents] = useStudents();
  const [streams, setStreams] = useStreams();
  const [teachers] = useTeachers();
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pool" | "assigned" | "archived">("all");

  const rows = useMemo(() => {
    return students
      .filter((s) => s.schoolId === schoolId)
      .filter((s) => {
        if (filter === "pool") return !s.streamId && s.status === "active";
        if (filter === "assigned") return s.streamId && s.status === "active";
        if (filter === "archived") return s.status.startsWith("archived");
        return true;
      })
      .filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.admissionNo.includes(q));
  }, [students, schoolId, filter, q]);

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        const additions: StudentExt[] = [];
        parsed.forEach((r, i) => {
          const name = String(r["Name"] ?? r["Student Name"] ?? r["name"] ?? "").trim();
          const admissionNo = String(r["Admission Number"] ?? r["Adm"] ?? r["admissionNo"] ?? "").trim();
          const genderRaw = String(r["Gender"] ?? r["gender"] ?? "M").trim().toUpperCase();
          const yob = Number(r["Year of Birth"] ?? r["YOB"] ?? r["yearOfBirth"] ?? 2008);
          if (!name || !admissionNo) return;
          additions.push({
            id: `imp-${Date.now()}-${i}`,
            schoolId,
            name,
            admissionNo,
            gender: (genderRaw.startsWith("F") ? "F" : "M") as Gender,
            yearOfBirth: yob,
            status: "active",
          });
        });
        if (!additions.length) { toast.error("No valid rows found. Required columns: Name, Admission Number, Gender, Year of Birth."); return; }
        setStudents([...students, ...additions]);
        toast.success(`Imported ${additions.length} learners to the master pool.`);
      } catch {
        toast.error("Could not parse file. Please upload a valid Excel/CSV.");
      }
    };
    reader.readAsBinaryString(file);
  }

  function archive(id: string, kind: "transfer" | "expelled") {
    setStudents(students.map((s) => s.id === id ? { ...s, status: kind === "transfer" ? "archived-transfer" : "archived-expelled", streamId: undefined, archivedAt: new Date().toISOString().slice(0, 10) } : s));
    toast.success(`Learner archived (${kind}). Academic history preserved.`);
  }

  const stats = {
    total: students.filter((s) => s.schoolId === schoolId && s.status === "active").length,
    pool: students.filter((s) => s.schoolId === schoolId && !s.streamId && s.status === "active").length,
    archived: students.filter((s) => s.schoolId === schoolId && s.status.startsWith("archived")).length,
  };

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Student Directory & Streams"
        subtitle="The master pool of every learner in your school. Import rosters, manage lifecycle, and organise streams."
        action={
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
            <Button onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Import School Roster (Excel/CSV)</Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <StatCard label="Active learners" value={stats.total} tint="blue" />
        <StatCard label="Unassigned pool" value={stats.pool} tint="emerald" />
        <StatCard label="Archived records" value={stats.archived} tint="slate" />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Master Directory</TabsTrigger>
          <TabsTrigger value="streams">Streams & Class Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-4">
          <Card className="border-border/70"><CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
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
                    const st = streams.find((x) => x.id === s.streamId);
                    const archived = s.status.startsWith("archived");
                    return (
                      <tr key={s.id} className={archived ? "opacity-60" : ""}>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                        <td className="px-4 py-2 font-medium">{s.name}</td>
                        <td className="px-4 py-2">{s.gender}</td>
                        <td className="px-4 py-2">{s.yearOfBirth}</td>
                        <td className="px-4 py-2">{st ? <Badge variant="outline">{st.grade} {st.name}</Badge> : <span className="text-xs text-muted-foreground">Pool</span>}</td>
                        <td className="px-4 py-2">
                          {s.status === "active" && <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">Active</Badge>}
                          {s.status === "archived-transfer" && <Badge variant="secondary">Transferred</Badge>}
                          {s.status === "archived-expelled" && <Badge variant="destructive">Expelled</Badge>}
                          {s.status === "pending-approval" && <Badge className="bg-amber-500/15 text-amber-700">Pending</Badge>}
                        </td>
                        <td className="px-4 py-2">
                          {!archived && (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => archive(s.id, "transfer")}><UserMinus className="mr-1 h-3.5 w-3.5" />Transfer</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => archive(s.id, "expelled")}><UserX className="mr-1 h-3.5 w-3.5" />Expel</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No learners match.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="streams" className="mt-4">
          <StreamsPanel schoolId={schoolId} streams={streams} setStreams={setStreams} teachers={teachers.filter((t) => t.schoolId === schoolId)} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function StatCard({ label, value, tint }: { label: string; value: number; tint: "blue" | "emerald" | "slate" }) {
  const tintClasses = tint === "blue" ? "text-[color:var(--brand-blue)]" : tint === "emerald" ? "text-emerald-600" : "text-slate-600";
  return (
    <Card className="border-border/70"><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tintClasses}`}>{value.toLocaleString()}</div>
    </CardContent></Card>
  );
}

function StreamsPanel({ schoolId, streams, setStreams, teachers }: {
  schoolId: string;
  streams: ReturnType<typeof useStreams>[0];
  setStreams: ReturnType<typeof useStreams>[1];
  teachers: ReturnType<typeof useTeachers>[0];
}) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [name, setName] = useState("");
  const [system, setSystem] = useState<"CBC" | "8-4-4">("CBC");
  const [classTeacherId, setClassTeacherId] = useState<string>("");

  const rows = streams.filter((s) => s.schoolId === schoolId);

  function create() {
    if (!grade || !name) { toast.error("Grade and stream name are required."); return; }
    const next = { id: `st-${Date.now()}`, schoolId, grade, name, system, classTeacherId: classTeacherId || undefined };
    setStreams([...streams, next]);
    toast.success(`Stream ${grade} ${name} created.`);
    setOpen(false); setGrade(""); setName(""); setClassTeacherId("");
  }

  function assign(streamId: string, teacherId: string) {
    setStreams(streams.map((s) => s.id === streamId ? { ...s, classTeacherId: teacherId || undefined } : s));
    toast.success("Class teacher updated.");
  }

  return (
    <Card className="border-border/70"><CardContent className="p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-sm font-semibold">Streams ({rows.length})</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />New stream</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create stream</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Grade / Form</Label><Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Grade 10" /></div>
                <div><Label>Stream name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. West" /></div>
              </div>
              <div><Label>Curriculum</Label>
                <Select value={system} onValueChange={(v) => setSystem(v as "CBC" | "8-4-4")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="CBC">CBC</SelectItem><SelectItem value="8-4-4">8-4-4</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Class Teacher</Label>
                <Select value={classTeacherId} onValueChange={setClassTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Assign later or now…" /></SelectTrigger>
                  <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={create}>Create stream</Button></DialogFooter>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3 font-medium">{s.grade}</td>
                <td className="px-5 py-3">{s.name}</td>
                <td className="px-5 py-3"><Badge variant="outline">{s.system}</Badge></td>
                <td className="px-5 py-3">
                  <Select value={s.classTeacherId ?? ""} onValueChange={(v) => assign(s.id, v)}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="— unassigned —" /></SelectTrigger>
                    <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} <span className="text-xs text-muted-foreground">· {t.title}</span></SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent></Card>
  );
}
