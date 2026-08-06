import { neon } from "@neondatabase/serverless";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { getRequest, getResponse } from "@tanstack/react-start/server";
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

/** Serialize a Set-Cookie header value (cookie attrs only, no leading name=value). */
function serializeCookieAttrs(options: CookieOptions): string {
  const parts: string[] = [];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.priority) parts.push(`Priority=${options.priority}`);
  return parts.join("; ");
}

/**
 * Supabase server-side client factory.
 *
 * Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (user-scoped).
 * For admin operations, pass { useServiceRole: true } — requires
 * SUPABASE_SERVICE_ROLE_KEY env var.
 *
 * When called inside a server function handler or an SSR render, the client
 * reads the caller's session cookies from the current request so that
 * `sb.auth.getUser()` resolves the logged-in user (and RLS applies). Outside
 * a request context (or with the service role) it degrades to a cookie-less
 * client.
 */
export function createSupabaseClient(opts?: { useServiceRole?: boolean }) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = opts?.useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.VITE_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing VITE_SUPABASE_URL");
  if (!key) {
    const which = opts?.useServiceRole
      ? "SUPABASE_SERVICE_ROLE_KEY"
      : "VITE_SUPABASE_ANON_KEY";
    throw new Error(`Missing ${which}`);
  }

  // Resolve the current request (server fn handler / SSR). getRequest() throws
  // when no request is in flight — fall back to cookie-less public mode.
  let request: Request | null = null;
  try {
    request = getRequest();
  } catch {
    request = null;
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        if (opts?.useServiceRole || !request) return [];
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        if (opts?.useServiceRole) return;
        if (typeof document !== "undefined") return; // browser guard
        try {
          const response = getResponse();
          for (const { name, value, options } of cookiesToSet) {
            const attr = serializeCookieAttrs(options);
            response.headers.append(
              "Set-Cookie",
              attr ? `${name}=${value}; ${attr}` : `${name}=${value}`,
            );
          }
        } catch {
          // No response context — nothing to attach cookies to.
        }
      },
    },
  });
}
