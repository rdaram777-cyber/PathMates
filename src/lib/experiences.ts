import { createServerFn } from "@tanstack/react-start";
import { createSupabaseClient } from "~/db";
import type { Database } from "~/lib/database.types";

// ---- Types ----

export type ExperienceWithDetails =
  Database["public"]["Tables"]["experiences"]["Row"] & {
    profiles?: { full_name: string | null; avatar_url: string | null } | null;
    categories?: { name: string | null; slug: string | null } | null;
  };

export type Category =
  Database["public"]["Tables"]["categories"]["Row"];

// ---- Public reads (no auth required) ----

export const getExperiences = createServerFn({ method: "GET" }).handler(
  async (): Promise<ExperienceWithDetails[]> => {
    const sb = createSupabaseClient();
    const { data, error } = await sb
      .from("experiences")
      .select("*, profiles(full_name, avatar_url), categories(name, slug)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    return (data as ExperienceWithDetails[]) ?? [];
  },
);

export const getExperience = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ExperienceWithDetails | null> => {
    const sb = createSupabaseClient();
    const { data, error } = await sb
      .from("experiences")
      .select("*, profiles(full_name, avatar_url), categories(name, slug)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as ExperienceWithDetails;
  });

export const searchExperiences = createServerFn({ method: "GET" })
  .validator((query: string) => query)
  .handler(async ({ data: query }): Promise<ExperienceWithDetails[]> => {
    const sb = createSupabaseClient();
    const term = `%${query}%`;

    // Search across title, content, and category name
    const { data, error } = await sb
      .from("experiences")
      .select("*, profiles(full_name, avatar_url), categories!inner(name, slug)")
      .or(`title.ilike.${term},content.ilike.${term},categories.name.ilike.${term}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Fallback: try searching without category join
      const { data: fallbackData, error: fallbackError } = await sb
        .from("experiences")
        .select("*, profiles(full_name, avatar_url), categories(name, slug)")
        .or(`title.ilike.${term},content.ilike.${term}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fallbackError) return [];
      return (fallbackData as ExperienceWithDetails[]) ?? [];
    }

    return (data as ExperienceWithDetails[]) ?? [];
  });

export const getCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<Category[]> => {
    const sb = createSupabaseClient();
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
