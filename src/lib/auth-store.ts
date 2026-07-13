import { supabase } from "./supabase";
import { getMyProfile, clearMustResetPassword, type MyProfile, type AppRole } from "./me.functions";

export type { AppRole };

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

export function profileToAppUser(p: MyProfile): AppUser {
  const pending =
    p.applicationStatus === "pending" ||
    (p.role === null && p.applicationStatus !== "approved") ||
    (p.role === "school_admin" && p.schoolStatus !== "active");
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
    const profile = await getMyProfile();
    return profileToAppUser(profile);
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
  try { await supabase.auth.signOut(); } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mastercbc:auth"));
  }
}

export async function updateMyPassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  try { await clearMustResetPassword(); } catch { /* soft-fail */ }
  return { ok: true };
}

export function landingPathFor(role: AppUser["role"]) {
  if (role === "super_admin") return "/admin";
  if (role === "school_admin") return "/school";
  if (role === "teacher") return "/teacher";
  return "/pending-approval";
}
