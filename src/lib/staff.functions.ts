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
  // The school itself must still be active — suspended tenants cannot mutate data.
  const { data: school } = await admin
    .from("schools")
    .select("status")
    .eq("id", data.school_id)
    .maybeSingle();
  if (school?.status !== "active") throw new Response("Forbidden", { status: 403 });
  return { admin, schoolId: data.school_id as string };
}


const staffSchema = z.object({
  role: z.enum(["teacher", "deputy_academic", "deputy_admin"]),
  name: z.string().min(2),
  email: z.string().email(),
  title: z.string().default("Teacher"),
  tempPassword: z.string().min(8),
  streamIds: z.array(z.string()).default([]),
  subjectIds: z.array(z.string()).default([]),
});

export const createSchoolStaff = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => staffSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { admin, schoolId } = await assertSchoolAdmin(context.userId);
    const email = data.email.toLowerCase();

    // SECURITY: a school admin may only (re)issue credentials for accounts that
    // belong to their own tenant. Without this check a principal could reset the
    // password of the super admin or of another school's staff and take it over.
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
      // Re-issue the temporary password for this school's own staff member
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
      // Only accept streams/subjects that actually belong to this school
      const [{ data: okStreams }, { data: okSubjects }] = await Promise.all([
        data.streamIds.length
          ? admin.from("streams").select("id").eq("school_id", schoolId).in("id", data.streamIds)
          : Promise.resolve({ data: [] as { id: string }[] }),
        data.subjectIds.length
          ? admin.from("subjects").select("id").eq("school_id", schoolId).in("id", data.subjectIds)
          : Promise.resolve({ data: [] as { id: string }[] }),
      ]);
      const streamIds = (okStreams ?? []).map((r) => r.id);
      const subjectIds = (okSubjects ?? []).map((r) => r.id);

      const rows: Array<Record<string, string>> = [];
      const streams = streamIds.length ? streamIds : [""];
      const subjects = subjectIds.length ? subjectIds : [""];
      for (const s of streams) for (const sub of subjects) {
        if (!s && !sub) continue;
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
