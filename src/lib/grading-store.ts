import { useEffect, useState } from "react";

export interface EightBand { grade: string; min: number; max: number; points: number; }
export interface CBCBand { code: string; label: string; min: number; max: number; points: number; }
export type MeanRule = "simple" | "best-n" | "groups";
export type CBCRollup = "common-band" | "teacher-rating" | "average";

export interface SubjectBundle { id: string; name: string; subjectIds: string[]; }

export interface GradingConfig {
  eight: EightBand[];
  cbc4: CBCBand[];
  cbc8: CBCBand[];
  splitCBC: boolean;
  meanRule: MeanRule;
  bestN: number;
  cbcRollup: CBCRollup;
  cbcInternalAnalytics: boolean;
  bundles: SubjectBundle[];
}

export const DEFAULT_EIGHT: EightBand[] = [
  { grade: "A", min: 80, max: 100, points: 12 },
  { grade: "A-", min: 75, max: 79, points: 11 },
  { grade: "B+", min: 70, max: 74, points: 10 },
  { grade: "B", min: 65, max: 69, points: 9 },
  { grade: "B-", min: 60, max: 64, points: 8 },
  { grade: "C+", min: 55, max: 59, points: 7 },
  { grade: "C", min: 50, max: 54, points: 6 },
  { grade: "C-", min: 45, max: 49, points: 5 },
  { grade: "D+", min: 40, max: 44, points: 4 },
  { grade: "D", min: 35, max: 39, points: 3 },
  { grade: "D-", min: 30, max: 34, points: 2 },
  { grade: "E", min: 0, max: 29, points: 1 },
];

export const DEFAULT_CBC4: CBCBand[] = [
  { code: "EE", label: "Exceeding Expectations", min: 80, max: 100, points: 4 },
  { code: "ME", label: "Meeting Expectations", min: 65, max: 79, points: 3 },
  { code: "AE", label: "Approaching Expectations", min: 50, max: 64, points: 2 },
  { code: "BE", label: "Below Expectations", min: 0, max: 49, points: 1 },
];

export const DEFAULT_CBC8: CBCBand[] = [
  { code: "EE1", label: "Exceeding Expectations 1", min: 90, max: 100, points: 8 },
  { code: "EE2", label: "Exceeding Expectations 2", min: 80, max: 89, points: 7 },
  { code: "ME1", label: "Meeting Expectations 1", min: 72, max: 79, points: 6 },
  { code: "ME2", label: "Meeting Expectations 2", min: 65, max: 71, points: 5 },
  { code: "AE1", label: "Approaching Expectations 1", min: 58, max: 64, points: 4 },
  { code: "AE2", label: "Approaching Expectations 2", min: 50, max: 57, points: 3 },
  { code: "BE1", label: "Below Expectations 1", min: 40, max: 49, points: 2 },
  { code: "BE2", label: "Below Expectations 2", min: 0, max: 39, points: 1 },
];

const DEFAULT_CONFIG: GradingConfig = {
  eight: DEFAULT_EIGHT,
  cbc4: DEFAULT_CBC4,
  cbc8: DEFAULT_CBC8,
  splitCBC: false,
  meanRule: "simple",
  bestN: 7,
  cbcRollup: "common-band",
  cbcInternalAnalytics: false,
  bundles: [
    { id: "b-sci", name: "Sciences", subjectIds: [] },
    { id: "b-lang", name: "Languages", subjectIds: [] },
    { id: "b-hum", name: "Humanities", subjectIds: [] },
  ],
};

const KEY = "mastercbc.grading";
const EVT = "mastercbc:grading";

export function loadConfig(): GradingConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { return DEFAULT_CONFIG; }
}

export function saveConfig(cfg: GradingConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event(EVT));
}

export function useGradingConfig() {
  const [cfg, setCfg] = useState<GradingConfig>(() => loadConfig());
  useEffect(() => {
    const sync = () => setCfg(loadConfig());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [cfg, (next: GradingConfig) => { saveConfig(next); setCfg(next); }] as const;
}

/** Compute letter grade + points from a raw 0-100 score using the active band table. */
export function computeEight(score: number, bands: EightBand[]) {
  const b = bands.find((x) => score >= x.min && score <= x.max);
  return b ? { grade: b.grade, points: b.points } : { grade: "-", points: 0 };
}

/** Compute CBC band code + points from a raw 0-100 score. */
export function computeCBC(score: number, bands: CBCBand[]) {
  const b = bands.find((x) => score >= x.min && score <= x.max);
  return b ? { code: b.code, label: b.label, points: b.points } : { code: "-", label: "-", points: 0 };
}

/** Validate a band table covers 0..100 contiguously without overlaps. */
export function validateBands(bands: Array<{ min: number; max: number }>): string | null {
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  if (!sorted.length) return "No bands defined";
  if (sorted[0].min !== 0) return "Bands must start at 0";
  if (sorted[sorted.length - 1].max !== 100) return "Bands must end at 100";
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].min > sorted[i].max) return `Row ${i + 1}: min > max`;
    if (i > 0 && sorted[i].min !== sorted[i - 1].max + 1)
      return `Gap or overlap between ${sorted[i - 1].max} and ${sorted[i].min}`;
  }
  return null;
}
