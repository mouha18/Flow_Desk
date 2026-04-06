import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";
import { getAuthUser } from "./lib/auth";

/**
 * Send a message in a contract chat
 */
export const send = mutation({
  args: {
    contractId: v.id("contracts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUser(ctx);
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    // Check access
    if (
      contract.freelancerId !== userId &&
      contract.clientId !== userId
    ) {
      throw new ConvexError("UNAUTHORIZED");
    }

    const messageId = await ctx.db.insert("messages", {
      contractId: args.contractId,
      senderId: userId,
      content: args.content,
    });

    // TODO Sprint 3: Create notification for the other party
    // const recipientId = userId === contract.freelancerId
    //   ? contract.clientId
    //   : contract.freelancerId;
    // if (recipientId) {
    //   await ctx.runMutation(internal.notifications.create, {
    //     userId: recipientId,
    //     type: "new_message",
    //     contractId: args.contractId,
    //     message: `New message in "${contract.title}"`,
    //   });
    // }

    return { messageId };
  },
});

/**
 * List messages for a contract (paginated, newest first)
 */
export const listByContract = query({
  args: {
    contractId: v.id("contracts"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUser(ctx);
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    // Check access
    if (
      contract.freelancerId !== userId &&
      contract.clientId !== userId
    ) {
      throw new ConvexError("UNAUTHORIZED");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
