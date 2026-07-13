import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.LIVE_SUPABASE_URL;
  const key = process.env.LIVE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("LIVE_SUPABASE_URL / LIVE_SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cached;
}
