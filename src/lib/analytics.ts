/**
 * Pure analytics helpers. These operate on the live snapshot rows returned by
 * `getSchoolSnapshot`, so every dashboard figure is derived from the database.
 */
import type { CBCRubric, ExamEntry } from "./school-data.functions";

export const EXAM_TERMS = [
  "Term 1 - Opener",
  "Term 1 - Mid",
  "Term 1 - End",
  "Term 2 - Opener",
  "Term 2 - Mid",
  "Term 2 - End",
  "Term 3 - Opener",
  "Term 3 - End",
] as const;

export const RUBRICS: CBCRubric[] = ["EE", "ME", "AE", "BE"];

export const rubricToPoints = (r: CBCRubric) => ({ EE: 4, ME: 3, AE: 2, BE: 1 })[r];

export const scoreToGrade = (s: number) => {
  if (s >= 80) return "A";
  if (s >= 75) return "A-";
  if (s >= 70) return "B+";
  if (s >= 65) return "B";
  if (s >= 60) return "B-";
  if (s >= 55) return "C+";
  if (s >= 50) return "C";
  if (s >= 45) return "C-";
  if (s >= 40) return "D+";
  if (s >= 35) return "D";
  if (s >= 30) return "D-";
  return "E";
};

export const gradeToPoints = (g: string) =>
  ({ A: 12, "A-": 11, "B+": 10, B: 9, "B-": 8, "C+": 7, C: 6, "C-": 5, "D+": 4, D: 3, "D-": 2, E: 1 })[g] ?? 0;

export function examMean(ex: ExamEntry) {
  const entered = ex.scores.filter((s) => (ex.system === "8-4-4" ? typeof s.score === "number" : !!s.rubric));
  if (!entered.length) return { mean: 0, points: 0, grade: "—" };

  if (ex.system === "8-4-4") {
    const mean = entered.reduce((a, s) => a + (s.score ?? 0), 0) / entered.length;
    return {
      mean: Math.round(mean * 10) / 10,
      points: gradeToPoints(scoreToGrade(mean)),
      grade: scoreToGrade(mean),
    };
  }

  const mean = entered.reduce((a, s) => a + rubricToPoints(s.rubric ?? "ME"), 0) / entered.length;
  const tier: CBCRubric = mean >= 3.5 ? "EE" : mean >= 2.5 ? "ME" : mean >= 1.5 ? "AE" : "BE";
  return { mean: Math.round(mean * 100) / 100, points: Math.round(mean * 10) / 10, grade: tier };
}

/** Only locked records count towards published analytics. */
export function compositeMeanOf(list: ExamEntry[], streamId: string) {
  const ss = list.filter((e) => e.streamId === streamId && e.locked);
  if (!ss.length) return 0;
  return Math.round((ss.reduce((a, e) => a + examMean(e).points, 0) / ss.length) * 100) / 100;
}

export function distributionOf(list: ExamEntry[], streamId: string) {
  const dist: Record<string, number> = {};
  list
    .filter((e) => e.streamId === streamId && e.locked)
    .forEach((ex) => {
      ex.scores.forEach((sc) => {
        if (ex.system === "CBC") {
          if (!sc.rubric) return;
          dist[sc.rubric] = (dist[sc.rubric] ?? 0) + 1;
        } else {
          if (typeof sc.score !== "number") return;
          const g = scoreToGrade(sc.score);
          dist[g] = (dist[g] ?? 0) + 1;
        }
      });
    });
  return dist;
}
