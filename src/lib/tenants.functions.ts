import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

// PUBLIC — used at signup before a session exists.
const applicationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  schoolName: z.string().min(2),
  county: z.string().min(2),
  phone: z.string().min(4),
  system: z.enum(["cbc", "844", "both"]),
  principalName: z.string().min(2),
  principalTitle: z.string().default("Principal"),
});

export const submitSchoolApplication = createServerFn({ method: "POST" })
  .inputValidator((raw) => applicationSchema.parse(raw))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase-admin.server");
    const admin = getSupabaseAdmin();
    const email = data.email.toLowerCase();

    // Find or create the auth user (auto-confirm so they can sign in immediately).
    let userId: string | null = null;
    const { data: existingList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = existingList.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: { name: data.principalName, title: data.principalTitle },
      });
      if (error || !created.user) throw new Error(error?.message ?? "Could not create account");
      userId = created.user.id;
    }

    await admin.from("profiles").upsert({
      user_id: userId,
      full_name: data.principalName,
      title: data.principalTitle,
      must_reset_password: false,
    });

    const { error } = await admin.from("school_applications").upsert(
      {
        user_id: userId,
        school_name: data.schoolName,
        county: data.county,
        phone: data.phone,
        system: data.system,
        principal_name: data.principalName,
        principal_title: data.principalTitle,
        status: "pending",
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function assertSuperAdmin(userId: string) {
  const { getSupabaseAdmin } = await import("./supabase-admin.server");
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!data) throw new Response("Forbidden", { status: 403 });
  return admin;
}

export const listPendingApplications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const admin = await assertSuperAdmin(context.userId);
    const { data, error } = await admin
      .from("school_applications")
      .select("id,user_id,school_name,county,phone,system,principal_name,principal_title,status,created_at,reject_reason")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAllSchools = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const admin = await assertSuperAdmin(context.userId);
    const { data, error } = await admin
      .from("schools")
      .select("id,name,county,system,status,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const approveSchoolApplication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) => z.object({ applicationId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const admin = await assertSuperAdmin(context.userId);
    const { data: app, error: appErr } = await admin
      .from("school_applications").select("*").eq("id", data.applicationId).maybeSingle();
    if (appErr || !app) throw new Error(appErr?.message ?? "Application not found");
    if (app.status !== "pending") throw new Error("Application already reviewed");

    const { data: school, error: schErr } = await admin
      .from("schools")
      .insert({ name: app.school_name, county: app.county, phone: app.phone, system: app.system, status: "active" })
      .select("id").single();
    if (schErr || !school) throw new Error(schErr?.message ?? "Could not create school");

    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: app.user_id, role: "school_admin", school_id: school.id });
    if (roleErr && !/duplicate|unique/i.test(roleErr.message)) throw new Error(roleErr.message);

    await admin.from("school_applications")
      .update({ status: "approved", reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.applicationId);
    return { ok: true, schoolId: school.id };
  });

export const rejectSchoolApplication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((raw) =>
    z.object({ applicationId: z.string().uuid(), reason: z.string().max(500).default("") }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertSuperAdmin(context.userId);
    const { error } = await admin.from("school_applications")
      .update({
        status: "rejected", reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(), reject_reason: data.reason,
      }).eq("id", data.applicationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
