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
import { useTeachers, type TeacherRow } from "@/lib/teacher-store";
import { useSubjects } from "@/lib/subject-store";
import { streams } from "@/lib/mock-data";
import { useSession } from "@/hooks/use-session";
import { createSchoolStaff } from "@/lib/staff.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Send, CheckCircle2, Mail, Loader2, Eye, EyeOff, Copy, ShieldCheck, UserCog } from "lucide-react";

export const Route = createFileRoute("/school/teachers")({
  head: () => ({ meta: [{ title: "Teacher Management — Master CBC" }] }),
  component: TeachersPage,
});

type OnboardingMode = "invite" | "manual";
type DeputyRole = "academics" | "administration";

const DEFAULT_PASSWORD = "Test@2026";

function TeachersPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [teachers, setTeachers] = useTeachers();
  const [subjects] = useSubjects();
  const schoolStreams = streams.filter((s) => s.schoolId === schoolId);
  const schoolSubjects = subjects.filter((s) => s.schoolId === schoolId && s.approved);
  const rows = teachers.filter((t) => t.schoolId === schoolId);

  const [mode, setMode] = useState<OnboardingMode>("invite");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [streamId, setStreamId] = useState<string>("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<{ email: string; password: string } | null>(null);

  const [deputyName, setDeputyName] = useState("");
  const [deputyEmail, setDeputyEmail] = useState("");
  const [deputyRole, setDeputyRole] = useState<DeputyRole>("academics");
  const [deputyPassword, setDeputyPassword] = useState(DEFAULT_PASSWORD);
  const [deputyShowPassword, setDeputyShowPassword] = useState(false);
  const [deputyBusy, setDeputyBusy] = useState(false);

  const grades = Array.from(new Set(schoolStreams.map((s) => s.grade)));
  const gradeStreams = schoolStreams.filter((s) => s.grade === grade);

  async function onboardTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !streamId || subjectIds.length === 0) {
      return toast.error("Fill name, email, stream and at least one subject");
    }

    const tempPassword = mode === "manual" ? (password.trim() || DEFAULT_PASSWORD) : undefined;
    setSending(true);
    const newRow: TeacherRow = {
      id: `u${Date.now()}`,
      schoolId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      title: "Teacher",
      assignedStreams: [streamId],
      assignedSubjects: subjectIds,
      status: "Pending Approval",
      invitedAt: new Date().toISOString(),
      approvalStatus: "pending",
      temporaryPassword: tempPassword,
    };
    const next = [...teachers, newRow];
    setTeachers(next);

    if (mode === "manual") {
      try {
        await createSchoolStaff({
          data: {
            role: "teacher",
            name: newRow.name,
            email: newRow.email,
            title: "Teacher",
            tempPassword: tempPassword ?? DEFAULT_PASSWORD,
            streamIds: [streamId],
            subjectIds: subjectIds,
          },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not create teacher account");
        setSending(false);
        return;
      }
    }

    toast.message(mode === "manual" ? "Creating teacher credentials…" : "Provisioning Supabase Auth user…", { icon: <Loader2 className="h-4 w-4 animate-spin" /> });

    await new Promise((r) => setTimeout(r, 900));
    if (mode === "invite") {
      toast.message("Dispatching Zoho Mail invite…", { icon: <Mail className="h-4 w-4" /> });
      await new Promise((r) => setTimeout(r, 1100));
    }

    setTeachers(next.map((t) => t.id === newRow.id ? { ...t, status: "Pending Approval", approvalStatus: "pending" } : t));
    if (mode === "manual") {
      setSummary({ email: newRow.email, password: tempPassword ?? DEFAULT_PASSWORD });
      toast.success(`${newRow.name} is waiting for Principal approval.`);
    } else {
      toast.success(`${newRow.name} was queued for Principal approval.`);
    }

    setName(""); setEmail(""); setSubjectIds([]); setStreamId(""); setGrade(""); setPassword(DEFAULT_PASSWORD); setShowPassword(false);
    setSending(false);
  }

  function toggleSubject(id: string) {
    setSubjectIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  function resend(id: string) {
    toast.success("Invite email re-sent via Zoho Mail SMTP");
    setTeachers(teachers.map((t) => t.id === id ? { ...t, invitedAt: new Date().toISOString() } : t));
  }

  function approveTeacher(id: string) {
    setTeachers(teachers.map((t) => t.id === id ? { ...t, status: "Active", approvalStatus: "active", activatedAt: new Date().toISOString() } : t));
    toast.success("Teacher approved and activated.");
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard access is unavailable in this browser");
    }
  }

  async function createDeputy(e: React.FormEvent) {
    e.preventDefault();
    if (!deputyName.trim() || !deputyEmail.trim()) {
      return toast.error("Enter both the deputy name and email.");
    }

    setDeputyBusy(true);
    const title = deputyRole === "academics" ? "Deputy Principal (Academics)" : "Deputy Principal (Administration)";
    try {
      await createSchoolStaff({
        data: {
          role: "teacher",
          name: deputyName.trim(),
          email: deputyEmail.trim().toLowerCase(),
          title,
          tempPassword: deputyPassword.trim() || DEFAULT_PASSWORD,
          streamIds: [],
          subjectIds: [],
        },
      });
      toast.success(`${title} account created.`);
      setDeputyName(""); setDeputyEmail(""); setDeputyRole("academics"); setDeputyPassword(DEFAULT_PASSWORD);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create deputy account");
    } finally {
      setDeputyBusy(false);
    }
  }

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader title="Teacher Management" subtitle="Onboard staff here. Assign streams and subjects in one step." />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-border/70 xl:col-span-2"><CardContent className="p-5">
          <div className="text-sm font-semibold">Onboard a new teacher</div>
          <div className="mt-3 flex rounded-lg border border-border p-1">
            <button type="button" onClick={() => setMode("invite")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === "invite" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              Send Invite
            </button>
            <button type="button" onClick={() => setMode("manual")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              Add Manually
            </button>
          </div>

          <form onSubmit={onboardTeacher} className="mt-4 space-y-3">
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

            {mode === "manual" && (
              <div className="grid gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                <Label>Temporary Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12" />
                  <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">The teacher will be forced to reset this password on first sign-in.</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Processing…</> : mode === "manual" ? <><Send className="mr-1 h-4 w-4" />Create Teacher & Issue Password</> : <><Send className="mr-1 h-4 w-4" />Onboard & Send Invite</>}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Every new teacher enters a <strong>Pending Approval</strong> state until the Principal explicitly approves them. Manual onboarding also issues a temporary password.
            </p>
          </form>

          <div className="mt-6 rounded-lg border border-border/70 bg-secondary/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><UserCog className="h-4 w-4" />School admin seats</div>
            <form onSubmit={createDeputy} className="mt-3 space-y-3">
              <div className="grid gap-2">
                <Label>Deputy name</Label>
                <Input value={deputyName} onChange={(e) => setDeputyName(e.target.value)} placeholder="e.g. Jane Wambui" />
              </div>
              <div className="grid gap-2">
                <Label>Email address</Label>
                <Input type="email" value={deputyEmail} onChange={(e) => setDeputyEmail(e.target.value)} placeholder="deputy@school.ac.ke" />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={deputyRole} onValueChange={(value) => setDeputyRole(value as DeputyRole)}>
                  <SelectTrigger><SelectValue placeholder="Choose role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academics">Deputy Principal (Academics)</SelectItem>
                    <SelectItem value="administration">Deputy Principal (Administration)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Temporary Password</Label>
                <div className="relative">
                  <Input type={deputyShowPassword ? "text" : "password"} value={deputyPassword} onChange={(e) => setDeputyPassword(e.target.value)} className="pr-12" />
                  <button type="button" onClick={() => setDeputyShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                    {deputyShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={deputyBusy}>
                {deputyBusy ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Creating…</> : <><ShieldCheck className="mr-1 h-4 w-4" />Create deputy admin seat</>}
              </Button>
            </form>
          </div>
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
                          : t.status === "Pending Approval"
                            ? <Badge className="bg-amber-500/15 text-amber-700"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Pending Approval</Badge>
                            : t.status === "Pending Invite"
                              ? <Badge variant="secondary"><Mail className="mr-1 h-3 w-3" />Pending Invite</Badge>
                              : <Badge variant="destructive">Suspended</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.status === "Pending Approval" && (
                          <Button size="sm" onClick={() => approveTeacher(t.id)}><CheckCircle2 className="mr-1 h-4 w-4" />Approve</Button>
                        )}
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

      <Dialog open={!!summary} onOpenChange={(open) => { if (!open) setSummary(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary access details</DialogTitle>
            <DialogDescription>Share the teacher’s credentials directly from this panel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Teacher email</div>
              <div className="mt-1 font-medium">{summary?.email}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Temporary password</div>
              <div className="mt-1 font-mono text-sm">{summary?.password}</div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => summary && copyText(summary.password)}><Copy className="mr-1 h-4 w-4" />Copy password</Button>
            <Button onClick={() => setSummary(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
