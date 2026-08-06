import { createServerFn } from "@tanstack/react-start";
import { createSupabaseClient } from "~/db";
import {
  calculateCommission,
  createCheckoutSession,
  getCommissionPercent,
  verifyStripeSession,
} from "~/lib/stripe";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  verifyRazorpayPayment,
} from "~/lib/razorpay";
import type { Database } from "~/lib/database.types";
import { createNotification } from "~/lib/notifications";
import {
  formatAmountCents,
  getTierPriceCents,
  isSupportedCurrency,
  type CurrencyCode,
} from "~/lib/currency";

// ---- Types ----

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type AvailabilitySlot =
  Database["public"]["Tables"]["availability_slots"]["Row"];

export interface BookingWithDetails extends Booking {
  explorer?: { full_name: string | null; avatar_url: string | null } | null;
  pathmate?: { full_name: string | null; avatar_url: string | null } | null;
}

/** Result of createBooking — the client branches on `gateway`. */
export type CreateBookingResult =
  | { gateway: "stripe"; bookingId: string; checkoutUrl: string }
  | {
      gateway: "razorpay";
      bookingId: string;
      orderId: string;
      keyId: string;
      /** Order amount in paise (same unit as cents). */
      amount: number;
      currency: "INR";
    };

// ---- Availability ----

export const getPathmateAvailability = createServerFn({ method: "GET" })
  .validator((pathmateId: string) => pathmateId)
  .handler(async ({ data: pathmateId }): Promise<AvailabilitySlot[]> => {
    // Public read (any logged-in explorer may view a PathMate's availability
    // when booking) — service role bypasses the owner-only RLS policy.
    const sb = createSupabaseClient({ useServiceRole: true });
    const { data, error } = await sb
      .from("availability_slots")
      .select("*")
      .eq("user_id", pathmateId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) return [];
    return (data as AvailabilitySlot[]) ?? [];
  });

export const getMyAvailability = createServerFn({ method: "GET" }).handler(
  async (): Promise<AvailabilitySlot[]> => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    const { data, error } = await sb
      .from("availability_slots")
      .select("*")
      .eq("user_id", user.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) return [];
    return (data as AvailabilitySlot[]) ?? [];
  },
);

export const addAvailabilitySlot = createServerFn({ method: "POST" })
  .validator(
    (data: { day_of_week: number; start_time: string; end_time: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    // Validate times
    if (data.start_time >= data.end_time) {
      throw new Error("Start time must be before end time.");
    }

    const { data: inserted, error } = await sb
      .from("availability_slots")
      .insert({
        user_id: user.id,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteAvailabilitySlot = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    const { data: existing } = await sb
      .from("availability_slots")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      throw new Error("You can only delete your own availability slots.");
    }

    const { error } = await sb
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---- Bookings ----

export const createBooking = createServerFn({ method: "POST" })
  .validator(
    (data: {
      pathmate_id: string;
      experience_id?: string | null;
      scheduled_at: string;
      duration_minutes: number;
      /** Detected currency ("INR" | "USD"). The amount is always computed server-side from TIER_PRICING. */
      currency?: string;
      pathmate_name: string;
      experience_title?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in to book a call.");

    // Fixed tier pricing: validate the duration and derive the amount from the
    // platform-wide table — never trust a client-supplied amount.
    const currency: CurrencyCode = isSupportedCurrency(data.currency)
      ? data.currency
      : "USD";
    const amountCents = getTierPriceCents(data.duration_minutes, currency);
    // Calculate commission (dynamic from DB)
    const commissionPercent = await getCommissionPercent();
    const { platformFee, pathmateEarnings } = calculateCommission(
      amountCents,
      commissionPercent,
    );

    // Insert booking with pending status
    const { data: booking, error: bookingError } = await sb
      .from("bookings")
      .insert({
        explorer_id: user.id,
        pathmate_id: data.pathmate_id,
        experience_id: data.experience_id ?? null,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes,
        amount_cents: amountCents,
        platform_fee_cents: platformFee,
        pathmate_earnings_cents: pathmateEarnings,
        status: "pending",
        currency,
        payment_gateway: currency === "INR" ? "razorpay" : "stripe",
      })
      .select("id")
      .single();

    if (bookingError) {
      // If the database is missing the Phase 4 payment columns (migration 009
      // not applied yet), surface a clear message instead of the raw
      // PostgREST "column does not exist" error.
      const message = bookingError.message ?? "";
      if (/currency|payment_gateway|schema cache/i.test(message)) {
        throw new Error(
          "Bookings are not fully configured yet — the database is missing required payment columns (migration 009 has not been applied). Please try again later.",
        );
      }
      throw new Error(message);
    }

    const siteUrl = process.env.SITE_URL || "http://localhost:3000";
    const amountLabel = formatAmountCents(amountCents, currency);

    // Notify the PathMate about the pending booking request
    try {
      const explorerName =
        user.user_metadata?.full_name || user.email || "An explorer";
      await createNotification({
        userId: data.pathmate_id,
        type: "booking_confirmed",
        title: "New booking request",
        message: `${explorerName} has requested a ${data.duration_minutes}-minute call${data.experience_title ? ` about "${data.experience_title}"` : ""} (${amountLabel}).`,
        link: `/bookings`,
      });
    } catch {
      // Don't fail the booking if notification fails
    }

    // Route the payment by currency: INR → Razorpay, USD → Stripe.
    if (currency === "INR") {
      // Create a Razorpay order (amount in paise = our INR cents).
      const order = await createRazorpayOrder(amountCents, booking.id);

      // Store the order id on the booking for verification later.
      await sb
        .from("bookings")
        .update({ razorpay_order_id: order.id })
        .eq("id", booking.id);

      return {
        gateway: "razorpay",
        bookingId: booking.id,
        orderId: order.id,
        keyId: getRazorpayKeyId(),
        amount: order.amount,
        currency: "INR",
      } as const;
    }

    // USD → Stripe Checkout (unchanged flow).
    const { checkoutUrl } = await createCheckoutSession({
      bookingId: booking.id,
      explorerId: user.id,
      pathmateId: data.pathmate_id,
      pathmateName: data.pathmate_name,
      experienceId: data.experience_id ?? null,
      experienceTitle: data.experience_title,
      amountCents,
      platformFeeCents: platformFee,
      pathmateEarningsCents: pathmateEarnings,
      currency,
      successUrl: `${siteUrl}/bookings/${booking.id}/success`,
      cancelUrl: `${siteUrl}/experiences/${data.experience_id ?? ""}`,
      durationMinutes: data.duration_minutes,
    });

    // Update booking with Stripe session ID
    await sb
      .from("bookings")
      .update({ stripe_session_id: checkoutUrl.split("/").pop()?.split("?")[0] })
      .eq("id", booking.id);

    return { gateway: "stripe", bookingId: booking.id, checkoutUrl };
  });

export const getBooking = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<BookingWithDetails | null> => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    const { data, error } = await sb
      .from("bookings")
      .select("*, explorer:profiles!bookings_explorer_id_fkey(full_name, avatar_url), pathmate:profiles!bookings_pathmate_id_fkey(full_name, avatar_url)")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    // Check access: must be either explorer or pathmate
    const booking = data as any;
    if (booking.explorer_id !== user.id && booking.pathmate_id !== user.id) {
      return null;
    }

    return booking as BookingWithDetails;
  });

export const confirmBooking = createServerFn({ method: "POST" })
  .validator((bookingId: string) => bookingId)
  .handler(async ({ data: bookingId }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    // Verify the booking belongs to the user
    const { data: booking } = await sb
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("explorer_id", user.id)
      .single();

    if (!booking) throw new Error("Booking not found.");

    // If no stripe session ID, we can't verify
    if (!booking.stripe_session_id) {
      throw new Error("No Stripe session found for this booking.");
    }

    // Verify Stripe payment
    const { paymentStatus } = await verifyStripeSession(
      booking.stripe_session_id,
    );

    if (paymentStatus !== "paid") {
      throw new Error("Payment has not been completed yet.");
    }

    // Generate meeting URL
    const meetingUrl = `/call/${bookingId}`;

    // Update booking
    const { error } = await sb
      .from("bookings")
      .update({
        stripe_payment_status: "paid",
        status: "paid",
        meeting_url: meetingUrl,
      })
      .eq("id", bookingId);

    if (error) throw new Error(error.message);

    // Notify the PathMate about the new booking
    try {
      const explorerName =
        user.user_metadata?.full_name || user.email || "An explorer";
      const amountLabel = formatAmountCents(
        booking.amount_cents,
        booking.currency,
      );
      await createNotification({
        userId: booking.pathmate_id,
        type: "booking_confirmed",
        title: "New booking request",
        message: `${explorerName} has booked a ${booking.duration_minutes}-minute call (${amountLabel}) with you.`,
        link: `/bookings`,
      });
    } catch {
      // Don't fail the booking if notification fails
    }

    // Notify the Explorer that payment is confirmed
    try {
      const { data: pathmateProfile } = await sb
        .from("profiles")
        .select("full_name")
        .eq("id", booking.pathmate_id)
        .single();
      const pathmateName = pathmateProfile?.full_name || "your PathMate";
      await createNotification({
        userId: booking.explorer_id,
        type: "booking_confirmed",
        title: "Booking confirmed!",
        message: `Your call with ${pathmateName} has been confirmed.`,
        link: `/bookings`,
      });
    } catch {
      // Don't fail if notification fails
    }

    return { success: true, meetingUrl };
  });

/**
 * Verify and confirm a Razorpay payment. Called from the browser after the
 * Razorpay Checkout modal succeeds. Verifies the HMAC signature, then marks
 * the booking paid and generates the meeting URL — mirroring the Stripe flow.
 */
export const confirmRazorpayBooking = createServerFn({ method: "POST" })
  .validator(
    (data: {
      bookingId: string;
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    // The booking must belong to this explorer
    const { data: booking, error: bookingError } = await sb
      .from("bookings")
      .select("*")
      .eq("id", data.bookingId)
      .eq("explorer_id", user.id)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found.");

    // Only INR/Razorpay bookings go through this path
    if (
      booking.payment_gateway !== "razorpay" ||
      booking.currency !== "INR"
    ) {
      throw new Error("This booking was not created with Razorpay.");
    }
    if (booking.razorpay_order_id !== data.razorpay_order_id) {
      throw new Error(
        "Razorpay order mismatch — payment could not be verified.",
      );
    }

    // Verify the payment signature (HMAC-SHA256 of orderId|paymentId)
    const valid = verifyRazorpayPayment(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature,
    );
    if (!valid) {
      throw new Error("Payment signature verification failed.");
    }

    // Generate meeting URL
    const meetingUrl = `/call/${booking.id}`;

    // Update booking
    const { error } = await sb
      .from("bookings")
      .update({
        status: "paid",
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        meeting_url: meetingUrl,
      })
      .eq("id", booking.id);

    if (error) throw new Error(error.message);

    // Notify the PathMate about the confirmed booking
    try {
      const explorerName =
        user.user_metadata?.full_name || user.email || "An explorer";
      const amountLabel = formatAmountCents(
        booking.amount_cents,
        booking.currency,
      );
      await createNotification({
        userId: booking.pathmate_id,
        type: "booking_confirmed",
        title: "New booking request",
        message: `${explorerName} has booked a ${booking.duration_minutes}-minute call (${amountLabel}) with you.`,
        link: `/bookings`,
      });
    } catch {
      // Don't fail the booking if notification fails
    }

    // Notify the Explorer that payment is confirmed
    try {
      const { data: pathmateProfile } = await sb
        .from("profiles")
        .select("full_name")
        .eq("id", booking.pathmate_id)
        .single();
      const pathmateName = pathmateProfile?.full_name || "your PathMate";
      await createNotification({
        userId: booking.explorer_id,
        type: "booking_confirmed",
        title: "Booking confirmed!",
        message: `Your call with ${pathmateName} has been confirmed.`,
        link: `/bookings`,
      });
    } catch {
      // Don't fail if notification fails
    }

    return { success: true, meetingUrl };
  });

export const getUserBookings = createServerFn({ method: "GET" }).handler(
  async (): Promise<BookingWithDetails[]> => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    // Use admin client to query across both roles
    // Since RLS only allows select by explorer_id OR pathmate_id,
    // we need to handle this with two queries
    const { data: asExplorer, error: explorerErr } = await sb
      .from("bookings")
      .select(
        "*, explorer:profiles!bookings_explorer_id_fkey(full_name, avatar_url), pathmate:profiles!bookings_pathmate_id_fkey(full_name, avatar_url)",
      )
      .eq("explorer_id", user.id)
      .order("scheduled_at", { ascending: false });

    const { data: asPathmate, error: pathmateErr } = await sb
      .from("bookings")
      .select(
        "*, explorer:profiles!bookings_explorer_id_fkey(full_name, avatar_url), pathmate:profiles!bookings_pathmate_id_fkey(full_name, avatar_url)",
      )
      .eq("pathmate_id", user.id)
      .order("scheduled_at", { ascending: false });

    const all = [
      ...((asExplorer as any[]) ?? []),
      ...((asPathmate as any[]) ?? []),
    ];

    // Deduplicate and sort
    const seen = new Set<string>();
    const unique = all.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });

    unique.sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
    );

    return unique as BookingWithDetails[];
  },
);

// ---- Get PathMate profile with rate ----

export const getPathmateProfile = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(
    async ({
      data: userId,
    }): Promise<{
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      bio_short: string | null;
      hourly_rate: number;
      avg_rating: number;
      review_count: number;
      verified: boolean;
    } | null> => {
      // Public read of a PathMate's profile (any logged-in explorer can view
      // it when booking) — service role bypasses the own-profile RLS policy.
      const sb = createSupabaseClient({ useServiceRole: true });
      const { data, error } = await sb
        .from("profiles")
        .select("id, full_name, avatar_url, bio_short, hourly_rate, avg_rating, review_count, verified")
        .eq("id", userId)
        .single();

      if (error || !data) return null;
      return data as any;
    },
  );
