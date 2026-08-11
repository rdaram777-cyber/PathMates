import { createFileRoute } from "@tanstack/react-router";
import { createSupabaseClient } from "~/db";
import { verifyRazorpayWebhookSignature } from "~/lib/razorpay";
import { createNotification } from "~/lib/notifications";
import { formatAmountCents } from "~/lib/currency";

/**
 * Razorpay webhook endpoint.
 *
 * Server-only raw HTTP route (TanStack Start `server.handlers` convention).
 * Razorpay posts signed JSON events here; we verify the `x-razorpay-signature`
 * HMAC against the RAW body, then sync booking payment state server-side.
 * This covers edge cases where the Checkout modal callback never fires (e.g.
 * the browser closed after a successful payment) and is required before the
 * site can take real payments.
 *
 * Configure in the Razorpay dashboard (Settings → Webhooks):
 *   URL:  https://<host>/api/razorpay-webhook
 *   Env:  RAZORPAY_WEBHOOK_SECRET must be set on the server.
 *
 * Handled events:
 *   - payment.captured / order.paid  → mark booking paid, generate meeting URL,
 *     notify PathMate + Explorer (mirrors confirmRazorpayBooking).
 *   - payment.failed                 → cancel the booking, notify the Explorer.
 * All other events are acknowledged (200) without side effects.
 */
export const Route = createFileRoute("/api/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Read the RAW body as text — the HMAC must be computed over the
        //    exact bytes Razorpay signed, so we must NOT parse/transform it first.
        const rawBody = await request.text();

        // 2. Verify the signature. Missing secret or mismatch → 400, no side effects.
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        let signatureValid = false;
        try {
          signatureValid = verifyRazorpayWebhookSignature(rawBody, signature);
        } catch {
          signatureValid = false;
        }
        if (!signatureValid) {
          return Response.json(
            { error: "Invalid webhook signature" },
            { status: 400 },
          );
        }

        // 3. Parse the payload.
        let payload: any;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const event: string = payload?.event ?? "";
        // Service-role client (no user session on webhooks). Cast to any —
        // the generated DB types lag the schema (notifications etc.), matching
        // the codebase's existing pattern in src/lib/bookings.ts.
        const sb: any = createSupabaseClient({ useServiceRole: true });

        if (event === "payment.captured" || event === "order.paid") {
          // payment.captured → payload.payment.entity has { id, order_id, ... }
          // order.paid → payload.order.entity has { id, payments: { items: [{ id }] } }
          const paymentEntity = payload?.payload?.payment?.entity;
          const orderEntity = payload?.payload?.order?.entity;
          const orderId: string | undefined =
            paymentEntity?.order_id ?? orderEntity?.id;
          const paymentId: string | null =
            paymentEntity?.id ??
            orderEntity?.payments?.items?.[0]?.id ??
            null;

          if (!orderId) {
            return Response.json(
              { error: "Missing order id in payload" },
              { status: 400 },
            );
          }

          const { data: booking } = await sb
            .from("bookings")
            .select("*")
            .eq("razorpay_order_id", orderId)
            .maybeSingle();

          // Unknown order or already paid → idempotent ack, no re-processing.
          if (!booking) {
            return Response.json({ received: true });
          }
          if (booking.status === "paid") {
            return Response.json({ received: true, alreadyPaid: true });
          }

          const { error: updateError } = await sb
            .from("bookings")
            .update({
              status: "paid",
              razorpay_order_id: orderId,
              razorpay_payment_id: paymentId,
              meeting_url: `/call/${booking.id}`,
            })
            .eq("id", booking.id);

          if (updateError) {
            return Response.json(
              { error: "Failed to update booking" },
              { status: 500 },
            );
          }

          // Notifications — mirror confirmRazorpayBooking (both non-fatal).
          try {
            const explorerName = await getProfileName(
              sb,
              booking.explorer_id,
              "An explorer",
            );
            const amountLabel = formatAmountCents(
              booking.amount_cents,
              booking.currency,
            );
            await notify({
              userId: booking.pathmate_id,
              type: "booking_confirmed",
              title: "New booking request",
              message: `${explorerName} has booked a ${booking.duration_minutes}-minute call (${amountLabel}) with you.`,
              link: `/bookings`,
            });
          } catch {
            // Don't fail the webhook if a notification fails.
          }

          try {
            const pathmateName = await getProfileName(
              sb,
              booking.pathmate_id,
              "your PathMate",
            );
            await notify({
              userId: booking.explorer_id,
              type: "booking_confirmed",
              title: "Booking confirmed!",
              message: `Your call with ${pathmateName} has been confirmed.`,
              link: `/bookings`,
            });
          } catch {
            // Don't fail the webhook if a notification fails.
          }

          return Response.json({ received: true });
        }

        if (event === "payment.failed") {
          const paymentEntity = payload?.payload?.payment?.entity;
          const orderId: string | undefined = paymentEntity?.order_id;
          if (!orderId) {
            return Response.json(
              { error: "Missing order id in payload" },
              { status: 400 },
            );
          }

          const { data: booking } = await sb
            .from("bookings")
            .select("*")
            .eq("razorpay_order_id", orderId)
            .maybeSingle();

          if (!booking) {
            return Response.json({ received: true });
          }
          // Idempotent: never downgrade an already-paid booking.
          if (booking.status === "paid" || booking.status === "cancelled") {
            return Response.json({ received: true });
          }

          const { error: updateError } = await sb
            .from("bookings")
            .update({ status: "cancelled" })
            .eq("id", booking.id);

          if (updateError) {
            return Response.json(
              { error: "Failed to update booking" },
              { status: 500 },
            );
          }

          // Notify the Explorer that payment failed.
          try {
            await notify({
              userId: booking.explorer_id,
              type: "system",
              title: "Payment failed",
              message: `Your payment for the ${booking.duration_minutes}-minute call was not completed. The booking has been cancelled — you can try again.`,
              link: `/bookings`,
            });
          } catch {
            // Don't fail the webhook if a notification fails.
          }

          return Response.json({ received: true });
        }

        // Unknown event type — acknowledge without side effects.
        return Response.json({ received: true });
      },
    },
  },
});

type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
};

// createNotification is a compiled server fn; the generated types for its
// fetcher lag the validator payload, so type it loosely here (runtime shape
// matches, as used by confirmRazorpayBooking in src/lib/bookings.ts).
const notify = createNotification as unknown as (
  input: NotificationInput,
) => Promise<unknown>;

/** Resolve a user's display name from their profile, with a fallback. */
async function getProfileName(
  sb: any,
  userId: string,
  fallback: string,
): Promise<string> {
  const { data } = await sb
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  return data?.full_name ?? fallback;
}
