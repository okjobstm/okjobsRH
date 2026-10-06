import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Service-role client. The key bypasses RLS and grants full Storage access, so it
 * must never reach the browser bundle: only route handlers and server actions may
 * call this. A publishable key here would silently expose the CV bucket.
 */
export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY holds a publishable key, not a secret key"
    );
  }

  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return cached;
}