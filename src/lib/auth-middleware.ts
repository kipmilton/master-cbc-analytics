import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const requireAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { supabase } = await import("./supabase");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  })
  .server(async ({ next }) => {
    const auth = getRequestHeader("authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) throw new Response("Unauthorized", { status: 401 });
    const { getSupabaseAdmin } = await import("./supabase-admin.server");
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data.user || !data.user.email) {
      throw new Response("Unauthorized", { status: 401 });
    }
    return next({
      context: {
        userId: data.user.id,
        email: data.user.email,
      },
    });
  });
