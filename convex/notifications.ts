import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// List notifications for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get unread notification count for current user
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    return unreadNotifications.length;
  },
});

// Create a notification (internal helper - called by other Convex functions)
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("contract_invite"),
      v.literal("contract_accepted"),
      v.literal("contract_declined"),
      v.literal("task_complete"),
      v.literal("invoice_received"),
      v.literal("payment_received"),
      v.literal("new_message"),
      v.literal("time_tracked"),
      v.literal("project_complete"),
      v.literal("deliverable_released")
    ),
    contractId: v.optional(v.id("contracts")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Not authenticated");

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      contractId: args.contractId,
      message: args.message,
      read: false,
    });

    return notificationId;
  },
});

// Mark a single notification as read
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const notification = await ctx.db.get("notifications", args.notificationId);
    if (!notification) throw new ConvexError("Notification not found");

    // Verify this notification belongs to the current user
    if (notification.userId !== userId) {
      throw new ConvexError("Notification not found");
    }

    await ctx.db.patch("notifications", args.notificationId, {
      read: true,
    });

    return null;
  },
});

// Mark all user notifications as read
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    // Mark all unread notifications as read
    for (const notification of notifications) {
      await ctx.db.patch("notifications", notification._id, {
        read: true,
      });
    }

    return null;
  },
});

// Notification type keys for preference management
export const NOTIFICATION_TYPE_KEYS = [
  "contract_invite",
  "contract_accepted",
  "contract_declined",
  "task_complete",
  "invoice_received",
  "payment_received",
  "new_message",
  "time_tracked",
  "project_complete",
  "deliverable_released",
] as const;

// List all notification preferences for current user as a map
export const listUserNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Build map from stored preferences
    const prefsMap: Record<string, boolean> = {};
    for (const pref of preferences) {
      prefsMap[pref.key] = pref.enabled;
    }

    // Return as a map for easy access, defaulting all to true if not set
    return NOTIFICATION_TYPE_KEYS.reduce((acc, key) => {
      acc[key] = prefsMap[key] !== undefined ? prefsMap[key] : true;
      return acc;
    }, {} as Record<string, boolean>);
  },
});

// Update a single notification preference (upsert pattern)
export const updateNotificationPreference = mutation({
  args: { key: v.string(), enabled: v.boolean() },
  handler: async (ctx, { key, enabled }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Validate key is a known notification type
    if (!NOTIFICATION_TYPE_KEYS.includes(key as any)) {
      throw new ConvexError("Invalid notification type key");
    }

    // Upsert pattern: check if exists, then update or insert
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { enabled });
    } else {
      await ctx.db.insert("notificationPreferences", {
        userId,
        key,
        enabled,
      });
    }
  },
});
