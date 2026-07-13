import { useEffect, useState } from "react";
import { users as seedUsers, streams as seedStreams } from "./mock-data";

export type TeacherStatus = "Pending Invite" | "Pending Approval" | "Active" | "Suspended";

export interface TeacherRow {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  title?: string;
  assignedStreams: string[];
  assignedSubjects: string[];
  status: TeacherStatus;
  invitedAt?: string;
  activatedAt?: string;
  temporaryPassword?: string;
  approvalStatus?: "pending" | "active";
}

const KEY = "mastercbc.teachers";
const EVT = "mastercbc:teachers";

function seed(): TeacherRow[] {
  return seedUsers
    .filter((u) => u.role === "teacher")
    .map((u) => ({
      id: u.id,
      schoolId: u.schoolId ?? "s1",
      name: u.name,
      email: u.email,
      title: u.title,
      assignedStreams: u.assignedStreams ?? [],
      assignedSubjects: [],
      status: "Active" as TeacherStatus,
      activatedAt: "2025-08-14",
      approvalStatus: "active",
    }));
}

export function loadTeachers(): TeacherRow[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw);
  } catch { return seed(); }
}

export function saveTeachers(list: TeacherRow[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function useTeachers() {
  const [list, setList] = useState<TeacherRow[]>(() => loadTeachers());
  useEffect(() => {
    const sync = () => setList(loadTeachers());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [list, (next: TeacherRow[]) => { saveTeachers(next); setList(next); }] as const;
}

export { seedStreams };
