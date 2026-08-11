# PathMates — Technical Handover

**Version:** v1.0.0 (MVP production launch) · **Date:** 2026-08-11
**Purpose:** everything a new developer needs to own, operate, and change the PathMates platform without depending on the original team.

PathMates is a marketplace where Explorers book paid 1:1 video calls with
PathMates who have already achieved similar goals. The platform takes a 30%
commission per booking.

---

## 1. Access matrix

| Service | Account / identity | Role / ownership | Where to manage access |
|---|---|---|---|
| **GitHub** | Repo `rdaram777-cyber/PathMates` (owner account `rdaram777-cyber` — sole admin) | `main` branch = production; code is PUBLIC (see recommendations) | Repo → **Settings → Collaborators** (or **Manage access**). Add a person by GitHub username/email with `Write` (dev) or `Admin` (owner-level). |
| **Vercel** | Account `rdaram777@gmail.com` — **team owner**; team slug `pathmates` (teamId `team_yPlHQRH4wVpdI8lqPwSUittl`); project name `site` | Production hosting; deploy alias `https://site-virid-eight-86.vercel.app` | Dashboard → team `pathmates` → **Settings → Members** to invite people (Owner/Admin/Developer roles). Project settings under the `site` project. |
| **Supabase** | Project ref `qwbuqngstnwtbcigewtw` → dashboard `https://supabase.com/dashboard/project/qwbuqngstnwtbcigewtw` | Postgres + Auth + RLS; owned via the Supabase account of `rdaram777@gmail.com` | Supabase dashboard → project → **Settings → Team / Access tokens**. |
| **Razorpay** | Dashboard at `https://dashboard.razorpay.com` (login `rdaram777@gmail.com`, alert email same) | Payment gateway — **live keys** (`rzp_live_…`); webhook id `TOad8lrQYG7I49` | Dashboard → **Settings → API keys** (key pair + webhook secret) and **Settings → Webhooks** |

### Secrets locations (what lives where)

| Where | What it holds | Notes |
|---|---|---|
| Local file `/home/team/shared/site/.env` | All 7 secrets incl. `VERCEL_TOKEN` | **Never commit.** Used for local dev, DB dumps, deploys. |
| Vercel project env (project `site`) | All except `VERCEL_TOKEN` (6 vars) | Injected into the deployed SSR function at runtime. |
| Supabase platform | Project URL, anon key, service-role key (regenerable) | Dashboard → Settings → API. |
| Razorpay platform | Key ID, Key Secret, Webhook Secret | Dashboard → Settings → API keys / Webhooks. Only shown once for secrets — keep the master copy in a password manager. |
| `/home/team/shared/handover/` | Source tarball + DB backup of v1.0.0 | Team shared drive; **copy off-machine** (see recommendations). |

> **Golden rule:** never paste a secret *value* into docs, the repo, chat, or
> screenshots. Docs refer to variable names only. See `ENVIRONMENT.md` for
> how to rotate/regenerate every variable.

---

## 2. Repo map (quick start)

- `src/routes/` — file-based routes (TanStack Router): landing, search, profile,
  booking, admin, `api/razorpay-webhook`.
- `src/lib/` — domain logic + server functions (`bookings.ts`, `razorpay.ts`,
  `currency.ts`, `admin.ts`, `reviews.ts`, `experiences.ts`, `notifications.ts`,
  `supabase.server.ts`, `database.types.ts`, …).
- `src/components/` — shared UI (AdminShell, StarRating, LoadingSpinner, Skeleton).
- `supabase/migrations/` — 001–009 SQL migrations + combined `all-migrations.sql`
  (**authoritative** schema).
- `docs/` — this handover package.
- Deploy scripts: `go-live.sh`, `build-vercel.sh`, `vercel-entry.ts`, `publish.sh`.

See `ARCHITECTURE.md` for the full picture, `DEPLOYMENT.md` to ship changes,
`ENVIRONMENT.md` for env vars, `WEBHOOK.md` for the Razorpay webhook.

---

## 3. Where to get things (one-liners)

| Need | Where |
|---|---|
| Code | `git clone https://github.com/rdaram777-cyber/PathMates.git` |
| Live site | `https://site-virid-eight-86.vercel.app` |
| Vercel dashboard | `https://vercel.com/dashboard` (team `pathmates`) |
| Supabase dashboard | `https://supabase.com/dashboard/project/qwbuqngstnwtbcigewtw` |
| Razorpay dashboard | `https://dashboard.razorpay.com` |
| DB schema (authoritative) | `supabase/migrations/all-migrations.sql` in the repo |
| Source backup (v1.0.0) | `/home/team/shared/handover/pathmates-source-v1.0.0-2026-08-11.tar.gz` |
| DB backup (v1.0.0) | `/home/team/shared/handover/db-backup-2026-08-11/` |

---

## 4. Recommendations for the owner

1. **Make the GitHub repo private.** It is currently **public** (anyone can
   read the code). GitHub → repo → **Settings → General → Danger Zone →
   Change visibility → Private**. Do this soon; the code contains no secrets
   (verified) but the app logic, RLS policies, and API surface are business IP.
   Also: `index.html` (legacy prototype) contains a stale publishable/anon
   key (`sb_publishable_…`) — client-safe by design and not the current
   project's key, but scrub it from that file when convenient.
2. **Enable Supabase dashboard backups.** Dashboard → **Database → Backups**:
   enable **PITR (Point-in-Time Recovery)** for continuous archiving +
   hourly snapshots (paid plan). Manual JSON backups live in
   `/home/team/shared/handover/db-backup-2026-08-11/` (see `db-restore.md`).
3. **Store master copies of all secrets in a password manager** (1Password /
   Bitwarden / LastPass) owned by `rdaram777@gmail.com`: Supabase anon +
   service-role keys, Razorpay key id/secret/webhook secret, Vercel token.
   Platform dashboards can regenerate most of them, but the Razorpay webhook
   secret and Vercel token are only shown once.
4. **Add at least one more GitHub collaborator + Vercel team member** so the
   business is not dependent on a single person's account.
5. **Keep the handover folder current** — after each release, refresh the
   source tarball (tag → `git archive`) and the DB backup (`db-dump.sh`),
   and copy the folder off the shared machine.

---

## 5. Change workflow (how the team ships code)

1. Branch off `main`: `git checkout -b feature/<short-description>`
   (or `fix/<short-description>`).
2. Make the change; run `bunx tsc --noEmit` and `bun run build`.
3. Push and open a **PR** against `main`; the lead reviews and merges.
4. After merge, `bun run go-live` deploys production (see `DEPLOYMENT.md`).

Never commit `.env`; never commit generated build output (`.vercel/`,
`dist/`, `node_modules/` are ignored).

---

## 6. On-call quick checks

- Site down? `curl -I https://site-virid-eight-86.vercel.app` → expect 200.
- Payments broken? Check the Razorpay webhook is active (dashboard) and
  `RAZORPAY_WEBHOOK_SECRET` matches between Razorpay and Vercel (see `WEBHOOK.md`).
- DB issues? Supabase dashboard → **Table Editor**; schema in
  `supabase/migrations/`.
- Rollback a bad deploy? See `DEPLOYMENT.md` → Rollback.
