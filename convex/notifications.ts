import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getAuthUser } from "./lib/auth";

/**
 * Internal mutation to create a notification
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    contractId: v.optional(v.id("contracts")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      contractId: args.contractId,
      message: args.message,
      read: false,
    });
  },
});

/**
 * List all notifications for the authenticated user
 */
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUser(ctx);

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});

/**
 * Mark a notification as read
 */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    await ctx.db.patch(notification._id, { read: true });

    return { success: true };
  },
});

/**
 * Mark all notifications as read
 */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUser(ctx);

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return { count: unreadNotifications.length };
  },
});
