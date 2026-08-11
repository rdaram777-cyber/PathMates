# PathMates — Environment Variables

**No secret values are written in this file or anywhere in the repo.**
Every variable is listed with its purpose, where it is set, whether it is
sensitive, how to rotate it, and where to obtain it.

Master copies of all secrets live in `/home/team/shared/site/.env` (local,
never committed) and in the Vercel project env. **Copy them into a password
manager** (see `HANDOVER.md` → Recommendations).

---

## Variable table

| Variable | Purpose | Where set | Sensitive? | Rotate / regenerate | Where to obtain |
|---|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL; all Supabase clients build from it (client + server) | Local `.env` + Vercel project env | No (public) | Unchanged unless project moved | Supabase Dashboard → **Settings → API** → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key for browser/RLS-scoped access | Local `.env` + Vercel project env | No (public, but keep tidy) | Settings → API → **Roll anon key** | Supabase Dashboard → **Settings → API** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key; bypasses RLS (webhooks, admin fns, dumps). **Never ship to the client** | Local `.env` + Vercel project env | **YES** | Settings → API → **Roll service_role key** (update Vercel + `.env` together) | Supabase Dashboard → **Settings → API** |
| `RAZORPAY_KEY_ID` | Razorpay public key id sent to the Checkout modal (`rzp_live_…`) | Local `.env` + Vercel project env | No (client-facing by design) | Razorpay → **Settings → API keys** → Regenerate | Razorpay Dashboard → Settings → API keys |
| `RAZORPAY_KEY_SECRET` | Server-only secret for creating orders & verifying payments | Local `.env` + Vercel project env | **YES** | Settings → API keys → Regenerate (update both places) | Razorpay Dashboard → Settings → API keys (shown once) |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC-SHA256 signing secret for webhook verification; **must match the webhook's secret** | Local `.env` + Vercel project env | **YES** | Webhook edit → regenerate secret; update `.env` + Vercel, then save webhook | Razorpay Dashboard → Settings → Webhooks → edit `TOad8lrQYG7I49` |
| `VERCEL_TOKEN` | Deploy token for `bun run go-live` (CLI deploys). **Local only — never set on Vercel** | Local `.env` only | **YES** | Vercel → Account → **Tokens** → create new; delete old | Vercel Dashboard → Account settings → Tokens (shown once) |

---

## Where each value is set — summary

| Variable | `/home/team/shared/site/.env` | Vercel project env (`site`) |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | ✅ |
| `VITE_SUPABASE_ANON_KEY` | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ |
| `RAZORPAY_KEY_ID` | ✅ | ✅ |
| `RAZORPAY_KEY_SECRET` | ✅ | ✅ |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | ✅ |
| `VERCEL_TOKEN` | ✅ | ❌ (local deploys only) |

The first six are kept in sync with Vercel via `vercel-env-sync.sh`
(see `DEPLOYMENT.md`). Vercel env vars are read **at runtime** by the SSR
function (they are not inlined at build), so after changing them you must
redeploy (`bun run go-live`).

---

## Rotating a secret — safe sequence

1. Generate the new value in the platform dashboard.
2. Update the Vercel project env first (dashboard → project → Settings →
   Environment Variables, or `bash /home/team/shared/vercel-env-sync.sh`).
3. Redeploy (`bun run go-live`) and confirm the site + webhook still work.
4. Update the local `.env`, then rotate/delete the old value in the dashboard.
5. For `RAZORPAY_WEBHOOK_SECRET`: the **webhook's secret and the app env must
   match exactly** or every webhook will 400 (`WEBHOOK.md` → testing).

---

## Reading env vars in code

- Client-safe (Vite `import.meta.env` / process.env in server): `VITE_*`.
- Server-only secrets: `process.env.SUPABASE_SERVICE_ROLE_KEY`,
  `process.env.RAZORPAY_*` — accessed inside `createServerFn()` handlers or
  `src/routes/api/*` routes only, never in client components.
- The server-fn convention (and its `{ data: ... }` quirk) is documented in
  `ARCHITECTURE.md`.
