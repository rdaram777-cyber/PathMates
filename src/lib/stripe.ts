import Stripe from "stripe";

// ---- Constants ----

/** Platform commission percentage (30%) */
export const PLATFORM_COMMISSION_PERCENT = 30;

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

export function calculateCommission(amountCents: number): {
  platformFee: number;
  pathmateEarnings: number;
} {
  const platformFee = Math.round(
    amountCents * (PLATFORM_COMMISSION_PERCENT / 100),
  );
  const pathmateEarnings = amountCents - platformFee;
  return { platformFee, pathmateEarnings };
}

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
          currency: "usd",
          product_data: {
            name: `Video call with ${params.pathmateName}`,
            description:
              params.durationMinutes === 30
                ? "30-minute video call"
                : "60-minute video call",
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
