import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

async function assertSchoolAdmin(userId: string) {
  const { getSupabaseAdmin } = await import("./supabase-admin.server");
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("user_roles")
    .select("school_id, role")
    .eq("user_id", userId)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!data?.school_id) throw new Response("Forbidden", { status: 403 });
  return { admin, schoolId: data.school_id as string };
}

const staffSchema = z.object({
  role: z.enum(["teacher", "school_admin"]),
  name: z.string().min(2),
  email: z.string().email(),
  title: z.string().default("Teacher"),
  tempPassword: z.string().min(8),
  streamIds: z.array(z.string().uuid()).default([]),
  subjectIds: z.array(z.string().uuid()).default([]),
});

export const createSchoolStaff = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => staffSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { admin, schoolId } = await assertSchoolAdmin(context.userId);

    // Create the auth user with email pre-confirmed and must_reset_password flag
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: data.tempPassword,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        title: data.title,
        must_reset_password: true,
      },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Could not create user");
    }
    const newUserId = created.user.id;

    // Ensure profile row exists with must_reset_password = true
    await admin.from("profiles").upsert({
      user_id: newUserId,
      full_name: data.name,
      title: data.title,
      must_reset_password: true,
    });

    // Grant role scoped to school
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: newUserId, role: data.role, school_id: schoolId });
    if (roleErr && !/duplicate|unique/i.test(roleErr.message)) throw new Error(roleErr.message);

    // Teacher assignments
    if (data.role === "teacher" && (data.streamIds.length || data.subjectIds.length)) {
      const rows: Array<Record<string, string>> = [];
      const streams = data.streamIds.length ? data.streamIds : [""];
      const subjects = data.subjectIds.length ? data.subjectIds : [""];
      for (const s of streams) {
        for (const sub of subjects) {
          const row: Record<string, string> = { teacher_id: newUserId, school_id: schoolId };
          if (s) row.stream_id = s;
          if (sub) row.subject_id = sub;
          rows.push(row);
        }
      }
      if (rows.length) await admin.from("teacher_assignments").insert(rows);
    }

    return { ok: true, userId: newUserId };
  });

export const listSchoolStaff = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { admin, schoolId } = await assertSchoolAdmin(context.userId);
    const { data: roles } = await admin
      .from("user_roles")
      .select("user_id,role")
      .eq("school_id", schoolId);
    const userIds = (roles ?? []).map((r) => r.user_id);
    if (!userIds.length) return [];
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id,full_name,title,must_reset_password")
      .in("user_id", userIds);
    const { data: emails } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map(emails.users.map((u) => [u.id, u.email ?? ""]));
    return (roles ?? []).map((r) => {
      const p = profiles?.find((x) => x.user_id === r.user_id);
      return {
        userId: r.user_id,
        role: r.role,
        name: p?.full_name ?? "",
        title: p?.title ?? "",
        mustResetPassword: p?.must_reset_password ?? false,
        email: emailMap.get(r.user_id) ?? "",
      };
    });
  });
