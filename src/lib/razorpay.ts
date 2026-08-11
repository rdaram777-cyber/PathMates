import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay server helpers — used for ALL payments (INR and USD).
 * IMPORTANT: This module is server-only. It must never be imported from
 * client components directly (only from `createServerFn` handler code, which
 * TanStack Start strips from the client bundle).
 *
 * The owner has NOT configured Razorpay keys yet — every function throws a
 * clear, actionable error when the keys are missing instead of failing
 * cryptically mid-payment.
 */

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

function getRazorpayConfig(): { key_id: string; key_secret: string } {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay is not configured yet (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set). " +
        "INR payments are disabled until the owner adds the keys to the server environment.",
    );
  }
  return { key_id, key_secret };
}

let _razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!_razorpay) {
    const { key_id, key_secret } = getRazorpayConfig();
    _razorpay = new Razorpay({ key_id, key_secret });
  }
  return _razorpay;
}

/** Public key id — safe to send to the browser for the Razorpay Checkout modal. */
export function getRazorpayKeyId(): string {
  return getRazorpayConfig().key_id;
}

/**
 * Create a Razorpay order. Razorpay takes the amount in the currency's
 * smallest unit — paise for INR (1 INR = 100 paise) and cents for USD —
 * which is the same unit as our `amount_cents` for both currencies.
 */
export async function createRazorpayOrder(
  amountCents: number,
  bookingId: string,
  currency: string = "INR",
): Promise<RazorpayOrderResult> {
  const order = await getRazorpay().orders.create({
    amount: amountCents,
    currency: currency, // "INR" or "USD"
    receipt: bookingId,
  });

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt ?? bookingId,
    status: order.status,
  };
}

/**
 * Verify the payment signature returned by the Razorpay Checkout modal.
 * The signature is an HMAC-SHA256 of `orderId|paymentId` signed with the
 * Razorpay key secret. A match proves the payment was genuinely processed
 * by Razorpay for this order.
 */
export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const { key_secret } = getRazorpayConfig();
  const expected = createHmac("sha256", key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

/**
 * Webhook secret used to verify the `x-razorpay-signature` header on
 * Razorpay webhook requests. Server-only — never expose this to the client.
 * This is a SEPARATE secret from the key secret, configured in the Razorpay
 * dashboard under Settings → Webhooks.
 */
export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "Razorpay webhooks are not configured yet (RAZORPAY_WEBHOOK_SECRET is not set). " +
        "Add the webhook secret to the server environment to enable webhook verification.",
    );
  }
  return secret;
}

/**
 * Verify the `x-razorpay-signature` header on a Razorpay webhook request.
 * The signature is an HMAC-SHA256 of the RAW request body keyed with the
 * webhook secret. Always verify against the exact raw body text received —
 * never a re-serialized JSON object, or the HMAC will not match.
 * Uses a constant-time comparison to avoid timing attacks.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = getRazorpayWebhookSecret();
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(signature ?? "", "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
