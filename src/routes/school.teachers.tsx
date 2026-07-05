import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeachers, type TeacherRow } from "@/lib/teacher-store";
import { useSubjects } from "@/lib/subject-store";
import { streams } from "@/lib/mock-data";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import { toast } from "sonner";
import { Send, CheckCircle2, Mail, Loader2 } from "lucide-react";

export const Route = createFileRoute("/school/teachers")({
  head: () => ({ meta: [{ title: "Teacher Management — Master CBC" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [teachers, setTeachers] = useTeachers();
  const [subjects] = useSubjects();
  const schoolStreams = streams.filter((s) => s.schoolId === schoolId);
  const schoolSubjects = subjects.filter((s) => s.schoolId === schoolId && s.approved);
  const rows = teachers.filter((t) => t.schoolId === schoolId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [streamId, setStreamId] = useState<string>("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const grades = Array.from(new Set(schoolStreams.map((s) => s.grade)));
  const gradeStreams = schoolStreams.filter((s) => s.grade === grade);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !streamId || subjectIds.length === 0) {
      return toast.error("Fill name, email, stream and at least one subject");
    }
    setSending(true);
    const newRow: TeacherRow = {
      id: `u${Date.now()}`, schoolId, name: name.trim(), email: email.trim().toLowerCase(),
      title: "Teacher",
      assignedStreams: [streamId], assignedSubjects: subjectIds,
      status: "Pending Invite", invitedAt: new Date().toISOString(),
    };
    const next = [...teachers, newRow];
    setTeachers(next);
    toast.message("Provisioning Supabase Auth user…", { icon: <Loader2 className="h-4 w-4 animate-spin" /> });

    // Mock async pipeline: Supabase Auth user + Zoho SMTP invite
    await new Promise((r) => setTimeout(r, 900));
    toast.message("Dispatching Zoho Mail invite…", { icon: <Mail className="h-4 w-4" /> });
    await new Promise((r) => setTimeout(r, 1100));

    setTeachers(next.map((t) => t.id === newRow.id ? { ...t, status: "Active", activatedAt: new Date().toISOString() } : t));
    toast.success(`${newRow.name} onboarded and marked Active.`);
    setName(""); setEmail(""); setSubjectIds([]); setStreamId(""); setGrade("");
    setSending(false);
  }

  function toggleSubject(id: string) {
    setSubjectIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  function resend(id: string) {
    toast.success("Invite email re-sent via Zoho Mail SMTP");
    setTeachers(teachers.map((t) => t.id === id ? { ...t, invitedAt: new Date().toISOString() } : t));
  }

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader title="Teacher Management" subtitle="Onboard staff via Supabase Auth + Zoho Mail invites. Assign streams and subjects in one step." />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-border/70 xl:col-span-2"><CardContent className="p-5">
          <div className="text-sm font-semibold">Onboard a new teacher</div>
          <form onSubmit={invite} className="mt-4 space-y-3">
            <div className="grid gap-2"><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wycliffe Onyango" /></div>
            <div className="grid gap-2"><Label>Email Address</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@school.ac.ke" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>Class (Grade / Form)</Label>
                <Select value={grade} onValueChange={(v) => { setGrade(v); setStreamId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Pick class" /></SelectTrigger>
                  <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Stream</Label>
                <Select value={streamId} onValueChange={setStreamId} disabled={!grade}>
                  <SelectTrigger><SelectValue placeholder="Pick stream" /></SelectTrigger>
                  <SelectContent>{gradeStreams.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.system})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Assigned subjects</Label>
              <div className="flex flex-wrap gap-1.5 rounded-md border border-border p-2">
                {schoolSubjects.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${subjectIds.includes(s.id) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
                    {s.name}
                  </button>
                ))}
                {schoolSubjects.length === 0 && <span className="text-xs text-muted-foreground">No approved subjects yet.</span>}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Sending invite…</> : <><Send className="mr-1 h-4 w-4" />Onboard & Send Invite</>}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Creates a Supabase Auth user and dispatches a Zoho Mail SMTP verification email. The row flips to <strong>Active</strong> once accepted.
            </p>
          </form>
        </CardContent></Card>

        <Card className="border-border/70 xl:col-span-3"><CardContent className="p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Staff directory</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Streams</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((t) => {
                  const assigned = t.assignedStreams.map((id) => streams.find((s) => s.id === id)).filter(Boolean);
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.title}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{t.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {assigned.map((s) => <Badge key={s!.id} variant="outline" className="text-[10px]">{s!.grade} {s!.name}</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {t.status === "Active"
                          ? <Badge className="bg-emerald-600 text-white"><CheckCircle2 className="mr-1 h-3 w-3" />Active</Badge>
                          : t.status === "Pending Invite"
                            ? <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Pending Invite</Badge>
                            : <Badge variant="destructive">Suspended</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.status === "Pending Invite" && (
                          <Button size="sm" variant="ghost" onClick={() => resend(t.id)}><Mail className="mr-1 h-4 w-4" />Resend</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
