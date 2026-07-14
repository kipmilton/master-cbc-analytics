import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

async function assertSchoolAdmin(userId: string) {
  const { getSupabaseAdmin } = await import("./supabase-admin.server");
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("role, school_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.school_id || !["principal", "deputy_academic", "deputy_admin"].includes(data.role ?? "")) {
    throw new Response("Forbidden", { status: 403 });
  }
  return { admin, schoolId: data.school_id as string };
}

const staffSchema = z.object({
  role: z.enum(["teacher", "deputy_academic", "deputy_admin"]),
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
    const email = data.email.toLowerCase();

    // Reuse existing auth user if present, else create with must_reset_password flag
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (existing) {
      userId = existing.id;
      // Reset password to the temporary one and force reset on next login
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

    // Upsert profile with role + school + must_reset_password
    const { error: profErr } = await admin.from("profiles").upsert({
      user_id: userId,
      email,
      full_name: data.name,
      title: data.title,
      role: data.role,
      school_id: schoolId,
      must_reset_password: true,
    });
    if (profErr) throw new Error(profErr.message);

    if (data.role === "teacher" && (data.streamIds.length || data.subjectIds.length)) {
      const rows: Array<Record<string, string>> = [];
      const streams = data.streamIds.length ? data.streamIds : [""];
      const subjects = data.subjectIds.length ? data.subjectIds : [""];
      for (const s of streams) for (const sub of subjects) {
        const row: Record<string, string> = { teacher_id: userId, school_id: schoolId };
        if (s) row.stream_id = s;
        if (sub) row.subject_id = sub;
        rows.push(row);
      }
      if (rows.length) await admin.from("teacher_assignments").insert(rows);
    }

    return { ok: true, userId };
  });

export const listSchoolStaff = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { admin, schoolId } = await assertSchoolAdmin(context.userId);
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id,full_name,title,email,role,must_reset_password")
      .eq("school_id", schoolId);
    return (profiles ?? []).map((p) => ({
      userId: p.user_id,
      role: p.role,
      name: p.full_name ?? "",
      title: p.title ?? "",
      email: p.email ?? "",
      mustResetPassword: p.must_reset_password ?? false,
    }));
  });
