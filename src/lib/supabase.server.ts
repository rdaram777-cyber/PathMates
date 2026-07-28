import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { Database } from "./database.types";

const supabaseUrl = () => {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) throw new Error("Missing VITE_SUPABASE_URL");
  return url;
};

const supabaseAnonKey = () => {
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing VITE_SUPABASE_ANON_KEY");
  return key;
};

/**
 * Create a server-side Supabase client from incoming request cookies.
 * Use inside createServerFn handlers for user-scoped operations.
 *
 * Note: TanStack Start passes the request via getWebRequest() or
 * by importing from @tanstack/react-start. Use this factory when
 * you have access to the raw Request object.
 */
export function createSupabaseServerClient(request: Request) {
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookies) {
        // SSR clients can't set cookies on the response from here;
        // use the route-level cookie helpers instead for mutations.
        // This is used for read-only auth checks.
      },
    },
  });
}

/**
 * Server-side admin client — uses the service_role key for privileged operations.
 * Only available server-side. Requires SUPABASE_SERVICE_ROLE_KEY env var.
 * Use sparingly: bypasses RLS entirely.
 */
export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — admin operations are not available yet.",
    );
  }
  return createServerClient<Database>(supabaseUrl(), key, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
