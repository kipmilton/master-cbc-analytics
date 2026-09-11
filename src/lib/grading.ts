/** Client-safe grading vocabulary + pure band maths. Config itself is stored per school. */

export interface EightBand { grade: string; min: number; max: number; points: number }
export interface CBCBand { code: string; label: string; min: number; max: number; points: number }
export type MeanRule = "simple" | "best-n" | "groups";
export type CBCRollup = "common-band" | "teacher-rating" | "average";

export interface SubjectBundle { id: string; name: string; subjectIds: string[] }

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
  schoolLogo?: string;
  schoolAddress?: string;
  schoolMotto?: string;
  nextTermDate?: string;
  principalName?: string;
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

export const DEFAULT_GRADING: GradingConfig = {
  eight: DEFAULT_EIGHT,
  cbc4: DEFAULT_CBC4,
  cbc8: DEFAULT_CBC8,
  splitCBC: false,
  meanRule: "simple",
  bestN: 7,
  cbcRollup: "common-band",
  cbcInternalAnalytics: false,
  bundles: [],
  schoolLogo: "",
  schoolAddress: "P.O. Box 40300-00100 Nairobi · Tel: +254 712 345 678",
  schoolMotto: "Strive for Excellence",
  nextTermDate: "5th May 2026",
  principalName: "School Principal",
};

/** Fold whatever is stored in the DB over the defaults so the UI never sees holes. */
export function mergeGradingConfig(raw: Record<string, unknown> | null | undefined): GradingConfig {
  if (!raw) return DEFAULT_GRADING;
  return { ...DEFAULT_GRADING, ...(raw as Partial<GradingConfig>) };
}

export function computeEight(score: number, bands: EightBand[]) {
  const b = bands.find((x) => score >= x.min && score <= x.max);
  return b ? { grade: b.grade, points: b.points } : { grade: "-", points: 0 };
}

export function computeCBC(score: number, bands: CBCBand[]) {
  const b = bands.find((x) => score >= x.min && score <= x.max);
  return b ? { code: b.code, label: b.label, points: b.points } : { code: "-", label: "-", points: 0 };
}

/** A band table must cover 0..100 contiguously with no gaps or overlaps. */
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
