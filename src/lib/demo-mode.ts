// Demo mode helpers - return mock data for demo accounts
import { users, schools, streams, subjects, students, exams } from "./mock-data";
import { MyProfile } from "./me.functions";

const DEMO_EMAILS = {
  "super@mastercbc.co.ke": "u0",
  "principal@riverside.ac.ke": "u1",
  "teacher@riverside.ac.ke": "u3",
};

export function isDemoEmail(email: string): boolean {
  return email in DEMO_EMAILS;
}

export function getMockProfile(email: string): MyProfile | null {
  const demoUserId = DEMO_EMAILS[email as keyof typeof DEMO_EMAILS];
  if (!demoUserId) return null;

  const mockUser = users.find((u) => u.id === demoUserId);
  if (!mockUser) return null;

  let schoolId: string | null = null;
  let schoolName: string | null = null;
  let schoolStatus: "active" | "pending" | "suspended" | null = null;

  if (mockUser.schoolId) {
    const school = schools.find((s) => s.id === mockUser.schoolId);
    if (school) {
      schoolId = school.id;
      schoolName = school.name;
      schoolStatus = school.status as any;
    }
  }

  let assignedStreamIds: string[] = [];
  let assignedSubjectIds: string[] = [];
  if (mockUser.role === "teacher" && mockUser.schoolId) {
    // Streams and subjects this teacher is assigned to
    assignedStreamIds = streams
      .filter((s) => s.schoolId === mockUser.schoolId && s.classTeacherId === mockUser.id)
      .map((s) => s.id);
    assignedSubjectIds = subjects
      .filter((s) => s.schoolId === mockUser.schoolId)
      .map((s) => s.id);
  }

  return {
    userId: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    title: mockUser.title ?? null,
    role: mockUser.role,
    schoolId: schoolId ?? null,
    schoolName,
    schoolStatus,
    mustResetPassword: mockUser.requiresPasswordReset ?? false,
    applicationStatus: null,
    assignedStreamIds,
    assignedSubjectIds,
  };
}

export function getMockSchools() {
  return schools;
}

export function getMockStreams(schoolId: string) {
  return streams.filter((s) => s.schoolId === schoolId);
}

export function getMockSubjects(schoolId: string) {
  return subjects.filter((s) => s.schoolId === schoolId);
}

export function getMockStudents(schoolId: string, streamId?: string) {
  let result = students.filter((s) => s.schoolId === schoolId);
  if (streamId) result = result.filter((s) => s.streamId === streamId);
  return result;
}

export function getMockExams(schoolId: string, streamId?: string) {
  let result = exams.filter((e) => e.schoolId === schoolId);
  if (streamId) result = result.filter((e) => e.streamId === streamId);
  return result;
}

export function getMockTeachers(schoolId: string) {
  return users.filter((u) => u.role === "teacher" && u.schoolId === schoolId);
}

export function getMockStaff(schoolId: string) {
  return users.filter((u) => (u.role === "school_admin" || u.role === "teacher") && u.schoolId === schoolId);
}
