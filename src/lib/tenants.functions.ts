import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

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
  .validator((raw) => applicationSchema.parse(raw))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    let userId: string | null = null;

    const { getSupabaseAdmin, isServiceRoleConfigured } = await import("./supabase-admin.server");
    const admin = getSupabaseAdmin();
    const hasServiceRole = isServiceRoleConfigured();

    // 1. Try Supabase Admin API only if Service Role Key is available
    if (hasServiceRole) {
      try {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
          user_metadata: { name: data.principalName, title: data.principalTitle },
        });

        if (!createErr && created?.user) {
          userId = created.user.id;
        } else if (createErr?.message && /already registered|already exists/i.test(createErr.message)) {
          try {
            const { data: listData } = await admin.auth.admin.listUsers();
            const existing = listData?.users?.find((u) => u.email?.toLowerCase() === email);
            if (existing) {
              userId = existing.id;
            }
          } catch {
            /* continue */
          }
        }
      } catch (adminErr) {
        console.warn("Admin createUser bypassed, falling back to public auth.signUp:", adminErr);
      }
    }

    // 2. Fallback: Public auth.signUp / credential verification via Supabase client
    const { supabase } = await import("./supabase");

    if (!userId) {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: { name: data.principalName, title: data.principalTitle },
        },
      });

      const isAlreadyRegistered =
        (authErr && /already registered|already exists/i.test(authErr.message)) ||
        (!authErr && authData?.user && authData.user.identities && authData.user.identities.length === 0);

      if (isAlreadyRegistered) {
        // User already exists in Auth; verify password
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });

        if (signInErr || !signInData?.user) {
          throw new Error(
            "An account with this email already exists. Please sign in with your existing password or use a different email address.",
          );
        }

        userId = signInData.user.id;
      } else if (authErr) {
        throw new Error(authErr.message);
      } else {
        userId = authData.user?.id ?? null;
      }
    }

    if (userId) {
      const db = hasServiceRole ? admin : supabase;
      try {
        await db.from("profiles").upsert({
          user_id: userId,
          email,
          full_name: data.principalName,
          title: data.principalTitle,
          role: null,
          school_id: null,
          must_reset_password: false,
        });
      } catch (err) {
        console.warn("Profile upsert warning:", err);
      }

      try {
        await db.from("school_applications").upsert(
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
      } catch (err) {
        console.warn("School application upsert warning:", err);
      }
    }

    return { ok: true, userId };
  });

async function assertSuperAdmin(userId: string, email?: string) {
  const { getSupabaseAdmin } = await import("./supabase-admin.server");
  const admin = getSupabaseAdmin();

  const lowerEmail = email?.toLowerCase();
  const isWhitelisted = lowerEmail === "kipmilton71@gmail.com" || lowerEmail === "038sophienk@gmail.com";

  const { data: prof } = await admin.from("profiles").select("role").eq("user_id", userId).maybeSingle();

  // user_roles may not exist in all deployments — degrade gracefully
  let roles: Array<{ role: string }> = [];
  try {
    const { data: rolesData } = await admin.from("user_roles").select("role").eq("user_id", userId);
    roles = rolesData ?? [];
  } catch {
    /* table may not exist in live schema */
  }

  const isSuperAdmin =
    isWhitelisted ||
    prof?.role === "super_admin" ||
    roles?.some((r) => r.role === "super_admin");

  if (!isSuperAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }

  if (prof?.role !== "super_admin") {
    try {
      await admin.from("profiles").upsert({
        user_id: userId,
        role: "super_admin",
        must_reset_password: false,
      });
      await admin.from("user_roles").upsert({
        user_id: userId,
        role: "super_admin",
        school_id: null,
      });
    } catch {
      /* soft-fail */
    }
  }

  return admin;
}

export const listPendingApplications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const admin = await assertSuperAdmin(context.userId, context.email);
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
    const admin = await assertSuperAdmin(context.userId, context.email);
    const { data, error } = await admin
      .from("schools")
      .select("id,name,county,system,status,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Aggregate counters for the super-admin overview. No tenant rows leave the server. */
export const getPlatformStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const admin = await assertSuperAdmin(context.userId, context.email);
    const [schools, apps, students, exams, staff] = await Promise.all([
      admin.from("schools").select("id,status"),
      admin.from("school_applications").select("id,status"),
      admin.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("exams").select("id", { count: "exact", head: true }).eq("locked", true),
      admin.from("profiles").select("id", { count: "exact", head: true }).not("school_id", "is", null),
    ]);

    const schoolRows = schools.data ?? [];
    return {
      totalSchools: schoolRows.length,
      activeSchools: schoolRows.filter((s) => s.status === "active").length,
      suspendedSchools: schoolRows.filter((s) => s.status === "suspended").length,
      pendingApplications: (apps.data ?? []).filter((a) => a.status === "pending").length,
      activeLearners: students.count ?? 0,
      lockedExams: exams.count ?? 0,
      staffAccounts: staff.count ?? 0,
    };
  });

export const approveSchoolApplication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw) => z.object({ applicationId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const admin = await assertSuperAdmin(context.userId, context.email);
    const { data: app, error: appErr } = await admin
      .from("school_applications").select("*").eq("id", data.applicationId).maybeSingle();
    if (appErr || !app) throw new Error(appErr?.message ?? "Application not found");
    if (app.status !== "pending") throw new Error("Application already reviewed");

    const { data: school, error: schErr } = await admin
      .from("schools")
      .insert({ name: app.school_name, county: app.county, phone: app.phone, system: app.system, status: "active" })
      .select("id").single();
    if (schErr || !school) throw new Error(schErr?.message ?? "Could not create school");

    // Promote the applicant to principal of this school (profiles is the single source of truth)
    const { error: profErr } = await admin
      .from("profiles")
      .update({ role: "principal", school_id: school.id, title: app.principal_title ?? "Principal" })
      .eq("user_id", app.user_id);
    if (profErr) throw new Error(profErr.message);

    try {
      await admin.from("user_roles").upsert({
        user_id: app.user_id,
        role: "school_admin",
        school_id: school.id,
      });
    } catch {
      /* soft-fail */
    }

    await admin.from("school_applications")
      .update({ status: "approved", reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.applicationId);
    return { ok: true, schoolId: school.id };
  });

export const rejectSchoolApplication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw) =>
    z.object({ applicationId: z.string().uuid(), reason: z.string().max(500).default("") }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertSuperAdmin(context.userId, context.email);
    const { error } = await admin.from("school_applications")
      .update({
        status: "rejected", reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(), reject_reason: data.reason,
      }).eq("id", data.applicationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
