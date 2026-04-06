import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current authenticated user
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get("users", userId);
    if (!user) return null;

    // Get role from userRoles table
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: userRole?.role ?? null,
    };
  },
});

// Register push token for notifications
export const registerPushToken = mutation({
  args: { pushToken: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Upsert: remove existing entries with same token, then insert new one
    const existing = await ctx.db
      .query("userPushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.pushToken))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert("userPushTokens", {
      userId,
      token: args.pushToken,
      platform: "android",
      createdAt: Date.now(),
    });
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    pseudo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Build update object with only provided fields
    const updates: { name?: string; pseudo?: string } = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.pseudo !== undefined) updates.pseudo = args.pseudo;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await ctx.db.patch("users", userId, updates);

    return { success: true };
  },
});

// Set or update user role (freelancer or client) — called after registration
export const setUserRole = mutation({
  args: {
    role: v.union(v.literal("freelancer"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Remove any existing role entries for this user
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert the new role
    await ctx.db.insert("userRoles", {
      userId,
      role: args.role,
      createdAt: Date.now(),
    });

    return null;
  },
});
