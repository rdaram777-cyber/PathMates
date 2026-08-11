# PathMates — Architecture

## Stack

- **Framework:** TanStack Start (React 19 + SSR + Vite 7) — file-based routes
  under `src/routes/`, server functions with `createServerFn()`.
- **Language:** TypeScript (strict), package manager **bun**.
- **Styling:** Tailwind CSS v4 (`src/styles/app.css`, `@tailwindcss/vite`).
- **Database + Auth:** Supabase (Postgres, `auth.users`, RLS).
- **Payments:** Razorpay only — live keys, INR (paise) and USD (cents).
- **Hosting:** Vercel (Build Output API, one Node SSR function).

---

## Repo layout

```
src/
  routes/                  file-based routes (TanStack Router)
    index.tsx              landing page
    search.tsx             browse/search experiences
    login.tsx signup.tsx forgot-password.tsx verify-email.tsx
    profile/$userId.tsx    public profile
    profile/$userId/edit.tsx, availability/index.tsx
    experiences/$experienceId/index.tsx, edit.tsx
    book/$experienceId/index.tsx      booking page (tier picker + checkout)
    bookings/index.tsx, bookings/$bookingId/success.tsx
    call/$bookingId/index.tsx         meeting room page
    notifications.tsx
    share.tsx
    admin/                 admin panel (index, bookings, revenue, users, settings)
    api/razorpay-webhook.ts           webhook endpoint (HMAC verified)
  lib/
    supabase.server.ts     server Supabase client factory (anon/service-role)
    database.types.ts      generated types (supabase gen types)
    bookings.ts            booking server fns + createBooking flow
    razorpay.ts            Razorpay order creation + signature verification
    currency.ts            tier pricing, INR/USD detection
    admin.ts               admin/revenue server fns
    experiences.ts reviews.ts notifications.ts stripe.ts (legacy) auth.tsx theme.tsx
  components/              AdminShell, StarRating, LoadingSpinner, Skeleton
  db.ts                    createSupabaseClient() helper (request-aware)
supabase/migrations/       001–009 SQL migrations + combined all-migrations.sql
build-vercel.sh go-live.sh vercel-entry.ts serve.ts publish.sh   deploy tooling
```

---

## Data model (9 tables + legacy)

All tables are in `public`, all rows RLS-protected. Migrations 001–009 in
`supabase/migrations/` (`all-migrations.sql` = combined).

| Table | Purpose | Key relationships |
|---|---|---|
| `profiles` | One row per user (role: `explorer`/`pathmate`/`admin`), bio, skills, pricing, rating aggregates | `id → auth.users(id)`; created by `handle_new_user()` trigger |
| `categories` | Experience categories (16 seeded) | `experiences.category_id → categories.id` |
| `experiences` | PathMate story posts | `user_id → auth.users`; `category_id → categories` |
| `bookings` | A booked call; amount/fee split, payment fields, status (`pending/paid/completed/cancelled/refunded`) | `explorer_id`, `pathmate_id → auth.users`; `experience_id → experiences`; `razorpay_order_id`, `razorpay_payment_id`, `currency`, `payment_gateway` |
| `availability_slots` | Weekly recurring availability | `user_id → auth.users` |
| `reviews` | One review per completed booking | `booking_id → bookings (UNIQUE)`; `reviewer_id`, `pathmate_id → auth.users` |
| `platform_settings` | Key/value (e.g. `commission_percent = 30`) | — |
| `notifications` | In-app notifications | `user_id → auth.users` |
| `posts` | **Legacy prototype table** (not used by the current app) | — |

Relationships enforce cascade: deleting a user cascades their profile,
experiences, notifications; `reviews.booking_id` is unique (one review per
booking).

---

## Auth (Supabase + RLS)

- Supabase Auth (email/password) with the `@supabase/ssr` server client;
  session lives in cookies set through the server client's `setAll`.
- `handle_new_user()` trigger auto-creates a `profiles` row on signup.
- **Every table has RLS enabled.** Policies: owners manage their own rows,
  `authenticated` can read most public content, `anon` can read categories,
  `admin` role (checked via `profiles.role = 'admin'`) can read/update all
  bookings, update any profile, delete any experience, manage categories and
  platform settings.
- Server-side privileged operations use the **service-role key** which
  bypasses RLS (webhook handler, availability reads for booking, admin fns).
  It lives only in server env — never in client code.

---

## Payment flow (end-to-end)

1. Explorer picks a PathMate + a **duration tier** (15/30/45/60 min) on the
   booking page. Currency is auto-detected (`currency.ts`:
   `accept-language` on server / `navigator.language` on client → `INR` or
   `USD`; defaults USD).
2. `createBooking` (server fn, `bookings.ts`):
   - validates the tier and computes the amount **server-side** from
     `TIER_PRICING` (`currency.ts`) — a client-supplied amount is never
     trusted; 15→₹99/$2, 30→₹199/$4, 45→₹299/$6, 60→₹399/$8 (cents/paise).
   - reads `commission_percent` from `platform_settings` (30%) and stores
     `amount_cents`, `platform_fee_cents`, `pathmate_earnings_cents`.
   - inserts the booking as `status='pending'`, creates a **Razorpay order**
     (`createRazorpayOrder` — amount in paise/cents), returns
     `{ bookingId, orderId, keyId, amount, currency }`.
3. Client opens the **Razorpay Checkout modal** (keyId + orderId + amount +
   currency). Razorpay collects the payment.
4. Razorpay POSTs to `/api/razorpay-webhook` (`payment.captured` /
   `order.paid`). The handler verifies the HMAC-SHA256 signature
   (constant-time), then marks the booking `paid`, stores
   `razorpay_payment_id`, sets `meeting_url = /call/<bookingId>`, and
   notifies both parties. `payment.failed` → `cancelled` + notification.
5. Explorer lands on `/bookings/<id>/success`, then joins the call at
   `/call/<id>` at the scheduled time.

---

## Server-fn conventions (important quirks)

- All server-side logic that touches secrets/DB goes in `createServerFn()`
  handlers (from `@tanstack/react-start`) — they are stripped from the
  client bundle. Server-only modules use `.server.ts` or are only imported
  from handlers.
- **The `{ data: ... }` wrapper quirk:** when a compiled server fn is
  *called from other server code* (e.g. the webhook calls `createNotification`),
  the payload must be wrapped — `createNotification({ data: {...} })` —
  because the compiled server-fn RPC expects `{ data: payload }`. Calling it
  unwrapped silently fails or throws. Client-side `<ServerFn>` calls pass the
  payload directly; `.validator()`-parsed fns receive `{ data }` in the
  handler.
- DB access goes through `createSupabaseClient()` (`src/db.ts`), which is
  request-aware (reads cookies for the user session) and accepts
  `{ useServiceRole: true }`. Never build raw SQL on the client.
- Secret env vars are read at runtime via `process.env.*` inside handlers
  only (see `ENVIRONMENT.md`).

---

## Admin panel

Routes under `src/routes/admin/`, guarded by an admin-role check; UI shell in
`src/components/AdminShell.tsx`; data via `src/lib/admin.ts` server fns.

- `admin/index.tsx` — overview stats (users, bookings, revenue, pathmates).
- `admin/bookings.tsx` — all bookings with participants.
- `admin/revenue.tsx` — revenue/payout aggregates kept **separate per
  currency** (USD cents vs INR paise are never summed together).
- `admin/settings.tsx` — manage `platform_settings` (commission %).
- `admin/users.tsx` — user list (role management).

---

## Known gotchas

1. **`{ data: ... }` wrapper** for server-fn-to-server-fn calls (see above) —
   the #1 cause of "silently doesn't work" bugs.
2. **Env vars are read at runtime on Vercel** — deploy ≠ env; run
   `vercel-env-sync.sh` + redeploy after changing secrets.
3. **`/home/team/shared/all-migrations.sql` is stale** — it lacks migration
   007's 16-category seed + anon policy, 008, and 009. The repo's
   `supabase/migrations/all-migrations.sql` is authoritative.
4. **`database.types.ts` lags the live schema** in places (e.g.
   notifications) — the codebase casts to `any` where needed. Regenerate it
   (below) after schema changes and fix the fallout.
5. **Razorpay amounts are in smallest units** — paise for INR, cents for
   USD. The DB stores `amount_cents` for both; never mix them.
6. **Sandbox memory cap** — don't run the dev server and a production build
   at the same time; `bun run build` can be OOM-killed if memory is tight.
7. **`.env` must never be committed** — it is gitignored; `VERCEL_TOKEN`
   lives only there (deploy-time), never in Vercel project env.
8. **Meeting links are internal app routes** (`/call/<bookingId>`), not
   third-party video links — the "call" page is where the video would be
   embedded/joined.

---

## Common maintenance tasks

### Add a table or column

1. Add migration `supabase/migrations/010_<name>.sql`
   (`CREATE TABLE IF NOT EXISTS ...` + RLS policies; every table needs RLS).
2. Apply it in the Supabase dashboard → **SQL Editor** (or `supabase db push`
   if the CLI is linked).
3. Regenerate types (below), fix any type errors, `bunx tsc --noEmit`.
4. Update `supabase/migrations/all-migrations.sql` (re-append the migration).
5. PR → merge → `bun run go-live`.

### Regenerate `src/lib/database.types.ts`

```bash
# Needs the Supabase CLI + a project link or access token:
supabase gen types typescript \
  --project-id qwbuqngstnwtbcigewtw \
  --schema public > src/lib/database.types.ts
```
(Equivalent: Dashboard → Settings → API → **Generate TypeScript types**.)

### Run the checks / build

```bash
bunx tsc --noEmit   # type-check (must be 0 errors)
bun run build       # vite build
bun run dev         # local dev server
```

There is currently **no automated test suite** — verification is
type-check + build + manual QA (book a real ₹99/$2 test call).

### Backup

- Source: tag + `git archive` (see `HANDOVER.md` §4).
- DB: `bash /home/team/shared/handover/db-backup-<date>/db-dump.sh`
  (see `db-restore.md`).
