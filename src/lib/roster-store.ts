import { useEffect, useState } from "react";

export type RosterStatus = "draft" | "pending" | "approved" | "rejected";

export interface RosterSubmission {
  id: string;
  schoolId: string;
  streamId: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[]; // pool students to assign
  newStudents: Array<{ name: string; admissionNo: string; gender: "M" | "F"; yearOfBirth: number }>;
  status: RosterStatus;
  submittedAt?: string;
  reviewedAt?: string;
  notes?: string;
}

const KEY = "mastercbc.rosters";
const EVT = "mastercbc:rosters";

export function loadRosters(): RosterSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveRosters(list: RosterSubmission[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function useRosters() {
  const [list, setList] = useState<RosterSubmission[]>(() => loadRosters());
  useEffect(() => {
    const sync = () => setList(loadRosters());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [list, (next: RosterSubmission[]) => { saveRosters(next); setList(next); }] as const;
}
