import { siteUrl } from "./site";
import { formatAmountCents } from "./currency";

/**
 * Transactional email via Resend.
 *
 * Server-only module. Calls the Resend HTTP API directly (plain `fetch`, no
 * npm dependency) with the send-only `RESEND_API_KEY`.
 *
 * EMERGENCY CONTRACT — sending must NEVER break payment flow:
 *   - If `RESEND_API_KEY` is absent, every send is a no-op that logs and
 *     returns (no throw).
 *   - Every send is wrapped so failures are logged (`console.error`) but
 *     never rethrown. Callers (e.g. the Razorpay webhook) invoke
 *     `sendBookingEmails` inside their own try/catch as a belt-and-braces
 *     guard, but this module is designed to stay silent on failure regardless.
 *
 * The "from" address defaults to "PathMates <hello@pathmates.in>" and can be
 * overridden with the `EMAIL_FROM` env var.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM: string =
  process.env.EMAIL_FROM?.trim() || "PathMates <hello@pathmates.in>";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Generic send. Never throws. Returns true only on a 2xx response from Resend.
 */
async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const { to, subject, html } = opts;
  if (!RESEND_API_KEY) {
    console.error(
      "[email] RESEND_API_KEY not set — skipping send to " + to,
    );
    return false;
  }
  if (!to) {
    console.error("[email] No recipient address — skipping send");
    return false;
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[email] Resend send failed (${res.status}) to ${to}: ${body}`,
      );
      return false;
    }
    console.error(`[email] sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error("[email] Resend send error:", err);
    return false;
  }
}

/**
 * Resolve an auth user's email via the service-role admin API. The app keeps
 * emails on `auth.users` (the `profiles` table has no email column), so while
 * a normal session has `user.email` handy, a sessionless context like the
 * webhook must resolve it on demand.
 */
async function resolveAuthEmail(
  sb: any,
  userId: string | undefined,
): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data } = await sb.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch (err) {
    console.error("[email] Failed to resolve auth email for " + userId, err);
    return null;
  }
}

/** Resolve a display name from the profiles table (fallback provided). */
async function resolveProfileName(
  sb: any,
  userId: string | undefined,
  fallback: string,
): Promise<string> {
  if (!userId) return fallback;
  try {
    const { data } = await sb
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    return data?.full_name || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Format the scheduled slot (date + time, 12h) mirroring the app's display.
 */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Escape text for safe interpolation into HTML. */
function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Shared email shell: header with the brand logo + a simple sanitized body.
 * Inline-styled, table-based, mobile-friendly, no JS / external CSS.
 */
function emailShell(title: string, bodyHtml: string): string {
  const logoUrl = siteUrl("/logo-email.png");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ececf1;">
            <tr>
              <td style="padding:24px 32px;background-color:#ffffff;" align="center">
                <a href="${siteUrl("/")}" style="text-decoration:none;">
                  <img src="${logoUrl}" alt="PathMates" width="200" style="width:200px;height:auto;display:block;border:0;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px 32px;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#fafafc;border-top:1px solid #ececf1;font-family:Arial,Helvetica,sans-serif;color:#8a8a9c;font-size:12px;line-height:1.5;text-align:center;">
                You're receiving this because of your activity on PathMates.<br />
                &copy; ${new Date().getFullYear()} PathMates · pathmates.in
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** A reusable CTA button row. */
function ctaButton(text: string, href: string): string {
  return `<p style="margin:28px 0 8px 0;text-align:center;">
    <a href="${esc(href)}" style="display:inline-block;background-color:#635bff;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">
      ${esc(text)}
    </a>
  </p>`;
}

/** A simple labelled key/value row for booking details. */
function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8a8a9c;width:140px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#1a1a2e;">${esc(value)}</td>
  </tr>`;
}

export type BookingEmailInput = {
  sb: any;
  booking: any;
};

/**
 * Send the two booking-confirmed transactional emails (Explorer confirmation +
 * PathMate new-booking notification). Resolves names/emails from auth + profiles
 * on demand. NEVER throws — on any failure it logs and returns.
 */
export async function sendBookingEmails({
  sb,
  booking,
}: BookingEmailInput): Promise<void> {
  if (!booking?.id) {
    console.error("[email] sendBookingEmails called without a booking");
    return;
  }
  try {
    // Resolve both recipients' addresses and display names in parallel.
    const [explorerEmail, pathmateEmail, explorerName, pathmateName] =
      await Promise.all([
        resolveAuthEmail(sb, booking.explorer_id),
        resolveAuthEmail(sb, booking.pathmate_id),
        resolveProfileName(sb, booking.explorer_id, "An explorer"),
        resolveProfileName(sb, booking.pathmate_id, "your PathMate"),
      ]);

    const amountLabel = formatAmountCents(
      booking.amount_cents,
      booking.currency,
    );
    const when = formatDateTime(booking.scheduled_at);
    const duration = `${booking.duration_minutes}-minute video call`;
    const callUrl = siteUrl(`/call/${booking.id}`);

    // 1) Booking confirmation → the Explorer.
    if (explorerEmail) {
      await sendEmail({
        to: explorerEmail,
        subject: "Your PathMates booking is confirmed 🎉",
        html: emailShell(
          "Booking confirmed",
          `<h1 style="font-family:Arial,Helvetica,sans-serif;font-size:20px;margin:0 0 12px;color:#1a1a2e;">Your booking is confirmed!</h1>
          <p style="margin:0 0 16px;">Hi ${esc(explorerName)},<br />Thank you for booking a call${pathmateName !== "your PathMate" ? ` with <strong>${esc(pathmateName)}</strong>` : ""}. Here are your details:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
            ${detailRow("PathMate", pathmateName)}
            ${detailRow("When", when)}
            ${detailRow("Duration", duration)}
            ${detailRow("Amount", amountLabel)}
          </table>
          <p style="margin:0 0 8px;">Join your 1:1 video call using the link below when it's time:</p>
          ${ctaButton("Join your video call", callUrl)}
          <p style="margin:20px 0 0;font-size:13px;color:#8a8a9c;">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${esc(callUrl)}" style="color:#635bff;">${esc(callUrl)}</a></p>`,
        ),
      });
    } else {
      console.error(
        "[email] Explorer email unresolved for booking " + booking.id,
      );
    }

    // 2) New-booking notification → the PathMate.
    if (pathmateEmail) {
      await sendEmail({
        to: pathmateEmail,
        subject: `You have a new booking from ${esc(explorerName)}`,
        html: emailShell(
          "New booking notification",
          `<h1 style="font-family:Arial,Helvetica,sans-serif;font-size:20px;margin:0 0 12px;color:#1a1a2e;">New booking request</h1>
          <p style="margin:0 0 16px;">Hi ${esc(pathmateName)},<br /><strong>${esc(explorerName)}</strong> has booked a call with you. Here are the details:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
            ${detailRow("Explorer", explorerName)}
            ${detailRow("When", when)}
            ${detailRow("Duration", duration)}
            ${detailRow("Amount", amountLabel)}
          </table>
          <p style="margin:0 0 8px;">Open the call page to view the full details and your meeting link:</p>
          ${ctaButton("Open call page", callUrl)}
          <p style="margin:20px 0 0;font-size:13px;color:#8a8a9c;">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${esc(callUrl)}" style="color:#635bff;">${esc(callUrl)}</a></p>`,
        ),
      });
    } else {
      console.error(
        "[email] PathMate email unresolved for booking " + booking.id,
      );
    }
  } catch (err) {
    // Never allow email to break the payment/booking flow.
    console.error("[email] sendBookingEmails error:", err);
  }
}
