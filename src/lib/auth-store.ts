import { supabase } from "./supabase";
import { getMyProfile, clearMustResetPassword, type MyProfile, type AppRole } from "./me.functions";
import { SCHOOL_ADMIN_ROLES, isSchoolAdminRole, roleLabel } from "./roles";

export type { AppRole };
export { SCHOOL_ADMIN_ROLES, isSchoolAdminRole, roleLabel };

export interface AppUser {
  id: string;
  email: string;
  name: string;
  title?: string;
  role: AppRole | "unassigned";
  schoolId?: string;
  schoolName?: string;
  schoolStatus?: "pending" | "active" | "suspended";
  assignedStreams: string[];
  assignedSubjects: string[];
  classTeacherStreams: string[];
  accountStatus: "active" | "pending-approval";
  requiresPasswordReset: boolean;
  applicationStatus?: "pending" | "approved" | "rejected";
}

export function profileToAppUser(p: MyProfile): AppUser {
  const schoolAdmin = isSchoolAdminRole(p.role);
  // Nobody gets a workspace until they hold a role inside an active school.
  const pending =
    p.role === null ||
    p.applicationStatus === "pending" ||
    (p.role !== "super_admin" && p.schoolStatus !== "active");

  return {
    id: p.userId,
    email: p.email,
    name: p.name || p.email,
    title: p.title ?? (p.role ? roleLabel(p.role) : undefined),
    role: p.role ?? "unassigned",
    schoolId: p.schoolId ?? undefined,
    schoolName: p.schoolName ?? undefined,
    schoolStatus: p.schoolStatus ?? undefined,
    assignedStreams: p.assignedStreamIds,
    assignedSubjects: p.assignedSubjectIds,
    classTeacherStreams: p.classTeacherStreamIds,
    accountStatus: pending && !schoolAdmin ? "pending-approval" : pending ? "pending-approval" : "active",
    requiresPasswordReset: p.mustResetPassword,
    applicationStatus: p.applicationStatus ?? undefined,
  };
}

export async function loadCurrentUser(): Promise<AppUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  try {
    return profileToAppUser(await getMyProfile());
  } catch (err) {
    console.error("Failed to load profile", err);
    return null;
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: AppUser | null; errorMessage: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.session) {
    const msg = error?.message ?? "Sign in failed";
    const friendly = /invalid login/i.test(msg)
      ? "The email or password is incorrect."
      : /confirm/i.test(msg)
        ? "Please confirm your email before signing in."
        : /fetch|network/i.test(msg)
          ? "We could not reach the authentication service. Check your connection and try again."
          : msg;
    return { user: null, errorMessage: friendly };
  }
  const user = await loadCurrentUser();
  return { user, errorMessage: user ? null : "We could not load your profile. Please try again." };
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    /* soft-fail */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("mastercbc:auth"));
}

export async function updateMyPassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  try {
    await clearMustResetPassword();
  } catch {
    /* soft-fail */
  }
  return { ok: true };
}

export function landingPathFor(role: AppUser["role"]) {
  if (role === "super_admin") return "/admin";
  if (isSchoolAdminRole(role)) return "/school";
  if (role === "teacher") return "/teacher";
  return "/pending-approval";
}
