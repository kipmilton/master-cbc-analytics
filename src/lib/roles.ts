/** Client-safe role vocabulary shared by the UI and the server functions. */

export type AppRole =
  | "super_admin"
  | "principal"
  | "deputy_academic"
  | "deputy_admin"
  | "dean_academics"
  | "teacher"
  | "student";

/**
 * The four admin seats every school gets. They all carry identical rights —
 * only the title on screen differs.
 */
export const SCHOOL_ADMIN_ROLES = [
  "principal",
  "deputy_academic",
  "deputy_admin",
  "dean_academics",
] as const;

export type SchoolAdminRole = (typeof SCHOOL_ADMIN_ROLES)[number];

/** Roles a school admin may hand out. The principal seat comes from approval. */
export const ASSIGNABLE_STAFF_ROLES = [
  "deputy_academic",
  "deputy_admin",
  "dean_academics",
  "teacher",
] as const;

export const ROLE_TITLES: Record<AppRole, string> = {
  super_admin: "Platform Administrator",
  principal: "The Principal",
  deputy_academic: "Deputy Principal Academics",
  deputy_admin: "Deputy Principal Administration",
  dean_academics: "Dean of Academics",
  teacher: "Teacher",
  student: "Student",
};

export function isSchoolAdminRole(role: string | null | undefined): boolean {
  return (SCHOOL_ADMIN_ROLES as readonly string[]).includes(role ?? "");
}

export function roleLabel(role: string | null | undefined): string {
  if (!role || role === "unassigned") return "Awaiting approval";
  return ROLE_TITLES[role as AppRole] ?? role.replace(/_/g, " ");
}
