// ---- Currency detection & fixed tier pricing ----
// Pricing is platform-wide and fixed. The only variable is the currency:
// Indian users pay in INR (₹), everyone else pays in USD ($).
// The per-PathMate `hourly_rate` column is intentionally NOT used for pricing.

export type CurrencyCode = "INR" | "USD";
export type TierDuration = 15 | 30 | 45 | 60;

// Fixed platform-wide tier pricing, in cents.
// (Stripe treats both INR and USD as two-decimal currencies, so cents = unit_amount.)
export const TIER_PRICING: Record<TierDuration, { inr: number; usd: number }> = {
  15: { inr: 9900, usd: 200 }, // ₹99 / $2
  30: { inr: 19900, usd: 400 }, // ₹199 / $4
  45: { inr: 29900, usd: 600 }, // ₹299 / $6
  60: { inr: 39900, usd: 800 }, // ₹399 / $8
};

export const TIER_DURATIONS: TierDuration[] = [15, 30, 45, 60];

// Locales that signal the user is in India. `en-IN` (Indian English) and
// `hi` (Hindi) are the primary signals; the major Indian languages are
// included as additional strong signals.
const INDIA_LOCALE_PATTERN =
  /\b(?:en-IN|hi(?:-IN)?|mr|ta|te|kn|ml|gu|bn|pa|as|or)\b/i;

function localeIsIndian(locale: string): boolean {
  return INDIA_LOCALE_PATTERN.test(locale);
}

// Simple detection: check if the user is in India.
// Accepts an optional Request (server-side) and falls back to
// navigator.language (client-side). Defaults to USD — INR only on a strong India signal.
export function isIndianUser(request?: Request): boolean {
  if (request) {
    const acceptLanguage = request.headers.get("accept-language") ?? "";
    return localeIsIndian(acceptLanguage);
  }
  if (typeof navigator !== "undefined") {
    return localeIsIndian(navigator.language);
  }
  return false;
}

export function getUserCurrency(request?: Request): {
  code: CurrencyCode;
  symbol: string;
} {
  return isIndianUser(request)
    ? { code: "INR", symbol: "₹" }
    : { code: "USD", symbol: "$" };
}

/** Validate a currency code coming from the client. */
export function isSupportedCurrency(code: string | undefined): code is CurrencyCode {
  return code === "INR" || code === "USD";
}

/** Price (in cents) for a tier in the given currency. Throws on invalid duration. */
export function getTierPriceCents(duration: number, currency: CurrencyCode): number {
  const tier = TIER_PRICING[duration as TierDuration];
  if (!tier) {
    throw new Error(`Invalid session duration: ${duration} minutes.`);
  }
  return currency === "INR" ? tier.inr : tier.usd;
}

/** Format a tier price for display, e.g. "₹99" or "$2". */
export function formatTierPrice(duration: number, currency: { code: CurrencyCode; symbol: string }): string {
  const cents = getTierPriceCents(duration, currency.code);
  const value = cents / 100;
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${currency.symbol}${formatted}`;
}

/** Currency symbol for a booking's currency column ("INR" | "USD"). Defaults to "$". */
export function currencySymbol(code: string | null | undefined): string {
  return code === "INR" ? "₹" : "$";
}

/**
 * Format an arbitrary amount (in cents) for display using the currency code
 * stored on the booking, e.g. formatAmountCents(9900, "INR") → "₹99".
 * Falls back to USD for unknown/legacy rows.
 */
export function formatAmountCents(
  cents: number,
  code: string | null | undefined,
): string {
  const symbol = currencySymbol(code);
  const value = cents / 100;
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${symbol}${formatted}`;
}
