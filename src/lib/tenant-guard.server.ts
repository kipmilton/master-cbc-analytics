import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "./supabase-admin.server";
import { SCHOOL_ADMIN_ROLES } from "./roles";

export interface Caller {
  admin: SupabaseClient;
  userId: string;
  role: string;
  schoolId: string;
}

function forbid(message = "Forbidden"): never {
  throw new Response(message, { status: 403 });
}

async function loadProfile(userId: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("role, school_id")
    .eq("user_id", userId)
    .maybeSingle();
  return { admin, role: (data?.role as string | null) ?? null, schoolId: (data?.school_id as string | null) ?? null };
}

/** The tenant must exist and be active — suspended schools are read-only-nothing. */
async function assertActiveSchool(admin: SupabaseClient, schoolId: string) {
  const { data } = await admin.from("schools").select("status").eq("id", schoolId).maybeSingle();
  if (data?.status !== "active") forbid("This school is not active.");
}

/** Platform owner. */
export async function assertSuperAdmin(userId: string): Promise<SupabaseClient> {
  const { admin, role } = await loadProfile(userId);
  if (role !== "super_admin") forbid();
  return admin;
}

/** One of the four school admin seats, in an active school. */
export async function assertSchoolAdmin(userId: string): Promise<Caller> {
  const { admin, role, schoolId } = await loadProfile(userId);
  if (!schoolId || !(SCHOOL_ADMIN_ROLES as readonly string[]).includes(role ?? "")) forbid();
  await assertActiveSchool(admin, schoolId!);
  return { admin, userId, role: role!, schoolId: schoolId! };
}

/** Any staff member (admin seat or teacher) of an active school. Read paths. */
export async function assertSchoolMember(userId: string): Promise<Caller> {
  const { admin, role, schoolId } = await loadProfile(userId);
  const allowed = [...SCHOOL_ADMIN_ROLES, "teacher"] as readonly string[];
  if (!schoolId || !allowed.includes(role ?? "")) forbid();
  await assertActiveSchool(admin, schoolId!);
  return { admin, userId, role: role!, schoolId: schoolId! };
}

/** Every row this function touches must already belong to the caller's school. */
export async function assertOwnedRows(
  caller: Caller,
  table: string,
  ids: string[],
): Promise<string[]> {
  if (!ids.length) return [];
  const { data } = await caller.admin
    .from(table)
    .select("id")
    .eq("school_id", caller.schoolId)
    .in("id", ids);
  const ok = (data ?? []).map((r) => r.id as string);
  if (ok.length !== ids.length) forbid("Some records do not belong to your school.");
  return ok;
}

/** True when the caller may write marks for this stream. */
export async function canWriteStreamMarks(caller: Caller, streamId: string, subjectId: string) {
  if ((SCHOOL_ADMIN_ROLES as readonly string[]).includes(caller.role)) return true;
  const { data: stream } = await caller.admin
    .from("streams")
    .select("class_teacher_id")
    .eq("id", streamId)
    .eq("school_id", caller.schoolId)
    .maybeSingle();
  if (stream?.class_teacher_id === caller.userId) return true;
  const { data: asg } = await caller.admin
    .from("teacher_assignments")
    .select("id")
    .eq("teacher_id", caller.userId)
    .eq("school_id", caller.schoolId)
    .or(`stream_id.eq.${streamId},subject_id.eq.${subjectId}`);
  return (asg ?? []).length > 0;
}
