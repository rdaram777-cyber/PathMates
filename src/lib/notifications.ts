import { createServerFn } from "@tanstack/react-start";
import { createSupabaseClient } from "~/db";
import type { Database } from "~/lib/database.types";

// ---- Types ----

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// ---- Get current user's notifications ----

export const getNotifications = createServerFn({ method: "GET" }).handler(
  async (): Promise<Notification[]> => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    const { data, error } = await sb
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return [];
    return (data as Notification[]) ?? [];
  },
);

// ---- Get unread count ----

export const getUnreadCount = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return 0;

    const { count, error } = await sb
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) return 0;
    return count ?? 0;
  },
);

// ---- Mark single as read ----

export const markAsRead = createServerFn({ method: "POST" })
  .validator((notificationId: string) => notificationId)
  .handler(async ({ data: notificationId }) => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    const { error } = await sb
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---- Mark all as read ----

export const markAllAsRead = createServerFn({ method: "POST" }).handler(
  async () => {
    const sb = createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("You must be logged in.");

    const { error } = await sb
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) throw new Error(error.message);
    return { success: true };
  },
);

// ---- Create notification (internal helper, exported for use in other server fns) ----

export const createNotification = createServerFn({ method: "POST" })
  .validator(
    (data: {
      userId: string;
      type: string;
      title: string;
      message?: string;
      link?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sb = createSupabaseClient();

    const { error } = await sb.from("notifications").insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message ?? null,
      link: data.link ?? null,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });
