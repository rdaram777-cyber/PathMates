import { createServerFn } from "@tanstack/react-start";
import { createSupabaseClient } from "~/db";

/**
 * Homepage social-proof stats, computed server-side with the service role.
 * Every number is an honest live count — nothing is fabricated or padded.
 * When no profile has a rating yet, `avgRating` is null so the UI can show a
 * "New platform" placeholder instead of a misleading "0.0".
 */
export interface HomepageStats {
  /** Profiles with role = 'pathmate' — people you can actually book. */
  mentors: number;
  /** Total published experiences. */
  experiences: number;
  /** Bookings that reached a paid state (status = 'paid'). */
  bookings: number;
  /** Average of profiles.avg_rating over rated profiles, or null if none. */
  avgRating: number | null;
}

export const getHomepageStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomepageStats> => {
    const sb = createSupabaseClient({ useServiceRole: true });

    const [mentors, experiences, paidBookings, rated] = await Promise.all([
      sb
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "pathmate"),
      sb.from("experiences").select("id", { count: "exact", head: true }),
      sb
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid"),
      sb.from("profiles").select("avg_rating").gt("avg_rating", 0),
    ]);

    let avgRating: number | null = null;
    const ratings = (rated.data ?? []) as { avg_rating: number }[];
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + (r.avg_rating || 0), 0);
      avgRating = Math.round((sum / ratings.length) * 10) / 10;
    }

    return {
      mentors: mentors.count ?? 0,
      experiences: experiences.count ?? 0,
      bookings: paidBookings.count ?? 0,
      avgRating,
    };
  },
);
