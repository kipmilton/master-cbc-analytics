import type { Caller } from "./tenant-guard.server";
import { assertOwnedRows } from "./tenant-guard.server";
import { ROLE_TITLES, SCHOOL_ADMIN_ROLES, type AppRole } from "./roles";
import type { StaffRow } from "./staff.functions";

function forbid(message = "Forbidden"): never {
  throw new Response(message, { status: 403 });
}

const isAdminSeat = (role: string) => (SCHOOL_ADMIN_ROLES as readonly string[]).includes(role);

export async function readStaff(caller: Caller): Promise<StaffRow[]> {
  const [{ data: profiles }, { data: asg }, { data: streams }] = await Promise.all([
    caller.admin
      .from("profiles")
      .select("user_id,full_name,title,email,role,must_reset_password")
      .eq("school_id", caller.schoolId),
    caller.admin.from("teacher_assignments").select("teacher_id,stream_id,subject_id").eq("school_id", caller.schoolId),
    caller.admin.from("streams").select("id,class_teacher_id").eq("school_id", caller.schoolId),
  ]);

  return (profiles ?? []).map((p) => {
    const mine = (asg ?? []).filter((a) => a.teacher_id === p.user_id);
    return {
      userId: p.user_id as string,
      role: (p.role as string) ?? "unassigned",
      name: (p.full_name as string) ?? "",
      title: (p.title as string) ?? ROLE_TITLES[(p.role as AppRole) ?? "teacher"] ?? "",
      email: (p.email as string) ?? "",
      mustResetPassword: (p.must_reset_password as boolean) ?? false,
      streamIds: Array.from(new Set(mine.map((a) => a.stream_id).filter(Boolean))) as string[],
      subjectIds: Array.from(new Set(mine.map((a) => a.subject_id).filter(Boolean))) as string[],
      classTeacherStreamIds: (streams ?? [])
        .filter((s) => s.class_teacher_id === p.user_id)
        .map((s) => s.id as string),
    };
  });
}

export async function provisionStaff(
  caller: Caller,
  data: {
    role: "deputy_academic" | "deputy_admin" | "dean_academics" | "teacher";
    name: string;
    email: string;
    title: string;
    tempPassword: string;
    streamIds: string[];
    subjectIds: string[];
  },
) {
  const { admin, schoolId } = caller;
  const email = data.email.trim().toLowerCase();

  // Each school gets exactly one holder per admin seat (principal + three deputies/dean).
  if (isAdminSeat(data.role)) {
    const { data: seat } = await admin
      .from("profiles")
      .select("user_id,email")
      .eq("school_id", schoolId)
      .eq("role", data.role)
      .maybeSingle();
    if (seat && (seat.email as string)?.toLowerCase() !== email) {
      forbid(`The ${ROLE_TITLES[data.role]} seat is already taken. Remove the current holder first.`);
    }
  }

  // SECURITY: a school admin may only issue credentials inside their own tenant,
  // and never for a super admin or another school's principal.
  let userId: string | null = null;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === email);

  if (existing) {
    const { data: prof } = await admin
      .from("profiles")
      .select("role, school_id")
      .eq("user_id", existing.id)
      .maybeSingle();
    const belongsHere = !prof?.school_id || prof.school_id === schoolId;
    const isPrivileged = prof?.role === "super_admin" || prof?.role === "principal";
    if (!belongsHere || isPrivileged) {
      throw new Response("This email already belongs to another account.", { status: 403 });
    }
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, { password: data.tempPassword, email_confirm: true });
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: data.tempPassword,
      email_confirm: true,
      user_metadata: { name: data.name, title: data.title, must_reset_password: true },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create user");
    userId = created.user.id;
  }

  const title = data.title.trim() || ROLE_TITLES[data.role];
  const { error: profErr } = await admin.from("profiles").upsert(
    {
      user_id: userId,
      email,
      full_name: data.name,
      title,
      role: data.role,
      school_id: schoolId,
      must_reset_password: true,
    },
    { onConflict: "user_id" },
  );
  if (profErr) throw new Error(profErr.message);

  if (data.role === "teacher") {
    await setAssignments(caller, { teacherId: userId, streamIds: data.streamIds, subjectIds: data.subjectIds });
  }

  return { ok: true, userId, title, tempPassword: data.tempPassword };
}

export async function setAssignments(
  caller: Caller,
  data: { teacherId: string; streamIds: string[]; subjectIds: string[] },
) {
  const { admin, schoolId } = caller;
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", data.teacherId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!target) forbid("That staff member is not part of your school.");

  const streamIds = data.streamIds.length ? await assertOwnedRows(caller, "streams", data.streamIds) : [];
  const subjectIds = data.subjectIds.length ? await assertOwnedRows(caller, "subjects", data.subjectIds) : [];

  await admin.from("teacher_assignments").delete().eq("teacher_id", data.teacherId).eq("school_id", schoolId);

  const rows: Array<Record<string, string>> = [];
  const streams = streamIds.length ? streamIds : [""];
  const subjects = subjectIds.length ? subjectIds : [""];
  for (const s of streams) {
    for (const sub of subjects) {
      if (!s && !sub) continue;
      const row: Record<string, string> = { teacher_id: data.teacherId, school_id: schoolId };
      if (s) row.stream_id = s;
      if (sub) row.subject_id = sub;
      rows.push(row);
    }
  }
  if (rows.length) {
    const { error } = await admin.from("teacher_assignments").insert(rows);
    if (error) throw new Error(error.message);
  }
  return { ok: true };
}

export async function detachStaff(caller: Caller, userId: string) {
  const { admin, schoolId } = caller;
  if (userId === caller.userId) forbid("You cannot remove your own account.");
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!target) forbid("That staff member is not part of your school.");
  if (target.role === "principal") forbid("The principal seat cannot be removed.");

  await admin.from("teacher_assignments").delete().eq("teacher_id", userId).eq("school_id", schoolId);
  await admin.from("streams").update({ class_teacher_id: null }).eq("class_teacher_id", userId).eq("school_id", schoolId);
  await admin.from("profiles").update({ role: null, school_id: null }).eq("user_id", userId);
  return { ok: true };
}
