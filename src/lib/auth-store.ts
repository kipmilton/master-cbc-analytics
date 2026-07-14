import { supabase } from "./supabase";
import { getMyProfile, clearMustResetPassword, type MyProfile, type AppRole, SCHOOL_ADMIN_ROLES } from "./me.functions";

export type { AppRole };
export { SCHOOL_ADMIN_ROLES };

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
  accountStatus: "active" | "pending-approval";
  requiresPasswordReset: boolean;
  applicationStatus?: "pending" | "approved" | "rejected";
}

export function isSchoolAdminRole(role: AppUser["role"]): boolean {
  return role === "principal" || role === "deputy_academic" || role === "deputy_admin";
}

export function profileToAppUser(p: MyProfile): AppUser {
  const isSchoolAdmin = p.role ? SCHOOL_ADMIN_ROLES.includes(p.role) : false;
  const pending =
    (p.role === null && p.applicationStatus !== "approved") ||
    p.applicationStatus === "pending" ||
    (isSchoolAdmin && p.schoolStatus !== "active");
  return {
    id: p.userId,
    email: p.email,
    name: p.name || p.email,
    title: p.title ?? undefined,
    role: p.role ?? "unassigned",
    schoolId: p.schoolId ?? undefined,
    schoolName: p.schoolName ?? undefined,
    schoolStatus: p.schoolStatus ?? undefined,
    assignedStreams: p.assignedStreamIds,
    assignedSubjects: p.assignedSubjectIds,
    accountStatus: pending ? "pending-approval" : "active",
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

export async function signIn(email: string, password: string): Promise<{ user: AppUser | null; errorMessage: string | null }> {
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
        : msg;
    return { user: null, errorMessage: friendly };
  }
  const user = await loadCurrentUser();
  return { user, errorMessage: user ? null : "We could not load your profile. Please try again." };
}

export async function signOut() {
  try { await supabase.auth.signOut(); } catch { /* soft-fail */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("mastercbc:auth"));
}

export async function updateMyPassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  try { await clearMustResetPassword(); } catch { /* soft-fail */ }
  return { ok: true };
}

export function landingPathFor(role: AppUser["role"]) {
  if (role === "super_admin") return "/admin";
  if (role === "principal" || role === "deputy_academic" || role === "deputy_admin") return "/school";
  if (role === "teacher") return "/teacher";
  return "/pending-approval";
}
