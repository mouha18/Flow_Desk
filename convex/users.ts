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
    
    // Use indexed lookup instead of full table scan
    const userEmailEntry = await ctx.db
      .query("userEmails")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();
    
    if (!userEmailEntry) return null;

    const user = await ctx.db.get("users", userEmailEntry.userId);
    if (!user) return null;

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
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.name !== undefined) {
      await ctx.db.patch("users", userId, { name: args.name });
    }
    
    // If email changed, update the userEmails lookup table
    if (args.email !== undefined) {
      const existingEmailEntry = await ctx.db
        .query("userEmails")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (existingEmailEntry) {
        await ctx.db.patch("userEmails", existingEmailEntry._id, { email: args.email.toLowerCase() });
      } else {
        // This shouldn't happen normally, but handle case where entry doesn't exist yet
        await ctx.db.insert("userEmails", {
          userId,
          email: args.email.toLowerCase(),
        });
      }
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

    // Also populate the userEmails lookup table for indexed email lookups
    const user = await ctx.db.get("users", userId);
    if (user?.email) {
      // Check if entry already exists
      const existingEmailEntry = await ctx.db
        .query("userEmails")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (!existingEmailEntry) {
        await ctx.db.insert("userEmails", {
          userId,
          email: user.email.toLowerCase(),
        });
      }
    }

    return null;
  },
});

// Backfill userEmails table for existing users (run once, then can be removed)
export const backfillUserEmails = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let count = 0;
    
    for (const user of users) {
      if (!user.email) continue;
      
      const existing = await ctx.db
        .query("userEmails")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      
      if (!existing) {
        await ctx.db.insert("userEmails", {
          userId: user._id,
          email: user.email.toLowerCase(),
        });
        count++;
      }
    }
    
    return { count, total: users.length };
  },
});
