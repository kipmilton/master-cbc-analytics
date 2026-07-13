import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/hooks/use-session";
import { useStreams } from "@/lib/stream-store";
import { useStudents } from "@/lib/student-store";
import { useRosters, type RosterSubmission } from "@/lib/roster-store";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Send, Trash2, Search, Plus, GraduationCap, Lock } from "lucide-react";

export const Route = createFileRoute("/teacher/my-class")({
  head: () => ({ meta: [{ title: "My Class — Master CBC" }] }),
  component: MyClassPage,
});

function MyClassPage() {
  const user = useSession();
  const [streams] = useStreams();
  const [students, setStudents] = useStudents();
  const [rosters, setRosters] = useRosters();

  const myClass = streams.find((s) => s.classTeacherId === user?.id);

  if (!user) return null;

  if (!myClass) {
    return (
      <AppShell allow={["teacher"]}>
        <PageHeader title="My Class" subtitle="Class Teacher workspace" />
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <GraduationCap className="h-10 w-10" />
          <div className="text-sm">You are not currently assigned as a Class Teacher for any stream.</div>
          <div className="text-xs">Your Principal or Deputy can assign you from the Student Directory & Streams pane.</div>
        </CardContent></Card>
      </AppShell>
    );
  }

  const streamRoster = students.filter((s) => s.streamId === myClass.id && s.status === "active");
  const existingSubmission = rosters.find((r) => r.streamId === myClass.id && (r.status === "pending" || r.status === "draft"));

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader
        title={`My Class · ${myClass.grade} ${myClass.name}`}
        subtitle={`You are the Class Teacher for this ${myClass.system} stream.`}
        action={<Badge className="bg-emerald-500/15 text-emerald-700">{streamRoster.length} approved learners</Badge>}
      />

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Approved Roster</TabsTrigger>
          <TabsTrigger value="organize">Organize Class Roster</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-4">
          <Card className="border-border/70"><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-5 py-2">Admission</th><th className="px-5 py-2">Name</th><th className="px-5 py-2">Gender</th><th className="px-5 py-2">YOB</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {streamRoster.map((s) => (
                  <tr key={s.id}><td className="px-5 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td><td className="px-5 py-2 font-medium">{s.name}</td><td className="px-5 py-2">{s.gender}</td><td className="px-5 py-2">{s.yearOfBirth}</td></tr>
                ))}
                {!streamRoster.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No approved learners yet — build the roster on the next tab.</td></tr>}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="organize" className="mt-4">
          <OrganizeRoster
            myClass={myClass}
            existingSubmission={existingSubmission}
            onSubmit={(picked, newOnes) => {
              const submission: RosterSubmission = {
                id: `roster-${Date.now()}`,
                schoolId: myClass.schoolId,
                streamId: myClass.id,
                teacherId: user.id,
                teacherName: user.name,
                studentIds: picked,
                newStudents: newOnes,
                status: "pending",
                submittedAt: new Date().toISOString().slice(0, 10),
              };
              setRosters([...rosters.filter((r) => !(r.streamId === myClass.id && r.status === "draft")), submission]);
              // Mark pool students as pending
              setStudents(students.map((s) => picked.includes(s.id) ? { ...s, status: "pending-approval" } : s));
              toast.success("Roster submitted for admin approval.");
            }}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function OrganizeRoster({ myClass, existingSubmission, onSubmit }: {
  myClass: { id: string; schoolId: string; grade: string; name: string };
  existingSubmission?: RosterSubmission;
  onSubmit: (picked: string[], newOnes: RosterSubmission["newStudents"]) => void;
}) {
  const [students] = useStudents();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [newOnes, setNewOnes] = useState<RosterSubmission["newStudents"]>([]);
  const [nName, setNName] = useState("");
  const [nAdm, setNAdm] = useState("");
  const [nGender, setNGender] = useState<"M" | "F">("M");
  const [nYob, setNYob] = useState<number>(2009);

  const pool = useMemo(() =>
    students.filter((s) => s.schoolId === myClass.schoolId && !s.streamId && s.status === "active")
      .filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.admissionNo.includes(q))
  , [students, myClass.schoolId, q]);

  const locked = existingSubmission?.status === "pending";

  if (locked) {
    return (
      <Card className="border-amber-300/60 bg-amber-50/40"><CardContent className="flex items-start gap-3 p-6">
        <Lock className="mt-0.5 h-5 w-5 text-amber-600" />
        <div>
          <div className="flex items-center gap-2">
            <div className="font-semibold">Pending Approval</div>
            <Badge className="bg-amber-500/15 text-amber-700">Pending Approval</Badge>
          </div>
          <div className="text-sm text-muted-foreground">You submitted {existingSubmission.studentIds.length} pool learner(s) and {existingSubmission.newStudents.length} new registration(s) on {existingSubmission.submittedAt}. The Principal or Deputy will review shortly.</div>
        </div>
      </CardContent></Card>
    );
  }

  function addNew() {
    if (!nName || !nAdm) { toast.error("Name and admission number are required."); return; }
    setNewOnes([...newOnes, { name: nName, admissionNo: nAdm, gender: nGender, yearOfBirth: nYob }]);
    setNName(""); setNAdm("");
  }

  function submit() {
    if (!picked.size && !newOnes.length) { toast.error("Add at least one learner before submitting."); return; }
    onSubmit(Array.from(picked), newOnes);
    setPicked(new Set()); setNewOnes([]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/70"><CardContent className="p-4">
        <div className="mb-3 text-sm font-semibold">1. Pull from master pool</div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pool…" className="pl-9" />
        </div>
        <div className="max-h-96 overflow-y-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {pool.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/40">
                  <td className="w-8 px-3 py-2"><Checkbox checked={picked.has(s.id)} onCheckedChange={(v) => { const n = new Set(picked); if (v) n.add(s.id); else n.delete(s.id); setPicked(n); }} /></td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.gender} · {s.yearOfBirth}</td>
                </tr>
              ))}
              {!pool.length && <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">Pool is empty. Ask admin to import the school roster.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{picked.size} selected</div>
      </CardContent></Card>

      <Card className="border-border/70"><CardContent className="p-4">
        <div className="mb-3 text-sm font-semibold">2. Manual quick-add (new registration)</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2"><Label>Full name</Label><Input value={nName} onChange={(e) => setNName(e.target.value)} /></div>
          <div><Label>Admission #</Label><Input value={nAdm} onChange={(e) => setNAdm(e.target.value)} /></div>
          <div><Label>Year of Birth</Label><Input type="number" value={nYob} onChange={(e) => setNYob(parseInt(e.target.value) || 2009)} /></div>
          <div><Label>Gender</Label>
            <Select value={nGender} onValueChange={(v) => setNGender(v as "M" | "F")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex items-end"><Button variant="outline" onClick={addNew} className="w-full"><Plus className="mr-1 h-4 w-4" />Add</Button></div>
        </div>
        <div className="mt-4 max-h-60 overflow-y-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {newOnes.map((n, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{n.admissionNo}</td>
                  <td className="px-3 py-2">{n.name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{n.gender} · {n.yearOfBirth}</td>
                  <td className="w-8 px-3 py-2"><Button size="sm" variant="ghost" onClick={() => setNewOnes(newOnes.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
              {!newOnes.length && <tr><td className="px-3 py-8 text-center text-xs text-muted-foreground">No new registrations queued.</td></tr>}
            </tbody>
          </table>
        </div>
        <Button onClick={submit} className="mt-4 w-full" size="lg"><Send className="mr-2 h-4 w-4" />Submit Roster for Approval</Button>
      </CardContent></Card>
    </div>
  );
}
