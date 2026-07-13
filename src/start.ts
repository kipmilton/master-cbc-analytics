import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // Let Response throws (401/403) bubble through unchanged
    if (error instanceof Response) throw error;
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Attach the current Supabase access token to every server-fn call so that
// server-side middleware (requireAuth) can validate the caller.
const attachSupabaseBearer = createMiddleware({ type: "function" }).client(async ({ next }) => {
  if (typeof window === "undefined") return next();
  try {
    const { supabase } = await import("./lib/supabase");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) return next({ headers: { Authorization: `Bearer ${token}` } });
  } catch {
    // no session — the server middleware will reject if the fn requires auth
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachSupabaseBearer],
}));
