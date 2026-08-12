import { createServerFn } from "@tanstack/react-start";
import { createSupabaseClient } from "~/db";
import type { Database } from "~/lib/database.types";
import { createNotification } from "~/lib/notifications";

// ---- Types ----

export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export interface ReviewWithReviewer extends Review {
  reviewer?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * reviews.reviewer_id / pathmate_id point at auth.users(id), not
 * public.profiles(id), so PostgREST cannot embed
 * `profiles!reviews_..._fkey` (PGRST200). We fetch reviewer names with an
 * explicit query and attach them in memory under the same `reviewer` key.
 */
async function attachReviewers(
  sb: ReturnType<typeof createSupabaseClient>,
  rows: ReviewWithReviewer[],
): Promise<ReviewWithReviewer[]> {
  if (rows.length === 0) return rows;
  const ids = [...new Set(rows.map((r) => r.reviewer_id))];
  const { data: profiles } = await sb
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  for (const row of rows) {
    const reviewer = byId.get(row.reviewer_id);
    row.reviewer = reviewer
      ? { full_name: reviewer.full_name, avatar_url: reviewer.avatar_url }
      : null;
  }
  return rows;
}

export interface PathmateRating {
  avg_rating: number;
  review_count: number;
  recent_reviews: ReviewWithReviewer[];
}

// ---- Recent reviews for the homepage testimonials section ----

export interface HomepageReview {
  id: string;
  rating: number;
  content: string | null;
  created_at: string;
  reviewerName: string | null;
  reviewerAvatar: string | null;
  experienceTitle: string | null;
}

/**
 * Latest reviews (newest first) for the homepage "What Explorers say"
 * section. Joins reviewer name/avatar from profiles and the booked
 * experience title via bookings — resolved in memory because the FKs point
 * at auth.users(id) (see attachReviewers). Public read: service role.
 */
export const getRecentReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomepageReview[]> => {
    const sb = createSupabaseClient({ useServiceRole: true });

    const { data: reviews } = await sb
      .from("reviews")
      .select("id, booking_id, reviewer_id, rating, content, created_at")
      .order("created_at", { ascending: false })
      .limit(9);
    const rows = (reviews ?? []) as Array<{
      id: string;
      booking_id: string | null;
      reviewer_id: string;
      rating: number;
      content: string | null;
      created_at: string;
    }>;
    if (rows.length === 0) return [];

    // Reviewer names/avatars (profiles.id == auth.users.id).
    const reviewerIds = [...new Set(rows.map((r) => r.reviewer_id))];
    const { data: reviewerProfiles } = await sb
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", reviewerIds);
    const reviewerById = new Map(
      (reviewerProfiles ?? []).map((p) => [p.id, p]),
    );

    // Experience titles via the booking's experience_id.
    const bookingIds = [
      ...new Set(rows.map((r) => r.booking_id).filter((b): b is string => !!b)),
    ];
    const bookingToExperience = new Map<string, string | null>();
    if (bookingIds.length > 0) {
      const { data: bookings } = await sb
        .from("bookings")
        .select("id, experience_id")
        .in("id", bookingIds);
      const experienceIds = [
        ...new Set(
          (bookings ?? [])
            .map((b) => b.experience_id)
            .filter((id): id is string => !!id),
        ),
      ];
      const titleById = new Map<string, string | null>();
      if (experienceIds.length > 0) {
        const { data: experiences } = await sb
          .from("experiences")
          .select("id, title")
          .in("id", experienceIds);
        for (const exp of experiences ?? []) titleById.set(exp.id, exp.title);
      }
      for (const b of bookings ?? []) {
        bookingToExperience.set(b.id, b.experience_id ? (titleById.get(b.experience_id) ?? null) : null);
      }
    }

    return rows.map((r) => {
      const reviewer = reviewerById.get(r.reviewer_id);
      return {
        id: r.id,
        rating: r.rating,
        content: r.content,
        created_at: r.created_at,
        reviewerName: reviewer?.full_name ?? null,
        reviewerAvatar: reviewer?.avatar_url ?? null,
        experienceTitle: r.booking_id
          ? (bookingToExperience.get(r.booking_id) ?? null)
          : null,
      };
    });
  },
);

// ---- Get reviews for a PathMate ----

export const getPathmateReviews = createServerFn({ method: "GET" })
  .validator((pathmateId: string) => pathmateId)
  .handler(async ({ data: pathmateId }): Promise<ReviewWithReviewer[]> => {
    // Public read (reviews are shown on public profile pages) — service role
    // bypasses the authenticated-only RLS policy.
    const sb = createSupabaseClient({ useServiceRole: true });
    const { data, error } = await sb
      .from("reviews")
      .select("*")
      .eq("pathmate_id", pathmateId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return [];
    return await attachReviewers(sb, (data as ReviewWithReviewer[]) ?? []);
  });

// ---- Get rating summary for a PathMate ----

export const getPathmateRating = createServerFn({ method: "GET" })
  .validator((pathmateId: string) => pathmateId)
  .handler(async ({ data: pathmateId }): Promise<PathmateRating> => {
    // Public read — see getPathmateReviews.
    const sb = createSupabaseClient({ useServiceRole: true });

    // Get rating from profiles
    const { data: profile } = await sb
      .from("profiles")
      .select("avg_rating, review_count")
      .eq("id", pathmateId)
      .single();

    // Get recent reviews (last 3)
    const { data: reviews } = await sb
      .from("reviews")
      .select("*")
      .eq("pathmate_id", pathmateId)
      .order("created_at", { ascending: false })
      .limit(3);

    return {
      avg_rating: profile?.avg_rating ?? 0,
      review_count: profile?.review_count ?? 0,
      recent_reviews: await attachReviewers(
        sb,
        (reviews as ReviewWithReviewer[]) ?? [],
      ),
    };
  });

// ---- Check if a review exists for a booking ----

export const getBookingReview = createServerFn({ method: "GET" })
  .validator((bookingId: string) => bookingId)
  .handler(async ({ data: bookingId }): Promise<Review | null> => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    const { data, error } = await sb
      .from("reviews")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("reviewer_id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Review;
  });

// ---- Create a review ----

export const createReview = createServerFn({ method: "POST" })
  .validator(
    (data: { booking_id: string; rating: number; content?: string }) => data,
  )
  .handler(async ({ data }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in to leave a review.");

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    // Verify booking exists and belongs to the reviewer
    const { data: booking, error: bookingErr } = await sb
      .from("bookings")
      .select("id, explorer_id, pathmate_id, status")
      .eq("id", data.booking_id)
      .single();

    if (bookingErr || !booking) {
      throw new Error("Booking not found.");
    }

    if (booking.explorer_id !== user.id) {
      throw new Error("You can only review bookings you made as an explorer.");
    }

    if (booking.status !== "paid" && booking.status !== "completed") {
      throw new Error("You can only review paid or completed bookings.");
    }

    // Check no review exists already
    const { data: existing } = await sb
      .from("reviews")
      .select("id")
      .eq("booking_id", data.booking_id)
      .maybeSingle();

    if (existing) {
      throw new Error("You have already reviewed this booking.");
    }

    // Insert review
    const { data: review, error: insertErr } = await sb
      .from("reviews")
      .insert({
        booking_id: data.booking_id,
        reviewer_id: user.id,
        pathmate_id: booking.pathmate_id,
        rating: data.rating,
        content: data.content ?? null,
      })
      .select("id")
      .single();

    if (insertErr) throw new Error(insertErr.message);

    // Update profile rating
    await recalculateRatingInternal(sb, booking.pathmate_id);

    // Notify the PathMate about the review
    try {
      const reviewerName = user.user_metadata?.full_name || user.email || "An explorer";
      await createNotification({
        data: {
          userId: booking.pathmate_id,
          type: "new_review",
          title: "New review received",
          message: `${reviewerName} left you a ${data.rating}-star review.`,
          link: `/profile/${booking.pathmate_id}`,
        },
      });
    } catch {
      // Don't fail the review if notification fails
    }

    return { id: review.id };
  });

// ---- Update a review ----

export const updateReview = createServerFn({ method: "POST" })
  .validator(
    (data: { review_id: string; rating: number; content?: string }) => data,
  )
  .handler(async ({ data }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    // Verify ownership
    const { data: existing, error } = await sb
      .from("reviews")
      .select("id, reviewer_id, pathmate_id")
      .eq("id", data.review_id)
      .single();

    if (error || !existing) throw new Error("Review not found.");
    if (existing.reviewer_id !== user.id)
      throw new Error("You can only edit your own reviews.");

    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    const { error: updateErr } = await sb
      .from("reviews")
      .update({
        rating: data.rating,
        content: data.content ?? null,
      })
      .eq("id", data.review_id);

    if (updateErr) throw new Error(updateErr.message);

    // Recalculate rating
    await recalculateRatingInternal(sb, existing.pathmate_id);

    return { success: true };
  });

// ---- Delete a review ----

export const deleteReview = createServerFn({ method: "POST" })
  .validator((reviewId: string) => reviewId)
  .handler(async ({ data: reviewId }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    const { data: existing, error } = await sb
      .from("reviews")
      .select("id, reviewer_id, pathmate_id")
      .eq("id", reviewId)
      .single();

    if (error || !existing) throw new Error("Review not found.");
    if (existing.reviewer_id !== user.id)
      throw new Error("You can only delete your own reviews.");

    const { error: deleteErr } = await sb
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteErr) throw new Error(deleteErr.message);

    // Recalculate rating
    await recalculateRatingInternal(sb, existing.pathmate_id);

    return { success: true };
  });

// ---- Recalculate rating (utility, also exported) ----

export const recalculateRating = createServerFn({ method: "POST" })
  .validator((pathmateId: string) => pathmateId)
  .handler(async ({ data: pathmateId }) => {
    const sb = createSupabaseClient();
    await recalculateRatingInternal(sb, pathmateId);
    return { success: true };
  });

/** Internal helper: recalculate avg_rating, review_count, and verified flag */
async function recalculateRatingInternal(
  sb: ReturnType<typeof createSupabaseClient>,
  pathmateId: string,
) {
  const { data: reviews, error } = await sb
    .from("reviews")
    .select("rating")
    .eq("pathmate_id", pathmateId);

  if (error) return;

  const count = reviews.length;
  const avg =
    count > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10,
        ) / 10
      : 0;
  const verified = count >= 3 && avg >= 4.0;

  await sb
    .from("profiles")
    .update({
      avg_rating: avg,
      review_count: count,
      verified,
    })
    .eq("id", pathmateId);
}
