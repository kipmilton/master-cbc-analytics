import type { Caller } from "./tenant-guard.server";
import { assertOwnedRows, canWriteStreamMarks } from "./tenant-guard.server";
import { SCHOOL_ADMIN_ROLES } from "./roles";
import type {
  ExamEntry,
  RosterSubmission,
  SchoolSnapshot,
  Stream,
  Student,
  Subject,
} from "./school-data.functions";

type Row = Record<string, any>;

function forbid(message = "Forbidden"): never {
  throw new Response(message, { status: 403 });
}

const isAdminSeat = (role: string) => (SCHOOL_ADMIN_ROLES as readonly string[]).includes(role);

/* ------------------------------------------------------------- row mappers */

export const toStream = (r: Row): Stream => ({
  id: r.id,
  schoolId: r.school_id,
  grade: r.grade,
  name: r.name,
  system: r.system,
  classTeacherId: r.class_teacher_id ?? undefined,
});

export const toSubject = (r: Row): Subject => ({
  id: r.id,
  schoolId: r.school_id,
  name: r.name,
  system: r.system,
  approved: r.approved,
  cbcLevel: r.cbc_level ?? undefined,
  pathway: r.pathway ?? undefined,
  core: r.core ?? false,
  bundleId: r.bundle_id ?? undefined,
  createdBy: r.created_by ?? undefined,
});

export const toStudent = (r: Row): Student => ({
  id: r.id,
  schoolId: r.school_id,
  streamId: r.stream_id ?? undefined,
  name: r.name,
  admissionNo: r.admission_no,
  gender: r.gender === "F" ? "F" : "M",
  yearOfBirth: r.year_of_birth,
  status: r.status,
  archivedAt: r.archived_at ?? undefined,
});

export const toRoster = (r: Row): RosterSubmission => ({
  id: r.id,
  schoolId: r.school_id,
  streamId: r.stream_id,
  teacherId: r.teacher_id,
  teacherName: r.teacher_name ?? "",
  studentIds: r.student_ids ?? [],
  newStudents: r.new_students ?? [],
  status: r.status,
  notes: r.notes ?? undefined,
  submittedAt: r.submitted_at ?? undefined,
  reviewedAt: r.reviewed_at ?? undefined,
});

export const toExam = (r: Row): ExamEntry => ({
  id: r.id,
  schoolId: r.school_id,
  streamId: r.stream_id,
  subjectId: r.subject_id,
  teacherId: r.teacher_id ?? "",
  term: r.term,
  examName: r.exam_name,
  system: r.system,
  locked: r.locked,
  scores: r.scores ?? [],
  createdAt: r.created_at,
});

/* ---------------------------------------------------------------- snapshot */

export async function mapSnapshot(caller: Caller): Promise<SchoolSnapshot> {
  const { admin, schoolId } = caller;
  const [school, streams, subjects, students, exams, rosters, grading] = await Promise.all([
    admin.from("schools").select("name").eq("id", schoolId).maybeSingle(),
    admin.from("streams").select("*").eq("school_id", schoolId).order("grade"),
    admin.from("subjects").select("*").eq("school_id", schoolId).order("name"),
    admin.from("students").select("*").eq("school_id", schoolId).order("admission_no"),
    admin.from("exams").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }),
    admin.from("roster_submissions").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }),
    admin.from("grading_configs").select("config").eq("school_id", schoolId).maybeSingle(),
  ]);

  return {
    schoolId,
    schoolName: school.data?.name ?? "",
    streams: (streams.data ?? []).map(toStream),
    subjects: (subjects.data ?? []).map(toSubject),
    students: (students.data ?? []).map(toStudent),
    exams: (exams.data ?? []).map(toExam),
    rosters: (rosters.data ?? []).map(toRoster),
    gradingConfig: (grading.data?.config as Record<string, unknown>) ?? null,
  };
}

/* ----------------------------------------------------------------- streams */

export async function upsertStream(
  caller: Caller,
  data: { id?: string; grade: string; name: string; system: string; classTeacherId?: string | null },
) {
  if (data.id) await assertOwnedRows(caller, "streams", [data.id]);
  // A class teacher must be a teacher of this same school.
  if (data.classTeacherId) {
    const { data: t } = await caller.admin
      .from("profiles")
      .select("user_id")
      .eq("user_id", data.classTeacherId)
      .eq("school_id", caller.schoolId)
      .maybeSingle();
    if (!t) forbid("That teacher is not part of your school.");
  }
  const payload: Row = {
    school_id: caller.schoolId,
    grade: data.grade,
    name: data.name,
    system: data.system,
    class_teacher_id: data.classTeacherId ?? null,
  };
  if (data.id) payload.id = data.id;
  const { data: saved, error } = await caller.admin
    .from("streams")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toStream(saved);
}

/* ---------------------------------------------------------------- subjects */

export async function upsertSubject(
  caller: Caller,
  data: {
    id?: string;
    name: string;
    system: string;
    cbcLevel?: string;
    pathway?: string;
    core?: boolean;
    bundleId?: string;
  },
) {
  const admin = isAdminSeat(caller.role);
  if (data.id) await assertOwnedRows(caller, "subjects", [data.id]);
  const payload: Row = {
    school_id: caller.schoolId,
    name: data.name,
    system: data.system,
    cbc_level: data.cbcLevel ?? null,
    pathway: data.pathway ?? null,
    core: data.core ?? false,
    bundle_id: data.bundleId ?? null,
    created_by: caller.userId,
  };
  if (data.id) payload.id = data.id;
  // Admin-created subjects are live immediately; teacher uploads await approval.
  if (!data.id) payload.approved = admin;
  const { data: saved, error } = await caller.admin
    .from("subjects")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toSubject(saved);
}

/* ---------------------------------------------------------------- students */

export async function upsertStudents(
  caller: Caller,
  list: Array<{
    id?: string;
    name: string;
    admissionNo: string;
    gender: string;
    yearOfBirth: number;
    streamId?: string | null;
    status?: string;
  }>,
) {
  const existingIds = list.map((s) => s.id).filter(Boolean) as string[];
  if (existingIds.length) await assertOwnedRows(caller, "students", existingIds);
  const streamIds = Array.from(new Set(list.map((s) => s.streamId).filter(Boolean))) as string[];
  if (streamIds.length) await assertOwnedRows(caller, "streams", streamIds);

  const rows = list.map((s) => {
    const row: Row = {
      school_id: caller.schoolId,
      name: s.name,
      admission_no: s.admissionNo,
      gender: s.gender,
      year_of_birth: s.yearOfBirth,
      stream_id: s.streamId ?? null,
      status: s.status ?? "active",
    };
    if (s.id) row.id = s.id;
    return row;
  });

  const { data, error } = await caller.admin
    .from("students")
    .upsert(rows, { onConflict: "school_id,admission_no" })
    .select("*");
  if (error) throw new Error(error.message);
  return { saved: (data ?? []).map(toStudent) };
}

/* ----------------------------------------------------------------- rosters */

export async function saveRosterDraft(
  caller: Caller,
  data: {
    id?: string;
    streamId: string;
    studentIds: string[];
    newStudents: Array<{ name: string; admissionNo: string; gender: string; yearOfBirth: number }>;
    status: "draft" | "pending";
  },
) {
  await assertOwnedRows(caller, "streams", [data.streamId]);
  if (data.studentIds.length) await assertOwnedRows(caller, "students", data.studentIds);

  // Only the assigned class teacher (or an admin seat) may build this roster.
  if (!isAdminSeat(caller.role)) {
    const { data: stream } = await caller.admin
      .from("streams")
      .select("class_teacher_id")
      .eq("id", data.streamId)
      .maybeSingle();
    if (stream?.class_teacher_id !== caller.userId) forbid("You are not the class teacher for this stream.");
  }
  if (data.id) await assertOwnedRows(caller, "roster_submissions", [data.id]);

  const { data: me } = await caller.admin
    .from("profiles")
    .select("full_name")
    .eq("user_id", caller.userId)
    .maybeSingle();

  const payload: Row = {
    school_id: caller.schoolId,
    stream_id: data.streamId,
    teacher_id: caller.userId,
    teacher_name: me?.full_name ?? "",
    student_ids: data.studentIds,
    new_students: data.newStudents,
    status: data.status,
    submitted_at: data.status === "pending" ? new Date().toISOString() : null,
  };
  if (data.id) payload.id = data.id;

  const { data: saved, error } = await caller.admin
    .from("roster_submissions")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toRoster(saved);
}

export async function applyRosterDecision(
  caller: Caller,
  data: { id: string; decision: "approved" | "rejected"; notes: string },
) {
  await assertOwnedRows(caller, "roster_submissions", [data.id]);
  const { data: roster } = await caller.admin
    .from("roster_submissions")
    .select("*")
    .eq("id", data.id)
    .eq("school_id", caller.schoolId)
    .maybeSingle();
  if (!roster) forbid("Roster not found.");

  if (data.decision === "approved") {
    const ids: string[] = roster!.student_ids ?? [];
    if (ids.length) {
      await assertOwnedRows(caller, "students", ids);
      await caller.admin
        .from("students")
        .update({ stream_id: roster!.stream_id, status: "active" })
        .in("id", ids)
        .eq("school_id", caller.schoolId);
    }
    const fresh: Row[] = (roster!.new_students ?? []).map((s: Row) => ({
      school_id: caller.schoolId,
      stream_id: roster!.stream_id,
      name: s.name,
      admission_no: s.admissionNo,
      gender: s.gender ?? "M",
      year_of_birth: s.yearOfBirth ?? 2010,
      status: "active",
    }));
    if (fresh.length) {
      const { error } = await caller.admin
        .from("students")
        .upsert(fresh, { onConflict: "school_id,admission_no" });
      if (error) throw new Error(error.message);
    }
  }

  await caller.admin
    .from("roster_submissions")
    .update({ status: data.decision, notes: data.notes, reviewed_at: new Date().toISOString() })
    .eq("id", data.id)
    .eq("school_id", caller.schoolId);
  return { ok: true };
}

/* ------------------------------------------------------------------- exams */

export async function upsertExam(
  caller: Caller,
  data: {
    id?: string;
    streamId: string;
    subjectId: string;
    term: string;
    examName: string;
    system: string;
    locked: boolean;
    scores: Array<{ studentId: string; score?: number; rubric?: string }>;
  },
) {
  await assertOwnedRows(caller, "streams", [data.streamId]);
  await assertOwnedRows(caller, "subjects", [data.subjectId]);
  if (!(await canWriteStreamMarks(caller, data.streamId, data.subjectId))) {
    forbid("You are not assigned to this class or subject.");
  }

  if (data.id) {
    await assertOwnedRows(caller, "exams", [data.id]);
    const { data: current } = await caller.admin
      .from("exams")
      .select("locked")
      .eq("id", data.id)
      .maybeSingle();
    // Locked records are final: only an admin seat can reopen them.
    if (current?.locked && !isAdminSeat(caller.role)) forbid("This record is locked.");
  }

  const payload: Row = {
    school_id: caller.schoolId,
    stream_id: data.streamId,
    subject_id: data.subjectId,
    teacher_id: caller.userId,
    term: data.term,
    exam_name: data.examName,
    system: data.system,
    locked: data.locked,
    scores: data.scores,
  };
  if (data.id) payload.id = data.id;

  const { data: saved, error } = await caller.admin.from("exams").upsert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return toExam(saved);
}
