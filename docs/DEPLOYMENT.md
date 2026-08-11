# PathMates — Deployment & Rollback

Production is **Vercel** (project `site`, team `pathmates`). The live URL is
`https://site-virid-eight-86.vercel.app`. Deploys are done from the shared
workspace (`/home/team/shared/site`) using the Vercel CLI with a local
`VERCEL_TOKEN` (see `ENVIRONMENT.md`).

---

## Prerequisites

- `bun` installed.
- `/home/team/shared/site/.env` present with the 7 variables (see `ENVIRONMENT.md`).
- Network access to GitHub + Vercel (the deploy token is read from `.env`).

---

## Full deploy (from clean clone)

```bash
# 1. Get the code
git clone https://github.com/rdaram777-cyber/PathMates.git
cd PathMates

# 2. Install dependencies (bun.lock is committed — lockfile-exact)
bun install

# 3. Type-check (must pass with 0 errors)
bunx tsc --noEmit

# 4. Production build (vite build → dist/)
bun run build

# 5. Deploy to Vercel production
#    go-live.sh: runs build-vercel.sh (Build Output API bundle) then
#    `bunx vercel deploy --prebuilt --prod --name site --scope pathmates`.
#    VERCEL_TOKEN is read from the environment — export it or source .env.
set -a; source .env; set +a   # or: export $(grep -v '^#' .env | xargs)
bun run go-live
# → prints: LIVE: https://<alias>.vercel.app
```

`bun run go-live` builds `.vercel/output` (Build Output API v3) and deploys
with `--prebuilt`, so Vercel's own build step is skipped. The alias
`site-virid-eight-86.vercel.app` keeps serving the latest production deploy.

> **Env vars are read at runtime by the SSR function.** Deploying does not
> carry the values — see next section.

---

## Syncing environment variables to Vercel

Vercel's project env must hold the six runtime vars
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).
`VERCEL_TOKEN` is **not** synced (deploy-only).

```bash
# One command — reads /home/team/shared/site/.env, upserts into project "site"
VERCEL_TOKEN=$(grep '^VERCEL_TOKEN=' /home/team/shared/site/.env | cut -d= -f2-)
bash /home/team/shared/vercel-env-sync.sh [/path/to/.env]

# Always redeploy after syncing so the running function picks up the values:
bun run go-live
```

The script resolves the team id from the token (fallback `teamId`):
`team_yPlHQRH4wVpdI8lqPwSUittl` / scope `pathmates`.

---

## Rollback

### Option A — Vercel dashboard (fastest, no code change)

1. Vercel Dashboard → team `pathmates` → project **site** → **Deployments**.
2. Find the last known-good deployment.
3. Click the **⋮** menu → **Promote to Production** (or **Redeploy**).
4. Confirm. The alias points at the promoted deployment within seconds.

### Option B — git revert + redeploy (code stays consistent with deploy)

```bash
# On a fresh branch from main:
git checkout -b fix/rollback-<date>
git revert <bad-commit-sha>          # or: git revert v1.0.0..<bad>
bunx tsc --noEmit && bun run build   # verify
git push origin fix/rollback-<date>  # open PR, merge to main
# then deploy:
set -a; source .env; set +a
bun run go-live
```

### Option C — redeploy a known-good tag

```bash
git checkout v1.0.0            # or any release tag
bun install
bun run go-live                # deploys exactly that tag's code
```

---

## Custom domain

1. Vercel Dashboard → project `site` → **Settings → Domains** → **Add**.
2. Add your domain (e.g. `pathmates.com`); Vercel shows DNS records to add at
   your registrar (A/ALIAS/CNAME as instructed). `vercel.app` sites get a
   free TLS cert; custom domains get one automatically too.
3. **Update the Razorpay webhook URL** to the new origin:
   Razorpay Dashboard → Settings → Webhooks → edit `TOad8lrQYG7I49` →
   URL → `https://<your-domain>/api/razorpay-webhook` → save.
   Keep the events and secret unchanged (see `WEBHOOK.md`).

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Deploy succeeds but site 500s | Server env missing → run `vercel-env-sync.sh`, redeploy |
| `LIVE:` line missing from go-live | Token invalid/expired → regenerate Vercel token in `.env` |
| Webhook deliveries 400 | `RAZORPAY_WEBHOOK_SECRET` mismatch (app vs Razorpay) → `WEBHOOK.md` |
| `bun run build` OOM/killed | Workspace memory cap → stop dev server first, retry; do not parallelize builds |
| `Blocked request` / `DisallowedHost` | Host allowlist on the app — disable it or add the Vercel alias |
