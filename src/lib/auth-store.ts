import { users, type MockUser } from "./mock-data";

const KEY = "mastercbc.session";

export function getSession(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function signIn(email: string, password: string): MockUser | null {
  const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
  if (!u) return null;
  localStorage.setItem(KEY, JSON.stringify(u));
  window.dispatchEvent(new Event("mastercbc:auth"));
  return u;
}

export function signOut() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("mastercbc:auth"));
}

export function landingPathFor(role: MockUser["role"]) {
  if (role === "super_admin") return "/admin";
  if (role === "school_admin") return "/school";
  return "/teacher";
}
