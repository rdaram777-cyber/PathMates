import { createServerFn } from "@tanstack/react-start";
import { createSupabaseClient } from "~/db";
import type { Database } from "~/lib/database.types";

// ---- Types ----

export type ExperienceWithDetails =
  Database["public"]["Tables"]["experiences"]["Row"] & {
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
      avg_rating?: number;
      review_count?: number;
      verified?: boolean;
    } | null;
    categories?: { name: string | null; slug: string | null } | null;
  };

export type Category =
  Database["public"]["Tables"]["categories"]["Row"];

// ---- Public reads (no auth required) ----

/**
 * The experiences.user_id column points at auth.users(id), not
 * public.profiles(id), so PostgREST cannot embed `profiles(...)` from
 * experiences (PGRST200 "could not find a relationship"). We therefore
 * fetch the experiences with only the `categories` embed (whose FK exists)
 * and resolve profile details with an explicit second query, merging the
 * result in memory so the returned shape is identical to the old embed.
 */

async function attachProfiles(
  sb: ReturnType<typeof createSupabaseClient>,
  rows: ExperienceWithDetails[],
): Promise<ExperienceWithDetails[]> {
  if (rows.length === 0) return rows;
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await sb
    .from("profiles")
    .select("id, full_name, avatar_url, avg_rating, review_count, verified")
    .in("id", userIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  for (const row of rows) {
    const profile = byId.get(row.user_id);
    row.profiles = profile
      ? {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          avg_rating: profile.avg_rating,
          review_count: profile.review_count,
          verified: profile.verified,
        }
      : null;
  }
  return rows;
}

async function attachProfile(
  sb: ReturnType<typeof createSupabaseClient>,
  row: ExperienceWithDetails,
): Promise<ExperienceWithDetails> {
  const { data: profile } = await sb
    .from("profiles")
    .select("full_name, avatar_url, avg_rating, review_count, verified")
    .eq("id", row.user_id)
    .maybeSingle();
  row.profiles = profile
    ? {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        avg_rating: profile.avg_rating,
        review_count: profile.review_count,
        verified: profile.verified,
      }
    : null;
  return row;
}

export const getExperiences = createServerFn({ method: "GET" }).handler(
  async (): Promise<ExperienceWithDetails[]> => {
    const sb = createSupabaseClient({ useServiceRole: true });
    const { data, error } = await sb
      .from("experiences")
      .select("*, categories(name, slug)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    return await attachProfiles(sb, (data as ExperienceWithDetails[]) ?? []);
  },
);

export const getExperience = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ExperienceWithDetails | null> => {
    const sb = createSupabaseClient({ useServiceRole: true });
    const { data, error } = await sb
      .from("experiences")
      .select("*, categories(name, slug)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return await attachProfile(sb, data as ExperienceWithDetails);
  });

export const searchExperiences = createServerFn({ method: "GET" })
  .validator((query: string) => query)
  .handler(async ({ data: query }): Promise<ExperienceWithDetails[]> => {
    const sb = createSupabaseClient({ useServiceRole: true });
    const term = `%${query}%`;

    // Search across title, content, and category name
    const { data, error } = await sb
      .from("experiences")
      .select("*, categories!inner(name, slug)")
      .or(`title.ilike.${term},content.ilike.${term},categories.name.ilike.${term}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Fallback: try searching without category join
      const { data: fallbackData, error: fallbackError } = await sb
        .from("experiences")
        .select("*, categories(name, slug)")
        .or(`title.ilike.${term},content.ilike.${term}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fallbackError) return [];
      return await attachProfiles(
        sb,
        (fallbackData as ExperienceWithDetails[]) ?? [],
      );
    }

    return await attachProfiles(sb, (data as ExperienceWithDetails[]) ?? []);
  });

export const getCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<Category[]> => {
    const sb = createSupabaseClient({ useServiceRole: true });
    const { data, error } = await sb
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) return [];
    return (data as Category[]) ?? [];
  },
);

// ---- Mutations (auth required) ----

export const createExperience = createServerFn({ method: "POST" })
  .validator(
    (data: { title: string; content: string; category_id: string | null }) =>
      data,
  )
  .handler(async ({ data }) => {
    const sb = createSupabaseClient();

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in to share an experience.");
    }

    const { data: inserted, error } = await sb
      .from("experiences")
      .insert({
        user_id: user.id,
        title: data.title,
        content: data.content,
        category_id: data.category_id,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const updateExperience = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      title: string;
      content: string;
      category_id: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sb = createSupabaseClient();

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in to edit an experience.");
    }

    // Verify ownership
    const { data: existing } = await sb
      .from("experiences")
      .select("user_id")
      .eq("id", data.id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      throw new Error("You can only edit your own experiences.");
    }

    const { error } = await sb
      .from("experiences")
      .update({
        title: data.title,
        content: data.content,
        category_id: data.category_id,
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteExperience = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sb = createSupabaseClient();

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in to delete an experience.");
    }

    // Verify ownership
    const { data: existing } = await sb
      .from("experiences")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      throw new Error("You can only delete your own experiences.");
    }

    const { error } = await sb.from("experiences").delete().eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
