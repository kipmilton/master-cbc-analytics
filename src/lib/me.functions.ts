import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";
import { SCHOOL_ADMIN_ROLES, type AppRole } from "./roles";

export type { AppRole };
export { SCHOOL_ADMIN_ROLES };

export interface MyProfile {
  userId: string;
  email: string;
  name: string;
  title: string | null;
  role: AppRole | null;
  schoolId: string | null;
  schoolName: string | null;
  schoolStatus: "pending" | "active" | "suspended" | null;
  mustResetPassword: boolean;
  applicationStatus: "pending" | "approved" | "rejected" | null;
  assignedStreamIds: string[];
  assignedSubjectIds: string[];
  classTeacherStreamIds: string[];
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<MyProfile> => {
    const { getSupabaseAdmin } = await import("./supabase-admin.server");
    const admin = getSupabaseAdmin();
    const uid = context.userId;
    const email = context.email.toLowerCase();

    const isSuperAdminEmail = email === "kipmilton71@gmail.com" || email === "038sophienk@gmail.com";

    const [{ data: profile }, { data: app }] = await Promise.all([
      admin
        .from("profiles")
        .select("full_name,title,role,school_id,must_reset_password")
        .eq("user_id", uid)
        .maybeSingle(),
      admin.from("school_applications").select("status,principal_name,principal_title").eq("user_id", uid).maybeSingle(),
    ]);

    // user_roles may not exist in all deployments — degrade gracefully
    let roles: Array<{ role: string }> = [];
    try {
      const { data: rolesData } = await admin.from("user_roles").select("role").eq("user_id", uid);
      roles = rolesData ?? [];
    } catch {
      /* table may not exist in live schema */
    }

    let role: AppRole | null = (profile?.role as AppRole | undefined) ?? null;
    const hasSuperAdminRole = roles?.some((r) => r.role === "super_admin");

    if (isSuperAdminEmail || hasSuperAdminRole) {
      role = "super_admin";
      if (profile?.role !== "super_admin") {
        try {
          await admin.from("profiles").upsert({
            user_id: uid,
            email,
            role: "super_admin",
            must_reset_password: false,
          });
          await admin.from("user_roles").upsert({
            user_id: uid,
            role: "super_admin",
            school_id: null,
          });
        } catch (e) {
          console.warn("Auto-sync super_admin failed:", e);
        }
      }
    }

    let schoolName: string | null = null;
    let schoolStatus: MyProfile["schoolStatus"] = null;
    if (profile?.school_id) {
      const { data: sch } = await admin
        .from("schools")
        .select("name,status")
        .eq("id", profile.school_id)
        .maybeSingle();
      schoolName = sch?.name ?? null;
      schoolStatus = (sch?.status as MyProfile["schoolStatus"]) ?? null;
    }

    let assignedStreamIds: string[] = [];
    let assignedSubjectIds: string[] = [];
    let classTeacherStreamIds: string[] = [];
    if (profile?.role === "teacher" && profile.school_id) {
      const [{ data: asg }, { data: owned }] = await Promise.all([
        admin.from("teacher_assignments").select("stream_id,subject_id").eq("teacher_id", uid),
        admin.from("streams").select("id").eq("class_teacher_id", uid).eq("school_id", profile.school_id),
      ]);
      assignedStreamIds = Array.from(
        new Set((asg ?? []).map((a) => a.stream_id).filter(Boolean)),
      ) as string[];
      assignedSubjectIds = Array.from(
        new Set((asg ?? []).map((a) => a.subject_id).filter(Boolean)),
      ) as string[];
      classTeacherStreamIds = (owned ?? []).map((s) => s.id as string);
      // A class teacher always sees their own stream in the picker.
      assignedStreamIds = Array.from(new Set([...assignedStreamIds, ...classTeacherStreamIds]));
    }

    // Name priority: 1) profile.full_name, 2) application principal_name, 3) auth JWT metadata
    // The middleware already extracts user_metadata from the JWT — no admin API needed.
    const name = profile?.full_name?.trim() || app?.principal_name?.trim() || (context as any).userMetaName?.trim() || "";
    const userTitle = profile?.title?.trim() || app?.principal_title?.trim() || (context as any).userMetaTitle?.trim() || null;

    return {
      userId: uid,
      email: context.email,
      name,
      title: userTitle,
      role,
      schoolId: profile?.school_id ?? null,
      schoolName,
      schoolStatus,
      mustResetPassword: profile?.must_reset_password ?? false,
      applicationStatus: (app?.status as MyProfile["applicationStatus"]) ?? null,
      assignedStreamIds,
      assignedSubjectIds,
      classTeacherStreamIds,
    };
  });

export const clearMustResetPassword = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { getSupabaseAdmin } = await import("./supabase-admin.server");
    const admin = getSupabaseAdmin();
    await admin.from("profiles").update({ must_reset_password: false }).eq("user_id", context.userId);
    return { ok: true };
  });

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  title: z.string().optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw) => updateProfileSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { getSupabaseAdmin } = await import("./supabase-admin.server");
    const admin = getSupabaseAdmin();

    // 1. Save on the profiles table without clobbering fields we were not given
    const patch: Record<string, unknown> = {
      user_id: context.userId,
      email: context.email,
      full_name: data.fullName,
    };
    if (data.title !== undefined && data.title !== "") patch['title'] = data.title;

    const { error: profErr } = await admin
      .from("profiles")
      .upsert(patch, { onConflict: "user_id" });
    if (profErr) throw new Error(profErr.message);

    // 2. Keep the school application record in sync (soft-fail: may not exist)
    try {
      const appPatch: Record<string, unknown> = { principal_name: data.fullName };
      if (data.title) appPatch['principal_title'] = data.title;
      await admin.from("school_applications").update(appPatch).eq("user_id", context.userId);
    } catch {
      /* soft-fail */
    }

    // 3. Always update auth user metadata — this works with the service role key
    //    and serves as a reliable source for the name when profiles can't be read
    try {
      await admin.auth.admin.updateUserById(context.userId, {
        user_metadata: { name: data.fullName, title: data.title },
      });
    } catch {
      /* soft-fail auth metadata update if admin key not available */
    }

    return { ok: true };
  });
