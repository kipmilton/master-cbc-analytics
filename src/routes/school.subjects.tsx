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
import { useSubjects, type SubjectExt, type CBCLevel, type Pathway } from "@/lib/subject-store";
import { useGradingConfig } from "@/lib/grading-store";
import type { SystemType } from "@/lib/mock-data";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Check, X, Trash2 } from "lucide-react";

export const Route = createFileRoute("/school/subjects")({
  head: () => ({ meta: [{ title: "Subjects — Master CBC" }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [all, setAll] = useSubjects();
  const [cfg, setCfg] = useGradingConfig();
  const rows = all.filter((s) => s.schoolId === schoolId);

  const [name, setName] = useState("");
  const [system, setSystem] = useState<SystemType>("CBC");
  const [cbcLevel, setCbcLevel] = useState<CBCLevel>("Senior Secondary");
  const [pathway, setPathway] = useState<Pathway>("STEM");
  const [core, setCore] = useState(false);
  const [bundleId, setBundleId] = useState<string>("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const row: SubjectExt = {
      id: `sub${Date.now()}`, schoolId, name: name.trim(), system, approved: false,
      cbcLevel: system === "CBC" ? cbcLevel : undefined,
      pathway: system === "CBC" && cbcLevel === "Senior Secondary" ? pathway : undefined,
      core: system === "CBC" && cbcLevel === "Senior Secondary" ? core : undefined,
      bundleId: bundleId || undefined,
    };
    setAll([...all, row]);
    setName("");
    toast.success("Subject submitted for Deputy Principal approval");
  }

  function patch(id: string, p: Partial<SubjectExt>) { setAll(all.map((s) => s.id === id ? { ...s, ...p } : s)); }
  function remove(id: string) { setAll(all.filter((s) => s.id !== id)); toast.success("Subject removed"); }

  // Bundles
  const [bundleName, setBundleName] = useState("");
  function addBundle() {
    if (!bundleName.trim()) return;
    setCfg({ ...cfg, bundles: [...cfg.bundles, { id: `b${Date.now()}`, name: bundleName.trim(), subjectIds: [] }] });
    setBundleName("");
  }
  function removeBundle(id: string) {
    setCfg({ ...cfg, bundles: cfg.bundles.filter((b) => b.id !== id) });
    setAll(all.map((s) => s.bundleId === id ? { ...s, bundleId: undefined } : s));
  }

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader title="Subject & Pathway Setup" subtitle="Configure subjects, CBC pathways and custom bundles. Approvals unlock teacher access." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">Add a subject</div>
          <form onSubmit={add} className="mt-4 space-y-3">
            <div className="grid gap-2"><Label htmlFor="sname">Name</Label><Input id="sname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Advanced Mathematics" /></div>
            <div className="grid gap-2">
              <Label>Curriculum</Label>
              <Select value={system} onValueChange={(v) => setSystem(v as SystemType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBC">CBC</SelectItem>
                  <SelectItem value="8-4-4">8-4-4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {system === "CBC" && (
              <div className="grid gap-2">
                <Label>Level</Label>
                <Select value={cbcLevel} onValueChange={(v) => setCbcLevel(v as CBCLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior Secondary">Junior Secondary (Grade 7-9)</SelectItem>
                    <SelectItem value="Senior Secondary">Senior Secondary (Grade 10-12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {system === "CBC" && cbcLevel === "Senior Secondary" && (
              <>
                <div className="grid gap-2">
                  <Label>Pathway</Label>
                  <Select value={pathway} onValueChange={(v) => setPathway(v as Pathway)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STEM">STEM</SelectItem>
                      <SelectItem value="Social Sciences">Social Sciences</SelectItem>
                      <SelectItem value="Arts & Sports Science">Arts & Sports Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={core} onCheckedChange={(v) => setCore(!!v)} />
                  Core subject (taken across all pathways)
                </label>
              </>
            )}
            <div className="grid gap-2">
              <Label>Bundle (optional)</Label>
              <Select value={bundleId || "__none"} onValueChange={(v) => setBundleId(v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="No bundle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No bundle</SelectItem>
                  {cfg.bundles.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full"><Plus className="mr-1 h-4 w-4" />Submit</Button>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <div className="text-sm font-semibold">Subject bundles</div>
            <p className="text-xs text-muted-foreground">Group subjects for custom mean calculations.</p>
            <div className="mt-3 flex gap-2">
              <Input value={bundleName} onChange={(e) => setBundleName(e.target.value)} placeholder="e.g. Sciences" className="h-9" />
              <Button size="sm" onClick={addBundle}><Plus className="h-4 w-4" /></Button>
            </div>
            <ul className="mt-3 space-y-1">
              {cfg.bundles.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-1.5 text-sm">
                  <span>{b.name} <span className="text-xs text-muted-foreground">({rows.filter(r => r.bundleId === b.id).length})</span></span>
                  <Button size="icon" variant="ghost" onClick={() => removeBundle(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent></Card>

        <Card className="border-border/70 lg:col-span-2"><CardContent className="p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Configured subjects</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Curriculum</th>
                  <th className="px-4 py-3">Level / Pathway</th>
                  <th className="px-4 py-3">Bundle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{s.system}</Badge></td>
                    <td className="px-4 py-3 text-xs">
                      {s.system === "CBC" ? (
                        <div className="flex flex-col gap-0.5">
                          <span>{s.cbcLevel}</span>
                          {s.cbcLevel === "Senior Secondary" && (
                            <span className="text-muted-foreground">
                              {s.pathway} · {s.core ? "Core" : "Elective"}
                            </span>
                          )}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <Select value={s.bundleId ?? "__none"} onValueChange={(v) => patch(s.id, { bundleId: v === "__none" ? undefined : v })}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">—</SelectItem>
                          {cfg.bundles.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3"><Badge variant={s.approved ? "default" : "secondary"}>{s.approved ? "Approved" : "Pending"}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {s.approved
                          ? <Button size="sm" variant="ghost" onClick={() => patch(s.id, { approved: false })}><X className="mr-1 h-4 w-4" />Revoke</Button>
                          : <Button size="sm" onClick={() => patch(s.id, { approved: true })}><Check className="mr-1 h-4 w-4" />Approve</Button>}
                        <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
