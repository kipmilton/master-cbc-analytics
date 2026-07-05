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

export function getSession(): AppUser | null {
  return getStoredSession();
}

export async function signIn(email: string, password: string): Promise<AppUser | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.user) {
    console.error("Supabase sign in failed", error?.message ?? error);
    return null;
  }

  const appUser = getAppUser(data.session.user);
  if (!appUser) {
    return null;
  }

  saveStoredSession(appUser);
  window.dispatchEvent(new Event("mastercbc:auth"));
  return appUser;
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
