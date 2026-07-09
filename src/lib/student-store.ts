import { useEffect, useState } from "react";
import { students as seedStudents } from "./mock-data";

export type Gender = "M" | "F";
export type StudentStatus = "active" | "archived-transfer" | "archived-expelled" | "pending-approval";

export interface StudentExt {
  id: string;
  schoolId: string;
  streamId?: string; // undefined = unassigned master pool
  name: string;
  admissionNo: string;
  gender: Gender;
  yearOfBirth: number;
  status: StudentStatus;
  archivedAt?: string;
}

const KEY = "mastercbc.students";
const EVT = "mastercbc:students";

const firstNamesM = ["Brian", "Kevin", "Daniel", "Joseph", "Samuel", "Victor", "Felix", "Eric", "Brandon", "Allan", "Peter", "John", "Mark", "David", "Isaac"];
const firstNamesF = ["Faith", "Mercy", "Esther", "Lydia", "Janet", "Ann", "Joy", "Cynthia", "Ruth", "Stacy", "Grace", "Mary", "Sarah", "Nancy", "Purity"];

function seed(): StudentExt[] {
  const out: StudentExt[] = seedStudents.map((s, i) => {
    const gender: Gender = i % 2 === 0 ? "M" : "F";
    const pool = gender === "M" ? firstNamesM : firstNamesF;
    const first = pool[i % pool.length];
    const last = s.name.split(" ")[1] ?? "Otieno";
    return {
      id: s.id,
      schoolId: s.schoolId,
      streamId: s.streamId,
      name: `${first} ${last}`,
      admissionNo: s.admissionNo,
      gender,
      yearOfBirth: 2008 - (i % 4),
      status: "active",
    };
  });
  // Add a pool of unassigned students to demonstrate the master pool
  const unassignedNames = [
    ["Naomi", "Wanjiru", "F"], ["Kelvin", "Odhiambo", "M"], ["Beatrice", "Chebet", "F"],
    ["Dennis", "Muriuki", "M"], ["Sharon", "Atieno", "F"], ["Ian", "Kiprono", "M"],
    ["Cynthia", "Nafula", "F"], ["Emmanuel", "Waweru", "M"], ["Winnie", "Kerubo", "F"],
    ["Nicholas", "Barasa", "M"], ["Trizah", "Njoki", "F"], ["Steve", "Owino", "M"],
  ];
  let adm = 9000;
  unassignedNames.forEach(([f, l, g], i) => {
    out.push({
      id: `pool-${i}`,
      schoolId: "s1",
      name: `${f} ${l}`,
      admissionNo: `ADM${++adm}`,
      gender: g as Gender,
      yearOfBirth: 2008 - (i % 4),
      status: "active",
    });
  });
  return out;
}

export function loadStudents(): StudentExt[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw);
  } catch { return seed(); }
}

export function saveStudents(list: StudentExt[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function useStudents() {
  const [list, setList] = useState<StudentExt[]>(() => loadStudents());
  useEffect(() => {
    const sync = () => setList(loadStudents());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [list, (next: StudentExt[]) => { saveStudents(next); setList(next); }] as const;
}
