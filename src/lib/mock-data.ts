// Mock data layer. Replace with Supabase queries when DB is connected.
export type Role = "super_admin" | "school_admin" | "teacher";
export type SystemType = "CBC" | "8-4-4";
export type CBCRubric = "EE" | "ME" | "AE" | "BE";

export interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  schoolId?: string;
  assignedStreams?: string[]; // stream ids
  title?: string; // Principal / Deputy / Teacher
}

export interface School {
  id: string;
  name: string;
  county: string;
  status: "active" | "pending" | "suspended";
  students: number;
  createdAt: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  system: SystemType;
  approved: boolean;
}

export interface Stream {
  id: string;
  schoolId: string;
  grade: string;          // e.g. "Grade 10", "Form 4"
  name: string;           // East / West / Blue / Green
  system: SystemType;
  classTeacherId?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  streamId: string;
  name: string;
  admissionNo: string;
}

export interface ExamEntry {
  id: string;
  schoolId: string;
  streamId: string;
  subjectId: string;
  teacherId: string;
  term: string;
  examName: string;
  system: SystemType;
  locked: boolean;
  scores: Array<{ studentId: string; score?: number; rubric?: CBCRubric }>;
  createdAt: string;
}

// ---------- Seed ----------
export const schools: School[] = [
  { id: "s1", name: "Riverside Senior School", county: "Nairobi", status: "active", students: 842, createdAt: "2024-01-12" },
  { id: "s2", name: "Mt. Kenya Academy", county: "Nyeri", status: "active", students: 612, createdAt: "2024-03-04" },
  { id: "s3", name: "Coast Hills High", county: "Mombasa", status: "pending", students: 0, createdAt: "2026-06-10" },
  { id: "s4", name: "Rift Valley Comprehensive", county: "Nakuru", status: "suspended", students: 410, createdAt: "2023-08-22" },
];

export const users: MockUser[] = [
  { id: "u0", email: "super@mastercbc.co.ke", password: "super123", name: "Sophie Wambui", role: "super_admin" },
  { id: "u1", email: "principal@riverside.ac.ke", password: "school123", name: "James Otieno", role: "school_admin", schoolId: "s1", title: "Principal" },
  { id: "u2", email: "deputy@riverside.ac.ke", password: "school123", name: "Grace Mwende", role: "school_admin", schoolId: "s1", title: "Deputy Principal" },
  { id: "u3", email: "teacher@riverside.ac.ke", password: "teach123", name: "Peter Kamau", role: "teacher", schoolId: "s1", assignedStreams: ["st1", "st2"], title: "Chemistry Teacher" },
  { id: "u4", email: "mary@riverside.ac.ke", password: "teach123", name: "Mary Achieng", role: "teacher", schoolId: "s1", assignedStreams: ["st3"], title: "Biology Teacher" },
];

export const subjects: Subject[] = [
  { id: "sub1", schoolId: "s1", name: "Chemistry", system: "8-4-4", approved: true },
  { id: "sub2", schoolId: "s1", name: "Biology", system: "8-4-4", approved: true },
  { id: "sub3", schoolId: "s1", name: "Mathematics", system: "8-4-4", approved: true },
  { id: "sub4", schoolId: "s1", name: "Integrated Science", system: "CBC", approved: true },
  { id: "sub5", schoolId: "s1", name: "Pre-Technical Studies", system: "CBC", approved: true },
  { id: "sub6", schoolId: "s1", name: "Agriculture", system: "CBC", approved: false },
];

export const streams: Stream[] = [
  { id: "st1", schoolId: "s1", grade: "Grade 10", name: "East", system: "CBC", classTeacherId: "u3" },
  { id: "st2", schoolId: "s1", grade: "Grade 10", name: "West", system: "CBC", classTeacherId: "u3" },
  { id: "st3", schoolId: "s1", grade: "Form 4", name: "Blue", system: "8-4-4", classTeacherId: "u4" },
  { id: "st4", schoolId: "s1", grade: "Form 4", name: "Green", system: "8-4-4" },
  { id: "st5", schoolId: "s1", grade: "Grade 7", name: "North", system: "CBC" },
  { id: "st6", schoolId: "s1", grade: "Grade 7", name: "South", system: "CBC" },
];

const firstNames = ["Brian", "Faith", "Kevin", "Mercy", "Daniel", "Esther", "Joseph", "Lydia", "Samuel", "Janet", "Victor", "Ann", "Felix", "Joy", "Eric", "Cynthia", "Brandon", "Ruth", "Allan", "Stacy"];
const lastNames = ["Otieno", "Wanjiku", "Mwangi", "Achieng", "Kamau", "Njeri", "Kiprop", "Mutua", "Ouma", "Hassan", "Cheruiyot", "Adhiambo", "Karanja", "Wafula", "Barasa"];

function makeStudents(): Student[] {
  const out: Student[] = [];
  let admCount = 1000;
  streams.forEach((s) => {
    const n = 24 + Math.floor(Math.random() * 8);
    for (let i = 0; i < n; i++) {
      out.push({
        id: `${s.id}-stu-${i}`,
        schoolId: s.schoolId,
        streamId: s.id,
        name: `${firstNames[(i + admCount) % firstNames.length]} ${lastNames[(i * 3 + admCount) % lastNames.length]}`,
        admissionNo: `ADM${++admCount}`,
      });
    }
  });
  return out;
}
export const students: Student[] = makeStudents();

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function makeExams(): ExamEntry[] {
  const exams: ExamEntry[] = [];
  const terms = ["Term 1 - Opener", "Term 1 - Mid", "Term 1 - End", "Term 2 - Opener", "Term 2 - End"];
  let id = 0;
  streams.forEach((stream) => {
    const subs = subjects.filter((s) => s.schoolId === stream.schoolId && s.approved && s.system === stream.system);
    const streamStudents = students.filter((s) => s.streamId === stream.id);
    subs.forEach((sub) => {
      const rand = rng(parseInt(sub.id.replace(/\D/g, "")) * 31 + parseInt(stream.id.replace(/\D/g, "")));
      terms.forEach((term, idx) => {
        exams.push({
          id: `ex${++id}`,
          schoolId: stream.schoolId,
          streamId: stream.id,
          subjectId: sub.id,
          teacherId: stream.classTeacherId ?? "u3",
          term,
          examName: term,
          system: sub.system,
          locked: true,
          createdAt: `2026-0${(idx % 6) + 1}-15`,
          scores: streamStudents.map((stu) => {
            if (sub.system === "8-4-4") {
              const base = 45 + rand() * 45 + idx * 1.5;
              return { studentId: stu.id, score: Math.min(98, Math.round(base)) };
            } else {
              const tiers: CBCRubric[] = ["BE", "AE", "ME", "EE"];
              const weights = [0.08, 0.22, 0.45, 0.25];
              const r = rand();
              let acc = 0;
              for (let i = 0; i < tiers.length; i++) {
                acc += weights[i];
                if (r <= acc) return { studentId: stu.id, rubric: tiers[i] };
              }
              return { studentId: stu.id, rubric: "ME" as CBCRubric };
            }
          }),
        });
      });
    });
  });
  return exams;
}
export const exams: ExamEntry[] = makeExams();

// ---------- Helpers ----------
export const rubricToPoints = (r: CBCRubric) => ({ EE: 4, ME: 3, AE: 2, BE: 1 }[r]);
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
  ({ A: 12, "A-": 11, "B+": 10, B: 9, "B-": 8, "C+": 7, C: 6, "C-": 5, "D+": 4, D: 3, "D-": 2, E: 1 }[g] ?? 0);

export function examMean(ex: ExamEntry) {
  if (ex.system === "8-4-4") {
    const arr = ex.scores.map((s) => s.score ?? 0);
    const mean = arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    return { mean: Math.round(mean * 10) / 10, points: gradeToPoints(scoreToGrade(mean)), grade: scoreToGrade(mean) };
  } else {
    const arr = ex.scores.map((s) => rubricToPoints(s.rubric ?? "ME"));
    const mean = arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    const tier: CBCRubric = mean >= 3.5 ? "EE" : mean >= 2.5 ? "ME" : mean >= 1.5 ? "AE" : "BE";
    return { mean: Math.round(mean * 100) / 100, points: Math.round(mean * 10) / 10, grade: tier };
  }
}

export function streamCompositeMean(streamId: string) {
  const ss = exams.filter((e) => e.streamId === streamId && e.locked);
  if (!ss.length) return 0;
  const total = ss.reduce((a, e) => a + examMean(e).points, 0);
  return Math.round((total / ss.length) * 100) / 100;
}

export function gradeDistribution(streamId: string) {
  const ss = exams.filter((e) => e.streamId === streamId && e.locked);
  const dist: Record<string, number> = {};
  ss.forEach((ex) => {
    if (ex.system === "CBC") {
      ex.scores.forEach((sc) => { const k = sc.rubric ?? "ME"; dist[k] = (dist[k] ?? 0) + 1; });
    } else {
      ex.scores.forEach((sc) => { const g = scoreToGrade(sc.score ?? 0); dist[g] = (dist[g] ?? 0) + 1; });
    }
  });
  return dist;
}

export const testimonials = [
  { name: "Mr. Wycliffe Onyango", title: "Principal, Lakeside Secondary", quote: "Master CBC cut our results processing from three days to under an hour. Our staff actually look forward to exam season now." },
  { name: "Mrs. Hellen Wairimu", title: "Deputy Principal, Karen Girls", quote: "The stream comparisons are pure gold. We finally see exactly where each class needs attention." },
  { name: "Mr. Samuel Kiptoo", title: "Teacher, Eldoret Boys", quote: "Entering CBC rubric marks is finally simple. The instant analytics keep me honest as a subject teacher." },
  { name: "Ms. Beatrice Njoki", title: "Principal, Thika Hill Academy", quote: "Two admin seats with shared visibility is exactly how our office runs. It just fits Kenyan schools." },
];
