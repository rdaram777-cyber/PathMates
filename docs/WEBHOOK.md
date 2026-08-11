# PathMates — Razorpay Webhook

The Razorpay webhook is what confirms payments: it marks bookings paid,
generates the meeting link, and cancels bookings on payment failure. If it
stops working, paid bookings stay `pending` forever — treat it as critical
infrastructure.

---

## Current configuration (verified 2026-08-11)

| Setting | Value |
|---|---|
| Webhook ID | `TOad8lrQYG7I49` |
| URL | `https://site-virid-eight-86.vercel.app/api/razorpay-webhook` |
| Events enabled | `payment.captured`, `order.paid`, `payment.failed` |
| Status | **Active** |
| Secret | Set (must equal `RAZORPAY_WEBHOOK_SECRET` in the app env) |
| Alert email | `rdaram777@gmail.com` |
| Keys | **Live** production keys (`rzp_live_…`) — not test mode |

The endpoint lives at `src/routes/api/razorpay-webhook.ts` (TanStack Start
API route, deployed as part of the Vercel function).

---

## How verification works (in code)

1. The handler reads the **raw request body as text** — the HMAC must be
   computed over the exact bytes Razorpay signed, so it is never
   parsed/transformed first.
2. It takes the `x-razorpay-signature` header and verifies:
   - `expected = HMAC-SHA256(secret, rawBody)` hex digest
     (`crypto.createHmac("sha256", secret)`), where `secret` is
     `RAZORPAY_WEBHOOK_SECRET`.
   - Lengths must match, then a **constant-time compare**
     (`crypto.timingSafeEqual`) — no early-exit comparison.
3. Invalid/missing signature → **400** with no side effects.
4. Valid signature → parse JSON, then handle events **idempotently**:
   - `payment.captured` / `order.paid` → look up the booking by
     `razorpay_order_id`; if found and not already paid, set
     `status='paid'`, `razorpay_payment_id`, and
     `meeting_url=/call/<bookingId>`; create a notification. Already-paid or
     unknown order → ack 200 without re-processing.
   - `payment.failed` → set `status='cancelled'`, notify the Explorer.

Implementation: `src/lib/razorpay.ts` → `verifyRazorpayWebhookSignature()`;
handler: `src/routes/api/razorpay-webhook.ts`.

---

## Testing the webhook locally

Send requests to the production endpoint (or a local dev copy) with `curl`.

**1. Unsigned request → must be 400:**

```bash
curl -i -X POST https://site-virid-eight-86.vercel.app/api/razorpay-webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.captured","payload":{}}'
# expect: HTTP/1.1 400 {"error":"Invalid webhook signature"}
```

**2. Correctly signed request → must be 200:**

```bash
SECRET=<RAZORPAY_WEBHOOK_SECRET value>
BODY='{"event":"payment.captured","payload":{}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}')
curl -i -X POST https://site-virid-eight-86.vercel.app/api/razorpay-webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: $SIG" \
  -d "$BODY"
# expect: 200 (with an empty/unknown order it acks idempotently)
```

(For a full happy-path test you would use a real captured event from the
Razorpay dashboard → Settings → Webhooks → **Send test webhook**.)

---

## Updating the webhook

### Via dashboard (recommended)

Razorpay Dashboard → **Settings → Webhooks** → edit `TOad8lrQYG7I49`:

- **URL** — change if the site moves to a custom domain (see `DEPLOYMENT.md`).
- **Events** — keep `payment.captured`, `order.paid`, `payment.failed`.
- **Secret** — you can regenerate it here; **it must then be updated in the
  app env too** (`.env` + Vercel, then redeploy). Mismatch = all webhooks 400.

### Via API

```bash
# List webhooks to get the id (already known: TOad8lrQYG7I49)
curl -s https://api.razorpay.com/v1/webhooks \
  -u "$RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET"
# Update (example: new URL + same events + same secret)
curl -s -X PATCH https://api.razorpay.com/v1/webhooks/TOad8lrQYG7I49 \
  -u "$RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
        "url": "https://site-virid-eight-86.vercel.app/api/razorpay-webhook",
        "events": ["payment.captured","order.paid","payment.failed"],
        "secret": "<same as RAZORPAY_WEBHOOK_SECRET>",
        "status": "active"
      }'
```

---

## Operational notes

- **Never log the raw body or the secret.** The body contains payment data;
  the secret grants signature forgery.
- Webhook deliveries that fail are retried by Razorpay with backoff — check
  the **Webhooks → Recent deliveries** tab when investigating a stuck booking.
- Keep the dashboard secret and `RAZORPAY_WEBHOOK_SECRET` in lockstep; store
  the master value in the password manager (`ENVIRONMENT.md`).
- If the domain changes, update the webhook URL **before** cutting over DNS,
  then verify with the signed-curl test above.
