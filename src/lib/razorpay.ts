import Razorpay from "razorpay";
import { createHmac } from "node:crypto";

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
