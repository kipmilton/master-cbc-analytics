import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGradingConfig, DEFAULT_CBC4, DEFAULT_CBC8, validateBands,
  type EightBand, type CBCBand, type MeanRule, type CBCRollup,
} from "@/lib/grading-store";
import { RotateCcw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/school/grading")({
  head: () => ({ meta: [{ title: "Grading Configuration — Master CBC" }] }),
  component: GradingPage,
});

function GradingPage() {
  const [cfg, setCfg] = useGradingConfig();
  const [eight, setEight] = useState<EightBand[]>(cfg.eight);
  const [cbc4, setCbc4] = useState<CBCBand[]>(cfg.cbc4);
  const [cbc8, setCbc8] = useState<CBCBand[]>(cfg.cbc8);
  const [split, setSplit] = useState(cfg.splitCBC);
  const [meanRule, setMeanRule] = useState<MeanRule>(cfg.meanRule);
  const [bestN, setBestN] = useState(cfg.bestN);
  const [rollup, setRollup] = useState<CBCRollup>(cfg.cbcRollup);
  const [internal, setInternal] = useState(cfg.cbcInternalAnalytics);

  const eightErr = validateBands(eight);
  const cbcErr = validateBands(split ? cbc8 : cbc4);

  function save() {
    if (eightErr) return toast.error(`8-4-4 bands: ${eightErr}`);
    if (cbcErr) return toast.error(`CBC bands: ${cbcErr}`);
    setCfg({ ...cfg, eight, cbc4, cbc8, splitCBC: split, meanRule, bestN, cbcRollup: rollup, cbcInternalAnalytics: internal });
    toast.success("Grading configuration saved. Teachers will see the new rules instantly.");
  }

  function resetAll() {
    setEight(cfg.eight); setCbc4(cfg.cbc4); setCbc8(cfg.cbc8); setSplit(cfg.splitCBC);
    setMeanRule(cfg.meanRule); setBestN(cfg.bestN); setRollup(cfg.cbcRollup); setInternal(cfg.cbcInternalAnalytics);
  }

  return (
    <AppShell allow={["school_admin"]}>
      <PageHeader
        title="Grading Configuration"
        subtitle="Adjust mark bands, points and rollup rules. Applied live across every teacher spreadsheet."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={resetAll}><RotateCcw className="mr-1 h-4 w-4" />Revert</Button>
            <Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" />Save configuration</Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 8-4-4 table */}
        <Card className="border-border/70"><CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">8-4-4 grading bands</div>
              <p className="text-xs text-muted-foreground">Percentage → letter grade → points</p>
            </div>
            {eightErr ? <Badge variant="destructive">{eightErr}</Badge> : <Badge className="bg-emerald-600">Valid</Badge>}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="py-2">Grade</th><th className="py-2">Min %</th><th className="py-2">Max %</th><th className="py-2">Points</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eight.map((b, i) => (
                  <tr key={i}>
                    <td className="py-2"><Input value={b.grade} onChange={(e) => setEight(p => p.map((x, j) => j === i ? { ...x, grade: e.target.value } : x))} className="h-8 w-20" /></td>
                    <td className="py-2"><Input type="number" value={b.min} onChange={(e) => setEight(p => p.map((x, j) => j === i ? { ...x, min: Number(e.target.value) } : x))} className="h-8 w-24" /></td>
                    <td className="py-2"><Input type="number" value={b.max} onChange={(e) => setEight(p => p.map((x, j) => j === i ? { ...x, max: Number(e.target.value) } : x))} className="h-8 w-24" /></td>
                    <td className="py-2"><Input type="number" value={b.points} onChange={(e) => setEight(p => p.map((x, j) => j === i ? { ...x, points: Number(e.target.value) } : x))} className="h-8 w-24" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-md border border-border p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class mean rule</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <Select value={meanRule} onValueChange={(v) => setMeanRule(v as MeanRule)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple Average</SelectItem>
                  <SelectItem value="best-n">Best-N Subjects</SelectItem>
                  <SelectItem value="groups">Custom Subject Groups</SelectItem>
                </SelectContent>
              </Select>
              {meanRule === "best-n" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">N =</Label>
                  <Input type="number" value={bestN} onChange={(e) => setBestN(Number(e.target.value))} className="h-9 w-24" />
                </div>
              )}
            </div>
          </div>
        </CardContent></Card>

        {/* CBC bands */}
        <Card className="border-border/70"><CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">CBC performance bands</div>
              <p className="text-xs text-muted-foreground">Standard 4 bands, or split into 8 sub-levels.</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="split" className="text-xs">Split into 8 sub-levels</Label>
              <Switch id="split" checked={split} onCheckedChange={setSplit} />
            </div>
          </div>
          <div className="mt-1 mb-2">{cbcErr ? <Badge variant="destructive">{cbcErr}</Badge> : <Badge className="bg-emerald-600">Valid</Badge>}</div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="py-2">Code</th><th className="py-2">Label</th><th className="py-2">Min %</th><th className="py-2">Max %</th><th className="py-2">Points</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(split ? cbc8 : cbc4).map((b, i) => (
                  <tr key={i}>
                    <td className="py-2"><Input value={b.code} onChange={(e) => (split ? setCbc8 : setCbc4)(p => p.map((x, j) => j === i ? { ...x, code: e.target.value } : x))} className="h-8 w-20" /></td>
                    <td className="py-2"><Input value={b.label} onChange={(e) => (split ? setCbc8 : setCbc4)(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="h-8 min-w-[180px]" /></td>
                    <td className="py-2"><Input type="number" value={b.min} onChange={(e) => (split ? setCbc8 : setCbc4)(p => p.map((x, j) => j === i ? { ...x, min: Number(e.target.value) } : x))} className="h-8 w-20" /></td>
                    <td className="py-2"><Input type="number" value={b.max} onChange={(e) => (split ? setCbc8 : setCbc4)(p => p.map((x, j) => j === i ? { ...x, max: Number(e.target.value) } : x))} className="h-8 w-20" /></td>
                    <td className="py-2"><Input type="number" value={b.points} onChange={(e) => (split ? setCbc8 : setCbc4)(p => p.map((x, j) => j === i ? { ...x, points: Number(e.target.value) } : x))} className="h-8 w-20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => split ? setCbc8(DEFAULT_CBC8) : setCbc4(DEFAULT_CBC4)}>Reset defaults</Button>
          </div>

          <div className="mt-5 rounded-md border border-border p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CBC report-card rollup</div>
            <Select value={rollup} onValueChange={(v) => setRollup(v as CBCRollup)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="common-band">Most common band across strands</SelectItem>
                <SelectItem value="teacher-rating">Teacher-assigned overall rating</SelectItem>
                <SelectItem value="average">Average-based rollup</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4 flex items-start gap-3 rounded-md bg-secondary/40 p-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[color:var(--brand-blue)]" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="internal" className="text-sm font-medium">Internal Analytics Toggle</Label>
                  <Switch id="internal" checked={internal} onCheckedChange={setInternal} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cross-subject CBC averages and rankings default to OFF (KICD-aligned). When ON, they appear only inside internal admin analytics — never on learner report cards.
                </p>
              </div>
            </div>
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
