import { createServerFn } from "@tanstack/react-start";
import { createSupabaseClient } from "~/db";
import type { Database } from "~/lib/database.types";

// ---- Types ----

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Experience = Database["public"]["Tables"]["experiences"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export interface BookingWithNames extends Booking {
  explorer?: { full_name: string | null; avatar_url: string | null } | null;
  pathmate?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface AdminStats {
  total_users: number;
  total_bookings: number;
  platform_revenue: number;
  active_pathmates: number;
  recent_bookings: BookingWithNames[];
}

export interface RevenueStats {
  total_revenue: number;
  month_revenue: number;
  platform_earnings: number;
  pathmate_payouts: number;
  daily_revenue: { date: string; revenue: number; platform_fee: number }[];
}

// ---- Auth Guards ----

async function getCurrentProfile() {
  const sb = createSupabaseClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("You must be logged in.");

  const { data: profile, error } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) throw new Error("Profile not found.");
  return { user, profile };
}

/** Check that the current user is an admin — throws if not */
async function requireAdmin() {
  const { user, profile } = await getCurrentProfile();
  if (profile.role !== "admin") {
    throw new Error("Access denied: admin only.");
  }
  return user;
}

/** Server fn: check if the current user is an admin */
export const isAdmin = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    try {
      await requireAdmin();
      return true;
    } catch {
      return false;
    }
  },
);

// ---- Dashboard Stats ----

export const getAdminStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminStats> => {
    await requireAdmin();
    const sb = createSupabaseClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Total users
    const { count: totalUsers } = await sb
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Total bookings this month
    const { count: totalBookings } = await sb
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("created_at", startOfMonth);

    // Platform revenue this month (sum of platform_fee_cents from paid bookings)
    const { data: monthBookings } = await sb
      .from("bookings")
      .select("platform_fee_cents")
      .eq("status", "paid")
      .gte("created_at", startOfMonth);

    const platformRevenue =
      monthBookings?.reduce((sum, b) => sum + b.platform_fee_cents, 0) ?? 0;

    // Active PathMates (with at least 1 booking)
    const { data: activePathmatesData } = await sb
      .from("bookings")
      .select("pathmate_id");

    const activePathmateIds = new Set(
      activePathmatesData?.map((b) => b.pathmate_id) ?? [],
    );

    // Recent bookings (last 10)
    const { data: recentBookings } = await sb
      .from("bookings")
      .select(
        "*, explorer:profiles!bookings_explorer_id_fkey(full_name, avatar_url), pathmate:profiles!bookings_pathmate_id_fkey(full_name, avatar_url)",
      )
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      total_users: totalUsers ?? 0,
      total_bookings: totalBookings ?? 0,
      platform_revenue: platformRevenue,
      active_pathmates: activePathmateIds.size,
      recent_bookings: (recentBookings as BookingWithNames[]) ?? [],
    };
  },
);

// ---- User Management ----

export const getAllUsers = createServerFn({ method: "GET" })
  .validator(
    (data: { search?: string; role?: string }) => data,
  )
  .handler(async ({ data: { search, role } }) => {
    await requireAdmin();
    const sb = createSupabaseClient();

    let query = sb
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      const term = `%${search}%`;
      query = query.or(`full_name.ilike.${term},id.ilike.${term}`);
    }

    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    const { data, error } = await query.limit(200);
    if (error) return [];
    return (data as Profile[]) ?? [];
  });

// ---- Bookings Management ----

export const getAllBookings = createServerFn({ method: "GET" })
  .validator(
    (data: { status?: string; search?: string }) => data,
  )
  .handler(async ({ data: { status, search } }) => {
    await requireAdmin();
    const sb = createSupabaseClient();

    let query = sb
      .from("bookings")
      .select(
        "*, explorer:profiles!bookings_explorer_id_fkey(full_name, avatar_url), pathmate:profiles!bookings_pathmate_id_fkey(full_name, avatar_url)",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(
        `explorer.full_name.ilike.${term},pathmate.full_name.ilike.${term}`,
      );
    }

    const { data, error } = await query;
    if (error) return [];
    return (data as BookingWithNames[]) ?? [];
  });

// ---- Revenue Stats ----

export const getRevenueStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<RevenueStats> => {
    await requireAdmin();
    const sb = createSupabaseClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // All time totals
    const { data: allPaid } = await sb
      .from("bookings")
      .select("amount_cents, platform_fee_cents, pathmate_earnings_cents")
      .eq("status", "paid");

    const totalRevenue =
      allPaid?.reduce((sum, b) => sum + b.amount_cents, 0) ?? 0;
    const platformEarnings =
      allPaid?.reduce((sum, b) => sum + b.platform_fee_cents, 0) ?? 0;
    const pathmatePayouts =
      allPaid?.reduce((sum, b) => sum + b.pathmate_earnings_cents, 0) ?? 0;

    // This month
    const { data: monthPaid } = await sb
      .from("bookings")
      .select("amount_cents")
      .eq("status", "paid")
      .gte("created_at", startOfMonth);

    const monthRevenue =
      monthPaid?.reduce((sum, b) => sum + b.amount_cents, 0) ?? 0;

    // Daily revenue (last 30 days)
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: dailyData } = await sb
      .from("bookings")
      .select("amount_cents, platform_fee_cents, created_at")
      .eq("status", "paid")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true });

    const dailyMap = new Map<
      string,
      { revenue: number; platform_fee: number }
    >();

    // Initialize all 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { revenue: 0, platform_fee: 0 });
    }

    for (const b of dailyData ?? []) {
      const key = b.created_at.slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.revenue += b.amount_cents;
        entry.platform_fee += b.platform_fee_cents;
      }
    }

    const dailyRevenue = Array.from(dailyMap.entries()).map(
      ([date, vals]) => ({
        date,
        revenue: vals.revenue,
        platform_fee: vals.platform_fee,
      }),
    );

    return {
      total_revenue: totalRevenue,
      month_revenue: monthRevenue,
      platform_earnings: platformEarnings,
      pathmate_payouts: pathmatePayouts,
      daily_revenue: dailyRevenue,
    };
  },
);

// ---- Role Management ----

export const updateUserRole = createServerFn({ method: "POST" })
  .validator((data: { userId: string; role: string }) => data)
  .handler(async ({ data: { userId, role } }) => {
    await requireAdmin();
    const sb = createSupabaseClient();

    if (!["explorer", "pathmate", "admin"].includes(role)) {
      throw new Error("Invalid role.");
    }

    const { error } = await sb
      .from("profiles")
      .update({ role: role as "explorer" | "pathmate" | "admin" })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---- Verify PathMate ----

export const verifyPathmate = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    await requireAdmin();
    const sb = createSupabaseClient();

    // Get current verified state
    const { data: profile } = await sb
      .from("profiles")
      .select("verified")
      .eq("id", userId)
      .single();

    if (!profile) throw new Error("User not found.");

    const { error } = await sb
      .from("profiles")
      .update({ verified: !profile.verified })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { verified: !profile.verified };
  });

// ---- Commission Management ----

export const updateCommission = createServerFn({ method: "POST" })
  .validator((percent: number) => percent)
  .handler(async ({ data: percent }) => {
    await requireAdmin();
    const sb = createSupabaseClient();

    if (percent < 0 || percent > 100) {
      throw new Error("Commission must be between 0 and 100.");
    }

    const { error } = await sb
      .from("platform_settings")
      .upsert(
        {
          key: "commission_percent",
          value: String(Math.round(percent)),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

    if (error) throw new Error(error.message);
    return { commission_percent: Math.round(percent) };
  });

export { getCommissionPercent } from "~/lib/stripe";

// ---- Refund Booking ----

export const refundBooking = createServerFn({ method: "POST" })
  .validator((bookingId: string) => bookingId)
  .handler(async ({ data: bookingId }) => {
    await requireAdmin();
    const sb = createSupabaseClient();

    const { data: booking, error } = await sb
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .single();

    if (error || !booking) throw new Error("Booking not found.");
    if (booking.status === "refunded") {
      throw new Error("Booking is already refunded.");
    }

    const { error: updateErr } = await sb
      .from("bookings")
      .update({ status: "refunded" })
      .eq("id", bookingId);

    if (updateErr) throw new Error(updateErr.message);
    return { success: true };
  });

// ---- Get all experiences (admin) ----

export const getAllExperiences = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdmin();
    const sb = createSupabaseClient();

    const { data, error } = await sb
      .from("experiences")
      .select("*, profiles(full_name, avatar_url), categories(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return [];
    return (data as any[]) ?? [];
  },
);

// ---- Get all reviews (admin) ----

export const getAllReviews = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdmin();
    const sb = createSupabaseClient();

    const { data, error } = await sb
      .from("reviews")
      .select(
        "*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url), pathmate:profiles!reviews_pathmate_id_fkey(full_name, avatar_url)",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return [];
    return (data as any[]) ?? [];
  },
);

// ---- Get platform setting ----

export const getPlatformSetting = createServerFn({ method: "GET" })
  .validator((key: string) => key)
  .handler(async ({ data: key }) => {
    await requireAdmin();
    const sb = createSupabaseClient();

    const { data, error } = await sb
      .from("platform_settings")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  });
