import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "./auth-middleware";

export type AppRole =
  | "super_admin"
  | "principal"
  | "deputy_academic"
  | "deputy_admin"
  | "teacher"
  | "student";

export const SCHOOL_ADMIN_ROLES: AppRole[] = ["principal", "deputy_academic", "deputy_admin"];

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
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<MyProfile> => {
    const { getSupabaseAdmin } = await import("./supabase-admin.server");
    const admin = getSupabaseAdmin();
    const uid = context.userId;

    const [{ data: profile }, { data: app }] = await Promise.all([
      admin
        .from("profiles")
        .select("full_name,title,role,school_id,must_reset_password")
        .eq("user_id", uid)
        .maybeSingle(),
      admin.from("school_applications").select("status").eq("user_id", uid).maybeSingle(),
    ]);

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
    if (profile?.role === "teacher" && profile.school_id) {
      const { data: asg } = await admin
        .from("teacher_assignments")
        .select("stream_id,subject_id")
        .eq("teacher_id", uid);
      assignedStreamIds = Array.from(new Set((asg ?? []).map((a) => a.stream_id).filter(Boolean))) as string[];
      assignedSubjectIds = Array.from(new Set((asg ?? []).map((a) => a.subject_id).filter(Boolean))) as string[];
    }

    return {
      userId: uid,
      email: context.email,
      name: profile?.full_name ?? context.email,
      title: profile?.title ?? null,
      role: (profile?.role as AppRole | undefined) ?? null,
      schoolId: profile?.school_id ?? null,
      schoolName,
      schoolStatus,
      mustResetPassword: profile?.must_reset_password ?? false,
      applicationStatus: (app?.status as MyProfile["applicationStatus"]) ?? null,
      assignedStreamIds,
      assignedSubjectIds,
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
