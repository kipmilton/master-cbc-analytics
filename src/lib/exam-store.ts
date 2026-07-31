import { useEffect, useState } from "react";
import {
  exams as seedExams,
  examMean,
  scoreToGrade,
  type CBCRubric,
  type ExamEntry,
} from "./mock-data";

export type { ExamEntry, CBCRubric };
export { examMean };

const KEY = "mastercbc.exams";
const EVT = "mastercbc:exams";

export function loadExams(): ExamEntry[] {
  if (typeof window === "undefined") return seedExams;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExamEntry[]) : seedExams;
  } catch {
    return seedExams;
  }
}

export function saveExams(list: ExamEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

/** Append one record without clobbering concurrent writers (used by teacher entry). */
export function appendExam(entry: ExamEntry) {
  saveExams([...loadExams(), entry]);
}

export function useExams() {
  const [list, setList] = useState<ExamEntry[]>(() => loadExams());
  useEffect(() => {
    const sync = () => setList(loadExams());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [list, (next: ExamEntry[]) => { saveExams(next); setList(next); }] as const;
}

/* ---------- Analytics helpers: every dashboard figure comes from these ---------- */

export function compositeMeanOf(list: ExamEntry[], streamId: string) {
  const ss = list.filter((e) => e.streamId === streamId && e.locked);
  if (!ss.length) return 0;
  const total = ss.reduce((a, e) => a + examMean(e).points, 0);
  return Math.round((total / ss.length) * 100) / 100;
}

export function distributionOf(list: ExamEntry[], streamId: string) {
  const ss = list.filter((e) => e.streamId === streamId && e.locked);
  const dist: Record<string, number> = {};
  ss.forEach((ex) => {
    ex.scores.forEach((sc) => {
      const key = ex.system === "CBC" ? (sc.rubric ?? "ME") : scoreToGrade(sc.score ?? 0);
      dist[key] = (dist[key] ?? 0) + 1;
    });
  });
  return dist;
}

export const EXAM_TERMS = [
  "Term 1 - Opener",
  "Term 1 - Mid",
  "Term 1 - End",
  "Term 2 - Opener",
  "Term 2 - Mid",
  "Term 2 - End",
  "Term 3 - Opener",
  "Term 3 - End",
];
