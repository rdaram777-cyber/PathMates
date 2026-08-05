import { createServerFn } from "@tanstack/react-start";
import { createSupabaseClient } from "~/db";
import Stripe from "stripe";

// ---- Constants ----

/** Fallback commission percentage if DB is unreachable */
export const DEFAULT_COMMISSION_PERCENT = 30;

// ---- Helpers ----

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — payments are not available yet.",
    );
  }
  return key;
}

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2025-06-30.acacia" as any,
    });
  }
  return _stripe;
}

// ---- Commission Calculation ----

/** Calculate platform fee and PathMate earnings from a given amount and commission percent */
export function calculateCommission(
  amountCents: number,
  commissionPercent: number,
): {
  platformFee: number;
  pathmateEarnings: number;
} {
  const platformFee = Math.round(
    amountCents * (commissionPercent / 100),
  );
  const pathmateEarnings = amountCents - platformFee;
  return { platformFee, pathmateEarnings };
}

/** Server fn: read the current commission percent from platform_settings, fall back to 30 */
export const getCommissionPercent = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    const sb = createSupabaseClient();
    const { data, error } = await sb
      .from("platform_settings")
      .select("value")
      .eq("key", "commission_percent")
      .maybeSingle();

    if (error || !data) return DEFAULT_COMMISSION_PERCENT;
    const parsed = parseInt(data.value, 10);
    return isNaN(parsed) ? DEFAULT_COMMISSION_PERCENT : parsed;
  },
);

// ---- Booking Data Types ----

export interface CreateCheckoutSessionParams {
  bookingId: string;
  explorerId: string;
  pathmateId: string;
  pathmateName: string;
  experienceId?: string | null;
  experienceTitle?: string;
  amountCents: number;
  platformFeeCents: number;
  pathmateEarningsCents: number;
  durationMinutes: number;
  /** ISO 4217 code, e.g. "INR" or "USD". Defaults to "usd". */
  currency?: string;
  successUrl: string;
  cancelUrl: string;
}

// ---- Stripe Checkout ----

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<{ sessionId: string; checkoutUrl: string }> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: (params.currency ?? "usd").toLowerCase(),
          product_data: {
            name: `Video call with ${params.pathmateName}`,
            description: `${params.durationMinutes}-minute video call`,
          },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      booking_id: params.bookingId,
      explorer_id: params.explorerId,
      pathmate_id: params.pathmateId,
      platform_fee_cents: String(params.platformFeeCents),
      pathmate_earnings_cents: String(params.pathmateEarningsCents),
      currency: (params.currency ?? "usd").toLowerCase(),
      ...(params.experienceId ? { experience_id: params.experienceId } : {}),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url!,
  };
}

// ---- Verify Session ----

export async function verifyStripeSession(
  sessionId: string,
): Promise<{ paymentStatus: string; metadata: Record<string, string> }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    paymentStatus: session.payment_status,
    metadata: session.metadata ?? {},
  };
}

// ---- Webhook Helpers ----

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set — webhook verification is not available.",
    );
  }
  return secret;
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
): Promise<Stripe.Event> {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    getStripeWebhookSecret(),
  );
}
