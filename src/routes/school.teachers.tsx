import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { useSchoolData } from "@/hooks/use-school-data";
import {
  createSchoolStaff,
  listSchoolStaff,
  removeSchoolStaff,
  updateTeacherAssignments,
  type StaffRow,
} from "@/lib/staff.functions";
import { ASSIGNABLE_STAFF_ROLES, ROLE_TITLES, SCHOOL_ADMIN_ROLES, isSchoolAdminRole, roleLabel } from "@/lib/roles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Loader2, ShieldCheck, Trash2, UserCog, UserPlus } from "lucide-react";

export const Route = createFileRoute("/school/teachers")({
  head: () => ({
    meta: [
      { title: "Staff & Teachers — Master CBC" },
      { name: "description", content: "Create the four school admin seats and teacher accounts, and assign streams and subjects." },
      { property: "og:title", content: "Staff & Teachers — Master CBC" },
      { property: "og:description", content: "Provision admin seats and teacher accounts for your school." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffPage,
});

type AssignableRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

type StaffInput = NonNullable<Parameters<typeof createSchoolStaff>[0]>["data"];

const DEFAULT_PASSWORD = "Master@2026";

function StaffPage() {
  const user = useSession();
  const { streams, subjects } = useSchoolData();
  const approvedSubjects = subjects.filter((s) => s.approved);
  const qc = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ["schoolStaff", user?.schoolId ?? null],
    queryFn: () => listSchoolStaff(),
    enabled: !!user?.schoolId,
  });
  const staff = staffQuery.data ?? [];
  const admins = staff.filter((s) => isSchoolAdminRole(s.role));
  const teachers = staff.filter((s) => s.role === "teacher");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["schoolStaff"] });

  const [role, setRole] = useState<AssignableRole>("teacher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [streamIds, setStreamIds] = useState<string[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ email: string; password: string } | null>(null);

  const seatTaken = (r: string) => admins.some((a) => a.role === r);

  const create = useMutation({
    mutationFn: (input: StaffInput) => createSchoolStaff({ data: input }),
    onSuccess: (_r: unknown, v: StaffInput) => {
      invalidate();
      setSummary({ email: v.email, password: v.tempPassword });
      toast.success(`${v.name} can now sign in and will be asked to set a new password.`);
      setName(""); setEmail(""); setPassword(DEFAULT_PASSWORD); setStreamIds([]); setSubjectIds([]);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not create the account"),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeSchoolStaff({ data: { userId } }),
    onSuccess: () => { invalidate(); toast.success("Staff member removed from this school."); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not remove that account"),
  });

  const assign = useMutation({
    mutationFn: (input: { teacherId: string; streamIds: string[]; subjectIds: string[] }) =>
      updateTeacherAssignments({ data: input }),
    onSuccess: () => { invalidate(); setEditing(null); toast.success("Assignments updated."); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not update assignments"),
  });

  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [editStreams, setEditStreams] = useState<string[]>([]);
  const [editSubjects, setEditSubjects] = useState<string[]>([]);

  function openEditor(row: StaffRow) {
    setEditing(row);
    setEditStreams(row.streamIds);
    setEditSubjects(row.subjectIds);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return toast.error("Enter both a name and an email address");
    if (password.trim().length < 8) return toast.error("The temporary password must be at least 8 characters");
    if (role !== "teacher" && seatTaken(role)) return toast.error("That admin seat is already filled");
    create.mutate({
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      title: ROLE_TITLES[role],
      tempPassword: password.trim(),
      streamIds: role === "teacher" ? streamIds : [],
      subjectIds: role === "teacher" ? subjectIds : [],
    });
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard access is unavailable in this browser");
    }
  }

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const streamLabel = (id: string) => {
    const s = streams.find((x) => x.id === id);
    return s ? `${s.grade} ${s.name}` : "—";
  };

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Staff & Teachers"
        subtitle="Four admin seats per school — Principal, both Deputies and the Dean — plus every teacher account."
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-border/70 xl:col-span-2"><CardContent className="p-5">
          <div className="text-sm font-semibold">Create a staff account</div>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AssignableRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r} disabled={r !== "teacher" && seatTaken(r)}>
                      {ROLE_TITLES[r]}{r !== "teacher" && seatTaken(r) ? " · seat filled" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Wanjiru" />
            </div>
            <div className="grid gap-2">
              <Label>Work email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.ac.ke" />
            </div>
            <div className="grid gap-2">
              <Label>Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword((p) => !p)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                They will be forced to set their own password on first sign-in.
              </p>
            </div>

            {role === "teacher" && (
              <>
                <div className="grid gap-2">
                  <Label>Streams</Label>
                  <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                    {streams.length === 0 && <div className="text-xs text-muted-foreground">Create streams first.</div>}
                    {streams.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={streamIds.includes(s.id)} onCheckedChange={() => toggle(streamIds, setStreamIds, s.id)} />
                        {s.grade} {s.name} <span className="text-xs text-muted-foreground">({s.system})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Subjects</Label>
                  <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                    {approvedSubjects.length === 0 && <div className="text-xs text-muted-foreground">Approve subjects first.</div>}
                    {approvedSubjects.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={subjectIds.includes(s.id)} onCheckedChange={() => toggle(subjectIds, setSubjectIds, s.id)} />
                        {s.name} <span className="text-xs text-muted-foreground">({s.system})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
              Create account
            </Button>
          </form>

          {summary && (
            <div className="mt-4 rounded-md border border-emerald-300/60 bg-emerald-50/40 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />Credentials ready
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono">{summary.email}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyText(summary.email)}><Copy className="h-3 w-3" /></Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{summary.password}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyText(summary.password)}><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          )}
        </CardContent></Card>

        <div className="space-y-6 xl:col-span-3">
          <Card className="border-border/70"><CardContent className="p-5">
            <div className="text-sm font-semibold">Admin seats</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SCHOOL_ADMIN_ROLES.map((r) => {
                const holder = admins.find((a) => a.role === r);
                return (
                  <div key={r} className="rounded-md border border-border p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{ROLE_TITLES[r]}</div>
                    {holder ? (
                      <>
                        <div className="mt-1 font-medium">{holder.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{holder.email}</div>
                      </>
                    ) : (
                      <div className="mt-1 text-sm text-muted-foreground">Vacant</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent></Card>

          <Card className="border-border/70"><CardContent className="p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-semibold">
              Teachers ({teachers.length})
            </div>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Assignments</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffQuery.isLoading && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">Loading staff…</td></tr>
                  )}
                  {!staffQuery.isLoading && teachers.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">No teacher accounts yet.</td></tr>
                  )}
                  {teachers.map((t) => (
                    <tr key={t.userId}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{t.streamIds.length ? t.streamIds.map(streamLabel).join(", ") : "No streams"}</div>
                        <div>{t.subjectIds.length} subject(s)</div>
                        {t.classTeacherStreamIds.length > 0 && (
                          <Badge variant="outline" className="mt-1">Class teacher · {t.classTeacherStreamIds.map(streamLabel).join(", ")}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {t.mustResetPassword
                          ? <Badge variant="secondary">Awaiting first sign-in</Badge>
                          : <Badge className="bg-emerald-600 text-white">Active</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditor(t)}><UserCog className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(t.userId)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
            <DialogDescription>{editing ? roleLabel(editing.role) : ""} — choose the streams and subjects they may enter marks for.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Streams</div>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {streams.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={editStreams.includes(s.id)} onCheckedChange={() => toggle(editStreams, setEditStreams, s.id)} />
                    {s.grade} {s.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subjects</div>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {approvedSubjects.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={editSubjects.includes(s.id)} onCheckedChange={() => toggle(editSubjects, setEditSubjects, s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              disabled={assign.isPending}
              onClick={() => editing && assign.mutate({ teacherId: editing.userId, streamIds: editStreams, subjectIds: editSubjects })}
            >
              {assign.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
