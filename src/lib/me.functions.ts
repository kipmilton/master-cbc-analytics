import { createServerFn } from "@tanstack/react-start";
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
