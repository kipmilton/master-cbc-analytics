import { useEffect, useState } from "react";
import { subjects as seedSubjects, type SystemType } from "./mock-data";

export type CBCLevel = "Junior Secondary" | "Senior Secondary";
export type Pathway = "STEM" | "Social Sciences" | "Arts & Sports Science";

export interface SubjectExt {
  id: string;
  schoolId: string;
  name: string;
  system: SystemType;
  approved: boolean;
  cbcLevel?: CBCLevel;   // when system === "CBC"
  pathway?: Pathway;     // when Senior Secondary
  core?: boolean;        // when Senior Secondary
  bundleId?: string;     // bundle grouping
}

const KEY = "mastercbc.subjects";
const EVT = "mastercbc:subjects";

function seed(): SubjectExt[] {
  return seedSubjects.map((s) => ({
    ...s,
    cbcLevel: s.system === "CBC" ? "Senior Secondary" : undefined,
    pathway: s.system === "CBC" ? "STEM" : undefined,
    core: s.system === "CBC",
  }));
}

export function loadSubjects(): SubjectExt[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw);
  } catch { return seed(); }
}

export function saveSubjects(list: SubjectExt[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function useSubjects() {
  const [list, setList] = useState<SubjectExt[]>(() => loadSubjects());
  useEffect(() => {
    const sync = () => setList(loadSubjects());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [list, (next: SubjectExt[]) => { saveSubjects(next); setList(next); }] as const;
}
