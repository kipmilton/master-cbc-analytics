import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import { users as seedUsers, type MockUser } from "./mock-data";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "school_admin" | "teacher";
  schoolId?: string;
  assignedStreams?: string[];
  title?: string;
  accountStatus?: "active" | "pending-approval";
  requiresPasswordReset?: boolean;
  temporaryPassword?: string;
}

const KEY = "mastercbc.session";
const USERS_KEY = "mastercbc.localUsers";

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

function getStoredUsers(): MockUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as MockUser[]) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(list: MockUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

function getAllUsers(): MockUser[] {
  const stored = getStoredUsers();
  const seen = new Set(stored.map((u) => u.id));
  return [...stored, ...seedUsers.filter((u) => !seen.has(u.id))];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toAppUser(user: MockUser): AppUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    assignedStreams: user.assignedStreams,
    title: user.title,
    accountStatus: user.accountStatus ?? "active",
    requiresPasswordReset: user.requiresPasswordReset ?? false,
    temporaryPassword: user.temporaryPassword,
  };
}

function getMockUser(email: string, password: string): MockUser | null {
  const normalizedEmail = normalizeEmail(email);
  return getAllUsers().find((u) => normalizeEmail(u.email) === normalizedEmail && u.password === password) ?? null;
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
    accountStatus: (metadata.accountStatus as AppUser["accountStatus"]) ?? "active",
    requiresPasswordReset: Boolean(metadata.requiresPasswordReset),
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

export async function refreshSessionFromSupabase(): Promise<AppUser | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const appUser = getAppUser(data.session.user);
      if (appUser) {
        saveStoredSession(appUser);
        return appUser;
      }
    }
  } catch {
    // ignore if there is no active Supabase session.
  }
  return null;
}

export function getSession(): AppUser | null {
  return getStoredSession();
}

export async function createManualTeacherAccount(input: {
  name: string;
  email: string;
  schoolId: string;
  password: string;
  assignedStreams?: string[];
  title?: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const metadata = {
    role: "teacher",
    name: input.name,
    schoolId: input.schoolId,
    assignedStreams: input.assignedStreams ?? [],
    title: input.title ?? "Teacher",
    accountStatus: "pending-approval",
    requiresPasswordReset: true,
  } as Record<string, unknown>;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: metadata,
      },
    });

    if (!error && data.user) {
      return toAppUser(data.user);
    }
  } catch {
    // allow fallback to local mock when Supabase call is unavailable or not configured.
  }

  const existing = getStoredUsers().find((u) => normalizeEmail(u.email) === normalizedEmail);
  const record: MockUser = {
    id: existing?.id ?? `local-${Date.now()}`,
    email: normalizedEmail,
    password: input.password,
    name: input.name,
    role: "teacher",
    schoolId: input.schoolId,
    assignedStreams: input.assignedStreams ?? [],
    title: input.title ?? "Teacher",
    accountStatus: "pending-approval",
    requiresPasswordReset: true,
    temporaryPassword: input.password,
  };
  const next = [...getStoredUsers().filter((u) => normalizeEmail(u.email) !== normalizedEmail), record];
  saveStoredUsers(next);
  return toAppUser(record);
}

export async function createSchoolAdminAccount(input: {
  name: string;
  email: string;
  schoolId: string;
  password: string;
  title: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const metadata = {
    role: "school_admin",
    name: input.name,
    title: input.title,
    schoolId: input.schoolId,
    accountStatus: "active",
    requiresPasswordReset: false,
  } as Record<string, unknown>;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: metadata,
      },
    });

    if (!error && data.user) {
      return toAppUser(data.user);
    }
  } catch {
    // allow fallback to local mock when Supabase call is unavailable or not configured.
  }

  const existing = getStoredUsers().find((u) => normalizeEmail(u.email) === normalizedEmail);
  const record: MockUser = {
    id: existing?.id ?? `local-${Date.now()}`,
    email: normalizedEmail,
    password: input.password,
    name: input.name,
    role: "school_admin",
    schoolId: input.schoolId,
    title: input.title,
    accountStatus: "active",
    requiresPasswordReset: false,
  };
  const next = [...getStoredUsers().filter((u) => normalizeEmail(u.email) !== normalizedEmail), record];
  saveStoredUsers(next);
  return toAppUser(record);
}

export async function updatePasswordForUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = getStoredUsers();
  const updated = users.map((u) =>
    normalizeEmail(u.email) === normalizedEmail
      ? { ...u, password, requiresPasswordReset: false, temporaryPassword: undefined, accountStatus: "active" }
      : u
  );
  saveStoredUsers(updated);

  let session = getStoredSession();
  if (session && normalizeEmail(session.email) === normalizedEmail) {
    const nextSession = { ...session, requiresPasswordReset: false, temporaryPassword: undefined, accountStatus: "active" };
    saveStoredSession(nextSession);
    window.dispatchEvent(new Event("mastercbc:auth"));
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password,
      data: {
        accountStatus: "active",
        requiresPasswordReset: false,
      },
    });

    if (!error && data.user) {
      const appUser = getAppUser(data.user);
      if (appUser) {
        saveStoredSession(appUser);
        window.dispatchEvent(new Event("mastercbc:auth"));
      }
    }
  } catch {
    // ignore Supabase update failures, local mock fallback remains.
  }
}

export async function signIn(email: string, password: string): Promise<{ user: AppUser | null; errorMessage: string | null }> {
  console.log("signIn start", { email, password });
  const mockUser = getMockUser(email, password);
  console.log("mockUser lookup", { mockUser });
  if (mockUser) {
    const appUser = toAppUser(mockUser);
    saveStoredSession(appUser);
    console.log("mock auth session saved", appUser);
    window.dispatchEvent(new Event("mastercbc:auth"));
    return { user: appUser, errorMessage: null };
  }

  try {
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
  } catch (error) {
    return { user: null, errorMessage: getFriendlyAuthError(error) };
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore mock-mode sign-out issues.
  }
  clearStoredSession();
  window.dispatchEvent(new Event("mastercbc:auth"));
}

export function landingPathFor(role: AppUser["role"]) {
  if (role === "super_admin") return "/admin";
  if (role === "school_admin") return "/school";
  return "/teacher";
}
