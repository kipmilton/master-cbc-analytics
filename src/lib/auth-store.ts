import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "school_admin" | "teacher";
  schoolId?: string;
  assignedStreams?: string[];
  title?: string;
}

const KEY = "mastercbc.session";

function getStoredSession(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

function saveStoredSession(user: AppUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

function getAppUser(user: User | null): AppUser | null {
  if (!user) return null;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const role = metadata.role as AppUser["role"] | undefined;
  const assignedStreams = Array.isArray(metadata.assignedStreams)
    ? (metadata.assignedStreams as string[])
    : undefined;

  if (!user.email || !role) return null;

  return {
    id: user.id,
    email: user.email,
    name: (metadata.name as string) ?? user.email,
    role,
    schoolId: metadata.schoolId as string | undefined,
    assignedStreams,
    title: metadata.title as string | undefined,
  };
}

function getFriendlyAuthError(error: unknown): string | null {
  if (!error) return null;

  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : String(error);

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "The email or password is incorrect. If you just signed up, check your email and confirm the account first.";
  }

  if (normalized.includes("email not confirmed") || normalized.includes("confirm your email")) {
    return "Please confirm your email before signing in.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return message || "We could not sign you in right now. Please try again.";
}

export function getSession(): AppUser | null {
  return getStoredSession();
}

export async function signIn(email: string, password: string): Promise<{ user: AppUser | null; errorMessage: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.user) {
    console.error("Supabase sign in failed", error);
    return { user: null, errorMessage: getFriendlyAuthError(error) };
  }

  const appUser = getAppUser(data.session.user);
  if (!appUser) {
    return { user: null, errorMessage: "We could not load your account details. Please try again." };
  }

  saveStoredSession(appUser);
  window.dispatchEvent(new Event("mastercbc:auth"));
  return { user: appUser, errorMessage: null };
}

export async function signOut() {
  await supabase.auth.signOut();
  clearStoredSession();
  window.dispatchEvent(new Event("mastercbc:auth"));
}

export function landingPathFor(role: AppUser["role"]) {
  if (role === "super_admin") return "/admin";
  if (role === "school_admin") return "/school";
  return "/teacher";
}
