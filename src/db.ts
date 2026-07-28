import { neon } from "@neondatabase/serverless";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./lib/database.types";

/**
 * Neon serverless Postgres helper — keep for existing Neon usage.
 * Requires DATABASE_URL env var.
 */
export const sql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — connect a database (via the database card) before running queries.",
    );
  }
  return neon(url);
};

/**
 * Supabase server-side client factory.
 * Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (user-scoped).
 * For admin operations, pass { useServiceRole: true } — requires
 * SUPABASE_SERVICE_ROLE_KEY env var.
 */
export function createSupabaseClient(opts?: { useServiceRole?: boolean }) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = opts?.useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.VITE_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing VITE_SUPABASE_URL");
  if (!key) {
    const which = opts?.useServiceRole ? "SUPABASE_SERVICE_ROLE_KEY" : "VITE_SUPABASE_ANON_KEY";
    throw new Error(`Missing ${which}`);
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
