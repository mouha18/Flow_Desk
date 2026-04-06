import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { getAuthUser, getUserRole, requireRole } from "./lib/auth";

/**
 * Create a new contract (freelancer only)
 */
export const create = mutation({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    clientPseudo: v.string(),
    title: v.string(),
    pricingType: v.union(v.literal("fixed"), v.literal("hourly")),
    fixedPrice: v.optional(v.number()),
    paymentTiming: v.union(v.literal("now"), v.literal("later")),
    paymentMethod: v.union(
      v.literal("stripe"),
      v.literal("naboo_orange"),
      v.literal("naboo_wave")
    ),
    aiEmailTone: v.union(
      v.literal("formal"),
      v.literal("friendly"),
      v.literal("casual")
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");

    // Validate fixed price is provided for fixed pricing
    if (args.pricingType === "fixed" && !args.fixedPrice) {
      throw new ConvexError("fixedPrice is required for fixed pricing type");
    }

    const contractId = await ctx.db.insert("contracts", {
      freelancerId: userId,
      clientId: undefined, // Set when client registers
      clientEmail: args.clientEmail,
      clientName: args.clientName,
      clientPseudo: args.clientPseudo,
      title: args.title,
      status: "pending",
      pricingType: args.pricingType,
      fixedPrice: args.fixedPrice,
      paymentTiming: args.paymentTiming,
      paymentMethod: args.paymentMethod,
      aiEmailTone: args.aiEmailTone,
      completionPercent: 0,
      deliverableLink: undefined,
    });

    // TODO Sprint 3: Schedule AI email generation action
    // await ctx.scheduler.runAfter(0, internal.actions.ai.generateOutreachEmail, {
    //   contractId,
    // });

    return { contractId, status: "pending" as const };
  },
});

/**
 * List all contracts for the authenticated freelancer
 */
export const listByFreelancer = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireRole(ctx, "freelancer");

    return await ctx.db
      .query("contracts")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", userId))
      .order("desc")
      .take(100);
  },
});

/**
 * List all contracts for the authenticated client
 */
export const listByClient = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireRole(ctx, "client");

    return await ctx.db
      .query("contracts")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .order("desc")
      .take(100);
  },
});

/**
 * Get a single contract by ID
 * Both freelancer and client can view if they're part of the contract
 */
export const getById = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUser(ctx);
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    // Check access: must be freelancer or client of this contract
    if (
      contract.freelancerId !== userId &&
      contract.clientId !== userId
    ) {
      throw new ConvexError("UNAUTHORIZED");
    }

    return contract;
  },
});

/**
 * Client accepts a contract
 */
export const accept = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "client");
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    // Verify this client is the intended recipient
    if (contract.clientId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    if (contract.status !== "pending") {
      throw new ConvexError("Contract is not pending");
    }

    await ctx.db.patch(contract._id, { status: "active" });

    // Create notification for freelancer
    await ctx.runMutation(internal.notifications.create, {
      userId: contract.freelancerId,
      type: "contract_accepted",
      contractId: contract._id,
      message: `${contract.clientName} accepted your contract "${contract.title}"`,
    });

    // TODO Sprint 3: Send email + push notification
    // await ctx.scheduler.runAfter(0, internal.actions.email.onContractAccepted, {
    //   contractId: contract._id,
    // });

    return { status: "active" as const };
  },
});

/**
 * Client declines a contract
 */
export const decline = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "client");
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    if (contract.clientId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    if (contract.status !== "pending") {
      throw new ConvexError("Contract is not pending");
    }

    await ctx.db.patch(contract._id, { status: "declined" });

    // Create notification for freelancer
    await ctx.runMutation(internal.notifications.create, {
      userId: contract.freelancerId,
      type: "contract_declined",
      contractId: contract._id,
      message: `${contract.clientName} declined your contract "${contract.title}"`,
    });

    return { status: "declined" as const };
  },
});

/**
 * Update deliverable link (freelancer only)
 */
export const updateDeliverableLink = mutation({
  args: {
    contractId: v.id("contracts"),
    deliverableLink: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");
    const contract = await ctx.db.get(args.contractId);

    if (!contract || contract.freelancerId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    await ctx.db.patch(contract._id, {
      deliverableLink: args.deliverableLink,
    });

    return { success: true };
  },
});

/**
 * Internal mutation to recalculate completion percent based on tasks
 */
export const updateCompletionPercent = internalMutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();

    if (tasks.length === 0) {
      await ctx.db.patch(args.contractId, { completionPercent: 0 });
      return;
    }

    const completedCount = tasks.filter((t) => t.status === "completed").length;
    const completionPercent = Math.round((completedCount / tasks.length) * 100);

    await ctx.db.patch(args.contractId, { completionPercent });

    // If 100% complete, notify client
    if (completionPercent === 100) {
      const contract = await ctx.db.get(args.contractId);
      if (contract?.clientId) {
        await ctx.runMutation(internal.notifications.create, {
          userId: contract.clientId,
          type: "task_complete",
          contractId: contract._id,
          message: `Project "${contract.title}" is 100% complete!`,
        });
      }
    }
  },
});
