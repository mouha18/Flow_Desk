import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// List messages by contractId (paginated, ordered by creation time ascending - oldest first, newest at bottom)
export const listByContract = query({
  args: {
    contractId: v.id("contracts"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // SECURITY: Verify contract exists
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");

    // SECURITY: Verify user is a party to the contract
    if (contract.freelancerId !== userId && contract.clientId !== userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Return paginated messages ordered by _creationTime ascending (oldest first, newest at bottom)
    return await ctx.db
      .query("messages")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .order("asc")
      .paginate(args.paginationOpts);
  },
});

// Get unread message count for a user on a specific contract
export const getUnreadCount = query({
  args: {
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;


    // SECURITY: Verify user is a party to the contract
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) return 0;
    if (contract.freelancerId !== userId && contract.clientId !== userId) {
      return 0;
    }

    // Get last read timestamp for this user on this contract
    const readStatus = await ctx.db
      .query("chatReadStatus")
      .withIndex("by_user_contract", (q) => q.eq("userId", userId).eq("contractId", args.contractId))
      .first();
    const lastReadAt = readStatus?.lastReadAt ?? 0;

    // Count messages where _creationTime > lastReadAt and senderId != userId
    // Use database-level filter for efficiency
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .filter((q) =>
        q.and(
          q.gt(q.field("_creationTime"), lastReadAt),
          q.neq(q.field("senderId"), userId)
        )
      )
      .collect();

    return messages.length;
  },
});

// Get unread counts for all contracts for the current user
export const getUnreadCountsByContract = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return {};

    // Get all contracts for this user (as freelancer or client)
    const freelancerContracts = await ctx.db
      .query("contracts")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", userId))
      .collect();
    
    const clientContracts = await ctx.db
      .query("contracts")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .collect();

    // Combine and dedupe
    const contractMap = new Map<string, typeof freelancerContracts[0]>();
    freelancerContracts.forEach(c => contractMap.set(c._id, c));
    clientContracts.forEach(c => contractMap.set(c._id, c));

    const unreadCounts: Record<string, number> = {};

    for (const contract of contractMap.values()) {
      // Get last read timestamp for this user on this contract
      const readStatus = await ctx.db
        .query("chatReadStatus")
        .withIndex("by_user_contract", (q) => q.eq("userId", userId).eq("contractId", contract._id))
        .first();
      const lastReadAt = readStatus?.lastReadAt ?? 0;

      // Count unread messages using database-level filter
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_contract", (q) => q.eq("contractId", contract._id))
        .filter((q) =>
          q.and(
            q.gt(q.field("_creationTime"), lastReadAt),
            q.neq(q.field("senderId"), userId)
          )
        )
        .collect();

      
      const unreadCount = messages.length;
      if (unreadCount > 0) {
        unreadCounts[contract._id] = unreadCount;
      }
    }

    return unreadCounts;
  },
});


// Mark chat as read (update lastReadAt for current user on this contract)
export const markChatRead = mutation({
  args: {
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");


    // SECURITY: Verify user is a party to the contract
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId && contract.clientId !== userId) {
      throw new ConvexError("Not authorized to mark read for this contract");
    }

    const now = Date.now();

    // Check if read status exists
    const existing = await ctx.db
      .query("chatReadStatus")
      .withIndex("by_user_contract", (q) => q.eq("userId", userId).eq("contractId", args.contractId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, { lastReadAt: now });
    } else {
      // Insert new
      await ctx.db.insert("chatReadStatus", {
        userId,
        contractId: args.contractId,
        lastReadAt: now,
      });
    }
  },
});

// Send a message
export const send = mutation({
  args: {
    contractId: v.id("contracts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Verify contract exists
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");

    // Verify user is either the freelancer or client on this contract
    const isFreelancer = contract.freelancerId === userId;
    const isClient = contract.clientId === userId;

    if (!isFreelancer && !isClient) {
      throw new ConvexError("Only contract participants can send messages");
    }

    const messageId = await ctx.db.insert("messages", {
      contractId: args.contractId,
      senderId: userId,
      content: args.content,
    });

    return messageId;
  },
});
