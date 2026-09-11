import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

export interface StaffRow {
  userId: string;
  role: string;
  name: string;
  title: string;
  email: string;
  mustResetPassword: boolean;
  streamIds: string[];
  subjectIds: string[];
  classTeacherStreamIds: string[];
}

export const createSchoolStaff = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw) =>
    z
      .object({
        role: z.enum(["deputy_academic", "deputy_admin", "dean_academics", "teacher"]),
        name: z.string().min(2),
        email: z.string().email(),
        title: z.string().default(""),
        tempPassword: z.string().min(8),
        streamIds: z.array(z.string().uuid()).default([]),
        subjectIds: z.array(z.string().uuid()).default([]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin } = await import("./tenant-guard.server");
    const { provisionStaff } = await import("./staff.server");
    return provisionStaff(await assertSchoolAdmin(context.userId), data);
  });

export const listSchoolStaff = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<StaffRow[]> => {
    const { assertSchoolMember } = await import("./tenant-guard.server");
    const { readStaff } = await import("./staff.server");
    return readStaff(await assertSchoolMember(context.userId));
  });

export const updateTeacherAssignments = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw) =>
    z
      .object({
        teacherId: z.string().uuid(),
        streamIds: z.array(z.string().uuid()).default([]),
        subjectIds: z.array(z.string().uuid()).default([]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin } = await import("./tenant-guard.server");
    const { setAssignments } = await import("./staff.server");
    return setAssignments(await assertSchoolAdmin(context.userId), data);
  });

export const removeSchoolStaff = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw) => z.object({ userId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { assertSchoolAdmin } = await import("./tenant-guard.server");
    const { detachStaff } = await import("./staff.server");
    return detachStaff(await assertSchoolAdmin(context.userId), data.userId);
  });
