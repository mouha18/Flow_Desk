import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// List notifications for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by creation time descending (newest first)
    return notifications.sort((a, b) => {
      const aTime = a._creationTime ?? 0;
      const bTime = b._creationTime ?? 0;
      return bTime - aTime;
    });
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
    type: v.string(),
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
