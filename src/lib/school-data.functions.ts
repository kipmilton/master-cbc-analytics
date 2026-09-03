import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

/* ------------------------------------------------------------------ types -- */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type SystemType = "CBC" | "8-4-4";
export type CBCRubric = "EE" | "ME" | "AE" | "BE";
export type Gender = "M" | "F";
export type StudentStatus = "active" | "archived-transfer" | "archived-expelled" | "pending-approval";
export type RosterStatus = "draft" | "pending" | "approved" | "rejected";

export interface Stream {
  id: string;
  schoolId: string;
  grade: string;
  name: string;
  system: SystemType;
  classTeacherId?: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  system: SystemType;
  approved: boolean;
  cbcLevel?: string;
  pathway?: string;
  core: boolean;
  bundleId?: string;
  createdBy?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  streamId?: string;
  name: string;
  admissionNo: string;
  gender: Gender;
  yearOfBirth: number;
  status: StudentStatus;
  archivedAt?: string;
}

export interface RosterSubmission {
  id: string;
  schoolId: string;
  streamId: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  newStudents: Array<{ name: string; admissionNo: string; gender: Gender; yearOfBirth: number }>;
  status: RosterStatus;
  notes?: string;
  submittedAt?: string;
  reviewedAt?: string;
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

export interface SchoolSnapshot {
  schoolId: string;
  schoolName: string;
  streams: Stream[];
  subjects: Subject[];
  students: Student[];
  exams: ExamEntry[];
  rosters: RosterSubmission[];
  gradingConfig: Record<string, JsonValue> | null;
}

/* ------------------------------------------------------------- read path -- */

/**
 * One round-trip that feeds every dashboard. Scoped to the caller's school by
 * the guard, so a teacher and a principal can never see another tenant's rows.
 */
export const getSchoolSnapshot = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<SchoolSnapshot> => {
    const { assertSchoolMember } = await import("./tenant-guard.server");
    const { mapSnapshot } = await import("./school-data.server");
    const caller = await assertSchoolMember(context.userId);
    return mapSnapshot(caller);
  });

/* ---------------------------------------------------------------- streams -- */

export const saveStream = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z
      .object({
        id: z.string().uuid().optional(),
        grade: z.string().min(1),
        name: z.string().min(1),
        system: z.enum(["CBC", "8-4-4"]),
        classTeacherId: z.string().uuid().nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin } = await import("./tenant-guard.server");
    const { upsertStream } = await import("./school-data.server");
    return upsertStream(await assertSchoolAdmin(context.userId), data);
  });

export const deleteStream = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin, assertOwnedRows } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await assertOwnedRows(caller, "streams", [data.id]);
    await caller.admin.from("streams").delete().eq("id", data.id).eq("school_id", caller.schoolId);
    return { ok: true };
  });

/* --------------------------------------------------------------- subjects -- */

export const saveSubject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        system: z.enum(["CBC", "8-4-4"]),
        cbcLevel: z.string().optional(),
        pathway: z.string().optional(),
        core: z.boolean().default(false),
        bundleId: z.string().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolMember } = await import("./tenant-guard.server");
    const { upsertSubject } = await import("./school-data.server");
    // Teachers may propose a subject; it lands unapproved until an admin says yes.
    return upsertSubject(await assertSchoolMember(context.userId), data);
  });

export const setSubjectApproved = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid(), approved: z.boolean() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin, assertOwnedRows } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await assertOwnedRows(caller, "subjects", [data.id]);
    await caller.admin
      .from("subjects")
      .update({ approved: data.approved })
      .eq("id", data.id)
      .eq("school_id", caller.schoolId);
    return { ok: true };
  });

export const deleteSubject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin, assertOwnedRows } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await assertOwnedRows(caller, "subjects", [data.id]);
    await caller.admin.from("subjects").delete().eq("id", data.id).eq("school_id", caller.schoolId);
    return { ok: true };
  });

/* --------------------------------------------------------------- students -- */

export const saveStudents = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z
      .object({
        students: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              name: z.string().min(1),
              admissionNo: z.string().min(1),
              gender: z.enum(["M", "F"]).default("M"),
              yearOfBirth: z.coerce.number().int().min(1950).max(2100).default(2010),
              streamId: z.string().uuid().nullable().optional(),
              status: z
                .enum(["active", "archived-transfer", "archived-expelled", "pending-approval"])
                .default("active"),
            }),
          )
          .min(1)
          .max(2000),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin } = await import("./tenant-guard.server");
    const { upsertStudents } = await import("./school-data.server");
    return upsertStudents(await assertSchoolAdmin(context.userId), data.students);
  });

export const setStudentStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "archived-transfer", "archived-expelled", "pending-approval"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin, assertOwnedRows } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await assertOwnedRows(caller, "students", [data.id]);
    const archived = data.status.startsWith("archived");
    await caller.admin
      .from("students")
      .update({
        status: data.status,
        archived_at: archived ? new Date().toISOString() : null,
        stream_id: archived ? null : undefined,
      })
      .eq("id", data.id)
      .eq("school_id", caller.schoolId);
    return { ok: true };
  });

export const assignStudentsToStream = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z
      .object({
        studentIds: z.array(z.string().uuid()).min(1),
        streamId: z.string().uuid().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin, assertOwnedRows } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await assertOwnedRows(caller, "students", data.studentIds);
    if (data.streamId) await assertOwnedRows(caller, "streams", [data.streamId]);
    await caller.admin
      .from("students")
      .update({ stream_id: data.streamId })
      .in("id", data.studentIds)
      .eq("school_id", caller.schoolId);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin, assertOwnedRows } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await assertOwnedRows(caller, "students", [data.id]);
    await caller.admin.from("students").delete().eq("id", data.id).eq("school_id", caller.schoolId);
    return { ok: true };
  });

/* ---------------------------------------------------------------- rosters -- */

export const submitRoster = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z
      .object({
        id: z.string().uuid().optional(),
        streamId: z.string().uuid(),
        studentIds: z.array(z.string().uuid()).default([]),
        newStudents: z
          .array(
            z.object({
              name: z.string().min(1),
              admissionNo: z.string().min(1),
              gender: z.enum(["M", "F"]).default("M"),
              yearOfBirth: z.coerce.number().int().default(2010),
            }),
          )
          .default([]),
        status: z.enum(["draft", "pending"]).default("pending"),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolMember } = await import("./tenant-guard.server");
    const { saveRosterDraft } = await import("./school-data.server");
    return saveRosterDraft(await assertSchoolMember(context.userId), data);
  });

export const reviewRoster = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        notes: z.string().max(500).default(""),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin } = await import("./tenant-guard.server");
    const { applyRosterDecision } = await import("./school-data.server");
    return applyRosterDecision(await assertSchoolAdmin(context.userId), data);
  });

/* ------------------------------------------------------------------ exams -- */

export const saveExam = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z
      .object({
        id: z.string().uuid().optional(),
        streamId: z.string().uuid(),
        subjectId: z.string().uuid(),
        term: z.string().min(1),
        examName: z.string().min(1),
        system: z.enum(["CBC", "8-4-4"]),
        locked: z.boolean().default(false),
        scores: z
          .array(
            z.object({
              studentId: z.string().uuid(),
              score: z.coerce.number().min(0).max(100).optional(),
              rubric: z.enum(["EE", "ME", "AE", "BE"]).optional(),
            }),
          )
          .default([]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolMember } = await import("./tenant-guard.server");
    const { upsertExam } = await import("./school-data.server");
    return upsertExam(await assertSchoolMember(context.userId), data);
  });

export const setExamLocked = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid(), locked: z.boolean() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin, assertOwnedRows } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await assertOwnedRows(caller, "exams", [data.id]);
    await caller.admin
      .from("exams")
      .update({ locked: data.locked })
      .eq("id", data.id)
      .eq("school_id", caller.schoolId);
    return { ok: true };
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin, assertOwnedRows } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await assertOwnedRows(caller, "exams", [data.id]);
    await caller.admin.from("exams").delete().eq("id", data.id).eq("school_id", caller.schoolId);
    return { ok: true };
  });

/* --------------------------------------------------------------- grading -- */

export const saveGradingConfig = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => z.object({ config: z.record(z.string(), z.unknown()) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin } = await import("./tenant-guard.server");
    const caller = await assertSchoolAdmin(context.userId);
    await caller.admin
      .from("grading_configs")
      .upsert(
        { school_id: caller.schoolId, config: data.config, updated_at: new Date().toISOString() },
        { onConflict: "school_id" },
      );
    return { ok: true };
  });
