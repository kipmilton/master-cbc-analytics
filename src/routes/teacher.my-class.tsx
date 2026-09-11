import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useSchoolData } from "@/hooks/use-school-data";
import { submitRoster, type RosterSubmission, type Student } from "@/lib/school-data.functions";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Send, Trash2, Search, Plus, GraduationCap, Lock, Loader2, Printer } from "lucide-react";

export const Route = createFileRoute("/teacher/my-class")({
  head: () => ({
    meta: [
      { title: "My Class — Master CBC" },
      { name: "description", content: "Class teacher workspace: build your stream roster and send it for admin approval." },
      { property: "og:title", content: "My Class — Master CBC" },
      { property: "og:description", content: "Build your class roster and submit it for approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyClassPage,
});

type NewStudent = RosterSubmission["newStudents"][number];

function MyClassPage() {
  const user = useSession();
  const { streams, students, rosters, isLoading, refresh } = useSchoolData();

  const myClass = streams.find((s) => s.classTeacherId === user?.id);

  const submit = useMutation({
    mutationFn: (input: { streamId: string; studentIds: string[]; newStudents: NewStudent[] }) =>
      submitRoster({ data: { ...input, status: "pending" } }),
    onSuccess: () => { refresh(); toast.success("Roster submitted for admin approval."); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not submit the roster"),
  });

  if (!user) return null;

  if (!myClass) {
    return (
      <AppShell allow={["teacher"]}>
        <PageHeader title="My Class" subtitle="Class Teacher workspace" />
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <GraduationCap className="h-10 w-10" />
          <div className="text-sm">
            {isLoading ? "Loading your class…" : "You are not currently assigned as a Class Teacher for any stream."}
          </div>
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
        action={
          <div className="flex items-center gap-2">
            <Link to="/teacher/report-cards">
              <Button size="sm" className="bg-[#E8672E] hover:bg-[#C6511F] text-white">
                <Printer className="mr-1.5 h-4 w-4" /> Print Class Report Cards
              </Button>
            </Link>
            <Badge className="bg-emerald-500/15 text-emerald-700">{streamRoster.length} approved learners</Badge>
          </div>
        }
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
                  <tr key={s.id}>
                    <td className="px-5 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                    <td className="px-5 py-2 font-medium">{s.name}</td>
                    <td className="px-5 py-2">{s.gender}</td>
                    <td className="px-5 py-2">{s.yearOfBirth}</td>
                  </tr>
                ))}
                {!streamRoster.length && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No approved learners yet — build the roster on the next tab.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="organize" className="mt-4">
          <OrganizeRoster
            pool={students.filter((s) => !s.streamId && s.status === "active")}
            existingSubmission={existingSubmission}
            busy={submit.isPending}
            onSubmit={(picked, newOnes) => submit.mutate({ streamId: myClass.id, studentIds: picked, newStudents: newOnes })}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function OrganizeRoster({ pool, existingSubmission, busy, onSubmit }: {
  pool: Student[];
  existingSubmission?: RosterSubmission;
  busy: boolean;
  onSubmit: (picked: string[], newOnes: NewStudent[]) => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [newOnes, setNewOnes] = useState<NewStudent[]>([]);
  const [nName, setNName] = useState("");
  const [nAdm, setNAdm] = useState("");
  const [nGender, setNGender] = useState<"M" | "F">("M");
  const [nYob, setNYob] = useState<number>(2009);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return pool.filter((s) => !term || s.name.toLowerCase().includes(term) || s.admissionNo.toLowerCase().includes(term));
  }, [pool, q]);

  if (existingSubmission?.status === "pending") {
    return (
      <Card className="border-amber-300/60 bg-amber-50/40"><CardContent className="flex items-start gap-3 p-6">
        <Lock className="mt-0.5 h-5 w-5 text-amber-600" />
        <div>
          <div className="flex items-center gap-2">
            <div className="font-semibold">Pending Approval</div>
            <Badge className="bg-amber-500/15 text-amber-700">Locked</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            You submitted {existingSubmission.studentIds.length} pool learner(s) and {existingSubmission.newStudents.length} new
            registration(s){existingSubmission.submittedAt ? ` on ${existingSubmission.submittedAt.slice(0, 10)}` : ""}. The Principal or Deputy will review shortly.
          </div>
        </div>
      </CardContent></Card>
    );
  }

  function addNew() {
    if (!nName.trim() || !nAdm.trim()) { toast.error("Name and admission number are required."); return; }
    setNewOnes([...newOnes, { name: nName.trim(), admissionNo: nAdm.trim(), gender: nGender, yearOfBirth: nYob }]);
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
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/40">
                  <td className="w-8 px-3 py-2">
                    <Checkbox
                      checked={picked.has(s.id)}
                      onCheckedChange={(v) => {
                        const n = new Set(picked);
                        if (v) n.add(s.id); else n.delete(s.id);
                        setPicked(n);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.gender} · {s.yearOfBirth}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-xs text-muted-foreground">The unassigned pool is empty.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Card className="border-border/70"><CardContent className="p-4">
        <div className="mb-3 text-sm font-semibold">2. Register brand-new learners</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label className="text-xs">Full name</Label>
            <Input value={nName} onChange={(e) => setNName(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Admission no.</Label>
            <Input value={nAdm} onChange={(e) => setNAdm(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Gender</Label>
            <Select value={nGender} onValueChange={(v) => setNGender(v as "M" | "F")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Year of birth</Label>
            <Input type="number" value={nYob} onChange={(e) => setNYob(Number(e.target.value) || 2009)} />
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={addNew}><Plus className="mr-1 h-4 w-4" />Add learner</Button>

        <div className="mt-4 space-y-1">
          {newOnes.map((n, i) => (
            <div key={`${n.admissionNo}-${i}`} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span>{n.name} <span className="text-xs text-muted-foreground">· {n.admissionNo}</span></span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNewOnes(newOnes.filter((_, x) => x !== i))}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-md bg-secondary/50 p-3">
          <div className="text-xs text-muted-foreground">
            {picked.size} pooled · {newOnes.length} new
          </div>
          <Button size="sm" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}Submit for approval
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Once submitted the roster locks until the Principal or a Deputy reviews it.
        </p>
      </CardContent></Card>
    </div>
  );
}
