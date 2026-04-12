import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Type assertion for internal API access to modules with slashes in path names
// This is needed because TypeScript doesn't naturally resolve "actions/ai" as a property
type InternalApi = typeof internal;
const internalAny = internal as any;

// List all contracts for current user (filtered by role)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole) return [];

    if (userRole.role === "freelancer") {
      const contracts = await ctx.db
        .query("contracts")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", userId))
        .collect();
      return contracts;
    } else {
      const user = await ctx.db.get("users", userId);
      const userEmail = user?.email?.toLowerCase();

      const byClientId = await ctx.db
        .query("contracts")
        .withIndex("by_client", (q) => q.eq("clientId", userId))
        .collect();

      const byEmailCandidate = await ctx.db
        .query("contracts")
        .withIndex("by_clientEmail", (q) => q.eq("clientEmail", userEmail as string))
        .collect();
      const byEmail = byEmailCandidate.filter(
        (c) => c.status === "pending"
      );

      const combined = [...byClientId, ...byEmail];
      const seen = new Set();
      const uniqueContracts = combined.filter((c) => {
        if (seen.has(c._id)) return false;
        seen.add(c._id);
        return true;
      });

      // Add freelancerName to each contract
      const freelancerIds = [...new Set(uniqueContracts.map(c => c.freelancerId))];
      const freelancers = await Promise.all(
        freelancerIds.map(id => ctx.db.get("users", id))
      );
      const freelancerMap = new Map(
        freelancers.filter(Boolean).map(f => [f!._id, f!.name])
      );

      return uniqueContracts.map(c => ({
        ...c,
        freelancerName: freelancerMap.get(c.freelancerId) ?? c.freelancerId,
      }));
    }
  },
});

// Get single contract by ID
export const getById = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get("contracts", args.contractId);
  },
});

// Freelancer creates a new contract (status: "pending")
export const create = mutation({
  args: {
    clientEmail: v.string(),
    title: v.string(),
    pricingType: v.union(v.literal("fixed"), v.literal("hourly")),
    fixedPrice: v.optional(v.number()),
    hourlyRate: v.optional(v.number()),
    paymentTiming: v.union(v.literal("now"), v.literal("later")),
    paymentMethod: v.union(
      v.literal("stripe"),
      v.literal("naboo_orange"),
      v.literal("naboo_wave")
    ),
    aiEmailTone: v.union(v.literal("formal"), v.literal("friendly"), v.literal("casual")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "freelancer") {
      throw new ConvexError("Only freelancers can create contracts");
    }

    // Auto-fill client name from users table using clientEmail
    const emailLower = args.clientEmail.toLowerCase();
    const allUsers = await ctx.db.query("users").collect();
    const clientUser = allUsers.find((u) => u.email?.toLowerCase() === emailLower);
    const clientName = clientUser?.name ?? args.clientEmail;

    const contractId = await ctx.db.insert("contracts", {
      freelancerId: userId,
      clientId: undefined,
      clientEmail: args.clientEmail,
      clientName: clientName,
      title: args.title,
      status: "pending",
      pricingType: args.pricingType,
      fixedPrice: args.fixedPrice,
      hourlyRate: args.hourlyRate,
      paymentTiming: args.paymentTiming,
      paymentMethod: args.paymentMethod,
      aiEmailTone: args.aiEmailTone,
      completionPercent: 0,
      deliverableLink: undefined,
      deliverables: [],
    });

    // Get freelancer name for the email
    const freelancer = await ctx.db.get("users", userId);
    const freelancerName = freelancer?.name ?? "Your freelancer";

    // Schedule AI outreach email
    await ctx.scheduler.runAfter(0, internalAny.ai.generateOutreachEmail, {
      clientEmail: args.clientEmail,
      clientName: clientName,
      freelancerName,
      contractTitle: args.title,
      tone: args.aiEmailTone,
    });

    return contractId;
  },
});

// Client accepts a contract (status: "active", clientId = current user)
export const accept = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "client") {
      throw new ConvexError("Only clients can accept contracts");
    }

    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.status !== "pending") {
      throw new ConvexError("Only pending contracts can be accepted");
    }

    await ctx.db.patch("contracts", args.contractId, {
      status: "active",
      clientId: userId,
    });

    // Schedule contract accepted emails
    await ctx.scheduler.runAfter(0, internalAny.email.sendContractAcceptedEmail, {
      contractId: args.contractId,
    });

    return null;
  },
});

// Client declines a contract (status: "declined")
export const decline = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "client") {
      throw new ConvexError("Only clients can decline contracts");
    }

    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.status !== "pending") {
      throw new ConvexError("Only pending contracts can be declined");
    }

    await ctx.db.patch("contracts", args.contractId, {
      status: "declined",
    });

    return null;
  },
});

// Add a deliverable to a contract
export const addDeliverable = mutation({
  args: {
    contractId: v.id("contracts"),
    name: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "freelancer") {
      throw new ConvexError("Only freelancers can add deliverables");
    }

    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("You can only add deliverables to your own contracts");
    }

    const currentDeliverables = contract.deliverables ?? [];
    await ctx.db.patch("contracts", args.contractId, {
      deliverables: [...currentDeliverables, { name: args.name, url: args.url }],
    });

    return null;
  },
});

// Remove a deliverable from a contract by index
export const removeDeliverable = mutation({
  args: {
    contractId: v.id("contracts"),
    index: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "freelancer") {
      throw new ConvexError("Only freelancers can remove deliverables");
    }

    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("You can only remove deliverables from your own contracts");
    }

    const currentDeliverables = contract.deliverables ?? [];
    if (args.index < 0 || args.index >= currentDeliverables.length) {
      throw new ConvexError("Invalid deliverable index");
    }

    const newDeliverables = currentDeliverables.filter((_, i) => i !== args.index);
    await ctx.db.patch("contracts", args.contractId, {
      deliverables: newDeliverables,
    });

    return null;
  },
});

// Freelancer submits completion with deliverables and triggers escrow delivery
// Step 3: Freelancer Submit Completion Mutation
export const submitCompletion = mutation({
  args: {
    contractId: v.id("contracts"),
    deliverables: v.array(v.object({
      name: v.string(),
      url: v.string(),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("Not authorized");
    }
    if (contract.escrowStatus !== "held") {
      throw new ConvexError("Contract is not in escrow");
    }

    // Update deliverables and escrow status
    await ctx.db.patch(contract._id, {
      deliverables: args.deliverables,
      escrowStatus: "delivered",
    });

    // Notify client via push
    await ctx.scheduler.runAfter(0, internalAny.actions.push.sendWorkDeliveredNotification, {
      contractId: contract._id,
    });

    return null;
  },
});

// Client approves delivery and releases escrow to freelancer
// Step 4: Client Approval Mutation
export const approveDelivery = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.clientId !== userId) {
      throw new ConvexError("Not authorized");
    }
    if (contract.escrowStatus !== "delivered") {
      throw new ConvexError("No delivery to approve");
    }

    // Release escrow - money to freelancer
    await ctx.db.patch(contract._id, {
      status: "finished",
      escrowStatus: "released",
      escrowReleasedAt: Date.now(),
    });

    // Notify freelancer
    await ctx.scheduler.runAfter(0, internalAny.actions.push.sendPaymentReleasedNotification, {
      contractId: contract._id,
    });

    return null;
  },
});

// Client disputes delivery and reopens contract for revision
// Step 5: Client Dispute Mutation
export const disputeDelivery = mutation({
  args: {
    contractId: v.id("contracts"),
    complaint: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.clientId !== userId) {
      throw new ConvexError("Not authorized");
    }
    if (contract.escrowStatus !== "delivered") {
      throw new ConvexError("No delivery to dispute");
    }

    // Reopen contract
    await ctx.db.patch(contract._id, {
      status: "active", // Reopen contract
      escrowStatus: "held", // Money still held
    });

    // Send complaint to chat with template
    const message = `Client not satisfied, here is his complain: ${args.complaint}`;
    await ctx.db.insert("messages", {
      contractId: contract._id,
      senderId: userId,
      content: message,
    });

    // Notify freelancer
    await ctx.scheduler.runAfter(0, internalAny.actions.push.sendDisputeNotification, {
      contractId: contract._id,
      complaint: args.complaint,
    });

    return null;
  },
});
