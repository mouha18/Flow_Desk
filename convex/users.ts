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

// Get user by ID (for looking up other users like freelancers)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (!user) return null;

    // Get role from userRoles table
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: userRole?.role ?? null,
    };
  },
});

// Get user by email (for auto-filling client name in contract creation)
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const emailLower = args.email.toLowerCase();
    
    // Query all users and filter by email (authTables doesn't expose email index)
    // In production, you'd want to add an email index to users table
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.email?.toLowerCase() === emailLower);
    
    if (!user) return null;


    // Get role from userRoles table
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
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
    if (!userId) {
      // Silently skip if not authenticated (can happen during login race condition)
      console.log("registerPushToken: user not authenticated yet, skipping");
      return null;
    }

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

// Get push tokens for a user (used by push notification actions)
export const getPushTokens = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPushTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.name !== undefined) {
      await ctx.db.patch("users", userId, { name: args.name });
    }
    return null;
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
