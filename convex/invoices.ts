import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Type assertion for API access
// The internal API from Convex's generated types doesn't correctly expose all modules
// via dot notation (particularly modules with slashes like "actions/push").
// Using documented `as any` cast to enable bracket notation access pattern.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internalTyped = internal as any;

// Line item type matching schema
const lineItemType = v.object({
  description: v.string(),
  hours: v.optional(v.number()),
  rate: v.optional(v.number()),
  amount: v.number(),
});

// Get invoice by ID (used by actions like sendInvoiceEmail)
export const getById = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const invoice = await ctx.db.get("invoices", args.invoiceId);
    if (!invoice) return null;

    // Verify user is a party to the contract
    const contract = await ctx.db.get("contracts", invoice.contractId);
    if (!contract) return null;
    if (contract.freelancerId !== userId && contract.clientId !== userId) return null;

    return invoice;
  },
});

// Get invoice for a specific contract
export const getByContract = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const invoice = await ctx.db
      .query("invoices")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .first();

    if (!invoice) return null;

    // Verify user is a party to the contract
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) return null;
    if (contract.freelancerId !== userId && contract.clientId !== userId) return null;

    return invoice;
  },
});

// List all invoices for freelancer's contracts
export const listByFreelancer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];


    // Verify user is a freelancer
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "freelancer") {
      return [];
    }

    // Get all contracts for this freelancer
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", userId))
      .collect();

    // Get all invoices for these contracts
    // Only include invoices where escrow has been released (actual earnings)
    const invoices = [];
    for (const contract of contracts) {
      const invoice = await ctx.db
        .query("invoices")
        .withIndex("by_contract", (q) => q.eq("contractId", contract._id))
        .first();
      // Only include if escrow is released (matches getFreelancerEarnings logic)
      if (invoice && contract.escrowStatus === "released") {
        invoices.push(invoice);
      }
    }

    return invoices;
  },
});

// List all invoices for client's contracts
export const listByClient = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify user is a client
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();


    if (!userRole || userRole.role !== "client") {
      return [];
    }

    // Get all contracts where this user is the client
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .collect();
    // Get all paid invoices for these contracts
    const invoices = [];
    for (const contract of contracts) {
      const invoice = await ctx.db
        .query("invoices")
        .withIndex("by_contract", (q) => q.eq("contractId", contract._id))
        .first();
      if (invoice && invoice.status === "paid") {
        invoices.push(invoice);
      }
    }
    return invoices;
  },
});

// Calculate total earnings for the authenticated freelancer
export const getFreelancerEarnings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { totalEarnings: 0, paidInvoicesCount: 0 };

    // Verify user is a freelancer
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "freelancer") {
      return { totalEarnings: 0, paidInvoicesCount: 0 };
    }

    // Get all contracts for this freelancer
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", userId))
      .collect();

    // Sum up all paid invoice totals
    let totalEarnings = 0;
    let paidInvoicesCount = 0;

    for (const contract of contracts) {
      const invoice = await ctx.db
        .query("invoices")
        .withIndex("by_contract", (q) => q.eq("contractId", contract._id))
        .first();
      // Only count earnings when escrow is released (client has approved)
      // This ensures money is held in escrow until client satisfaction
      if (invoice && invoice.status === "paid" && contract.escrowStatus === "released") {
        totalEarnings += invoice.total;
        paidInvoicesCount++;
      }
    }

    return { totalEarnings, paidInvoicesCount };
  },
});

// Create a new invoice (draft status)
export const create = mutation({
  args: {
    contractId: v.id("contracts"),
    lineItems: v.array(lineItemType),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    aiGenerated: v.boolean(),
    notes: v.optional(v.string()),
    deliverables: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Verify user is a freelancer and owns this contract
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("Not authorized to create invoice for this contract");
    }

    // Check if invoice already exists for this contract
    const existingInvoice = await ctx.db
      .query("invoices")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .first();
    if (existingInvoice) {
      throw new ConvexError("Invoice already exists for this contract");
    }

    const invoiceId = await ctx.db.insert("invoices", {
      contractId: args.contractId,
      lineItems: args.lineItems,
      subtotal: args.subtotal,
      tax: args.tax,
      total: args.total,
      aiGenerated: args.aiGenerated,
      notes: args.notes,
      deliverables: args.deliverables,
      status: "draft",
      paymentSimulated: false,
    });

    return invoiceId;
  },
});

// Internal mutation to create invoice with AI-generated data
export const _createInvoiceFromAI = mutation({
  args: {
    contractId: v.id("contracts"),
    lineItems: v.array(v.object({
      description: v.string(),
      hours: v.number(),
      rate: v.number(),
      amount: v.number(),
    })),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    notes: v.string(),
    aiGenerated: v.boolean(),
  },
  handler: async (ctx, args) => {
    const invoiceId = await ctx.db.insert("invoices", {
      contractId: args.contractId,
      lineItems: args.lineItems.map(item => ({
        description: item.description,
        hours: item.hours,
        rate: item.rate,
        amount: item.amount,
      })),
      subtotal: args.subtotal,
      tax: args.tax,
      total: args.total,
      notes: args.notes,
      aiGenerated: args.aiGenerated,
      status: "draft",
      paymentSimulated: false,
    });
    return invoiceId;
  },
});

// Generate invoice with AI from completed tasks
// This mutation schedules the AI action which creates the invoice directly
export const generateWithAI = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Verify user is a freelancer and owns this contract
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("Not authorized to generate invoice for this contract");
    }

    // Check if invoice already exists for this contract
    const existingInvoice = await ctx.db
      .query("invoices")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .first();
    if (existingInvoice) {
      throw new ConvexError("Invoice already exists for this contract. Please edit or delete it first.");
    }

    // Fetch tasks for the contract (to pass to AI action)
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();

    // Schedule the AI action to generate and create the invoice
    // Pass contract and tasks data since action has no DB access
    await ctx.scheduler.runAfter(0, internalTyped.ai.generateInvoiceFromTasks, {
      contractId: args.contractId,
      userId,
      contract: {
        title: contract.title,
        hourlyRate: contract.hourlyRate,
      },
      tasks: tasks.map((t) => ({
        title: t.title,
        timeSpent: t.timeSpent,
        status: t.status,
        hourlyRate: contract.hourlyRate,
      })),
    });

    return null;
  },
});

// Update an existing invoice (only draft invoices can be updated)
export const update = mutation({
  args: {
    invoiceId: v.id("invoices"),
    lineItems: v.optional(v.array(lineItemType)),
    subtotal: v.optional(v.number()),
    tax: v.optional(v.number()),
    total: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const invoice = await ctx.db.get("invoices", args.invoiceId);
    if (!invoice) throw new ConvexError("Invoice not found");

    // Verify user owns the contract
    const contract = await ctx.db.get("contracts", invoice.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("Not authorized to update this invoice");
    }

    // Only draft invoices can be updated
    if (invoice.status !== "draft") {
      throw new ConvexError("Only draft invoices can be updated");
    }

    const updates: Record<string, any> = {};
    if (args.lineItems !== undefined) updates.lineItems = args.lineItems;
    if (args.subtotal !== undefined) updates.subtotal = args.subtotal;
    if (args.tax !== undefined) updates.tax = args.tax;
    if (args.total !== undefined) updates.total = args.total;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch("invoices", args.invoiceId, updates);
    return null;
  },
});

// Send invoice to client
export const send = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const invoice = await ctx.db.get("invoices", args.invoiceId);
    if (!invoice) throw new ConvexError("Invoice not found");

    // Verify user owns the contract
    const contract = await ctx.db.get("contracts", invoice.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("Not authorized to send this invoice");
    }

    // Only draft invoices can be sent
    if (invoice.status !== "draft") {
      throw new ConvexError("Only draft invoices can be sent");
    }

    // Update status to sent
    await ctx.db.patch("invoices", args.invoiceId, {
      status: "sent",
    });

    // Schedule push notification and email to client
    // Pass clientId for push notification (the notification goes TO the client)
    // Pass invoice/contract data directly since actions can't run authenticated queries
    try {
      await ctx.scheduler.runAfter(0, internalTyped.actions.push.sendInvoiceReceivedNotification, {
        userId: contract.clientId!,
        invoiceId: args.invoiceId,
        contractId: invoice.contractId,
      });
      // Strip internal Convex fields before passing to action
      const { _creationTime, _id, ...invoiceForAction } = invoice;
      
      await ctx.scheduler.runAfter(0, internalTyped.email.sendInvoiceEmail, {
        invoiceId: args.invoiceId,
        invoice: invoiceForAction,
        contract: {
          title: contract.title,
          clientEmail: contract.clientEmail,
          clientName: contract.clientName,
          freelancerId: contract.freelancerId,
        },
      });
    } catch (e) {
      console.error("Failed to schedule invoice notifications:", e);
    }

    return null;
  },
});

// Simulate payment (client pays invoice)
export const simulatePayment = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const invoice = await ctx.db.get("invoices", args.invoiceId);
    if (!invoice) throw new ConvexError("Invoice not found");

    // Verify user is the client for this contract
    const contract = await ctx.db.get("contracts", invoice.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.clientId !== userId) {
      throw new ConvexError("Only the contract client can simulate payment");
    }

    // Only sent invoices can be paid
    if (invoice.status !== "sent") {
      throw new ConvexError("Only sent invoices can be paid");
    }

    // Update invoice status to paid
    await ctx.db.patch("invoices", args.invoiceId, {
      status: "paid",
      paymentSimulated: true,
    });

    // Handle escrow based on payment timing
    // Money is always held in escrow until the freelancer delivers work
    // For "Pay Later" contracts: Set escrowStatus to "held" (money held until delivery)
    const escrowStatus = "held";
    
    // For Pay Later, copy deliverables from invoice to contract so client can see them
    const updates: Record<string, any> = { escrowStatus };
    if (contract.paymentTiming === "later" && invoice.deliverables) {
      updates.deliverables = invoice.deliverables;
    }
    
    await ctx.db.patch(contract._id, updates);

    // Schedule push notification and email to freelancer
    try {
      await ctx.scheduler.runAfter(0, internalTyped.actions.push.sendPaymentReceivedNotification, {
        userId: contract.freelancerId,
        invoiceId: args.invoiceId,
        contractId: invoice.contractId,
      });
      await ctx.scheduler.runAfter(0, internalTyped.email.sendPaymentReceivedEmail, {
        invoiceId: args.invoiceId,
      });
    } catch (e) {
      console.error("Failed to schedule payment notifications:", e);
    }

    return null;
  },
});

// Simulate upfront payment for Pay Now contracts
export const simulatePaymentNow = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new ConvexError("Contract not found");

    // Verify user is the client
    if (contract.clientId !== userId) {
      throw new ConvexError("Only the contract client can make upfront payment");
    }

    // Verify payment timing is "now"
    if (contract.paymentTiming !== "now") {
      throw new ConvexError("This mutation is only for Pay Now contracts");
    }

    // Verify escrow hasn't been paid already
    if (contract.escrowStatus === "held" || contract.escrowStatus === "delivered" || contract.escrowStatus === "released") {
      throw new ConvexError("Payment has already been made for this contract");
    }

    // Calculate the invoice total - for Pay Now use fixed price
    const total = contract.fixedPrice ?? 0;

    // Create invoice for traceability (even though payment is immediate)
    const lineItems = [{
      description: contract.title,
      hours: undefined,
      rate: undefined,
      amount: total,
    }];

    const invoiceId = await ctx.db.insert("invoices", {
      contractId: contract._id,
      lineItems,
      subtotal: total,
      tax: 0,
      total,
      aiGenerated: false,
      notes: "Upfront payment - Pay Now",
      deliverables: contract.deliverables,
      status: "paid", // Payment is immediate for Pay Now
      paymentSimulated: true,
    });

    // Update contract: set escrow to held (don't change status - acceptContract already did that)
    await ctx.db.patch(contract._id, {
      escrowStatus: "held",
    });

    // Schedule notification to freelancer
    try {
      await ctx.scheduler.runAfter(0, internalTyped.actions.push.sendPaymentReceivedNotification, {
        userId: contract.freelancerId!,
        contractId: contract._id,
        invoiceId,
      });
    } catch (e) {
      console.error("Failed to schedule notification:", e);
    }

    return null;
  },
});
