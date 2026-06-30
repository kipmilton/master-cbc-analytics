import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subjects as seed, type SystemType } from "@/lib/mock-data";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";

export const Route = createFileRoute("/school/subjects")({
  head: () => ({ meta: [{ title: "Subjects — Master CBC" }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const user = useSession();
  const schoolId = user?.schoolId ?? "s1";
  const [rows, setRows] = useState(seed.filter((s) => s.schoolId === schoolId));
  const [name, setName] = useState("");
  const [system, setSystem] = useState<SystemType>("CBC");

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setRows((r) => [...r, { id: `sub${Date.now()}`, schoolId, name: name.trim(), system, approved: false }]);
    setName("");
    toast.success("Subject submitted for Deputy Principal approval");
  }

  function approve(id: string) { setRows((r) => r.map((s) => s.id === id ? { ...s, approved: true } : s)); toast.success("Subject approved & live for teachers"); }
  function revoke(id: string) { setRows((r) => r.map((s) => s.id === id ? { ...s, approved: false } : s)); }

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader title="Subject Management" subtitle="Configure subjects & learning areas. Deputy Principal approves before teachers see them." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70"><CardContent className="p-5">
          <div className="text-sm font-semibold">Add a subject</div>
          <form onSubmit={add} className="mt-4 space-y-3">
            <div className="grid gap-2"><Label htmlFor="sname">Name</Label><Input id="sname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pre-Technical Studies" /></div>
            <div className="grid gap-2">
              <Label>System</Label>
              <Select value={system} onValueChange={(v) => setSystem(v as SystemType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBC">CBC (rubric)</SelectItem>
                  <SelectItem value="8-4-4">8-4-4 (percentage)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full"><Plus className="mr-1 h-4 w-4" />Submit</Button>
          </form>
        </CardContent></Card>

        <Card className="border-border/70 lg:col-span-2"><CardContent className="p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Configured subjects</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-5 py-3">Subject</th><th className="px-5 py-3">System</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-medium">{s.name}</td>
                    <td className="px-5 py-3"><Badge variant="outline">{s.system}</Badge></td>
                    <td className="px-5 py-3"><Badge variant={s.approved ? "default" : "secondary"}>{s.approved ? "Approved" : "Pending"}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      {s.approved
                        ? <Button size="sm" variant="ghost" onClick={() => revoke(s.id)}><X className="mr-1 h-4 w-4" />Revoke</Button>
                        : <Button size="sm" onClick={() => approve(s.id)}><Check className="mr-1 h-4 w-4" />Approve</Button>}
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
