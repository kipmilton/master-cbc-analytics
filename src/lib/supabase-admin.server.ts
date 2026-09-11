import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = "https://esctevanmqsauwzlzqfr.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY3RldmFubXFzYXV3emx6cWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzcyNjYsImV4cCI6MjA5ODQxMzI2Nn0.7TCVumtd4h8Pioup_3LTQsgmqqNo6avE2Os80n16ab0";

export function isServiceRoleConfigured(): boolean {
  const key =
    process.env.LIVE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && key.trim().length > 0);
}

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url =
    process.env.LIVE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL;

  const key =
    process.env.LIVE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL and Key not configured in environment variables.");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cached;
}
