"use node";
import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

// Type assertion for internal API access
const internalAny = internal as any;

/**
 * Expo Push Notification integration.
 * Sends push notifications to user devices via Expo's push service.
 */

/**
 * Send a push notification to a user (scheduled from mutation)
 */
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(
      v.object({
        contractId: v.optional(v.id("contracts")),
        invoiceId: v.optional(v.id("invoices")),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Schedule the internal mutation to send push
    await ctx.scheduler.runAfter(0, internalAny.pushInternal._sendPushToUser, {
      userId: args.userId,
      title: args.title,
      body: args.body,
      contractId: args.data?.contractId,
      invoiceId: args.data?.invoiceId,
    });

    return null;
  },
});

/**
 * Send task completion notification to client
 */
export const sendTaskCompleteNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(
      v.object({
        contractId: v.optional(v.id("contracts")),
        invoiceId: v.optional(v.id("invoices")),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internalAny.pushInternal._sendPushToUser, {
      userId: args.userId,
      title: args.title,
      body: args.body,
      contractId: args.data?.contractId,
      invoiceId: args.data?.invoiceId,
    });

    return null;
  },
});

/**
 * Send invoice received notification to client
 */
export const sendInvoiceReceivedNotification = action({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
    contractId: v.id("contracts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internalAny.pushInternal._sendPushToUser, {
      userId: args.userId,
      title: "New Invoice Received 📄",
      body: "You have received a new invoice. Please review and complete payment.",
      contractId: args.contractId,
      invoiceId: args.invoiceId,
    });

    return null;
  },
});

/**
 * Send payment received notification to freelancer
 * invoiceId is optional for Pay Now contracts where payment happens upfront (no invoice yet)
 */
export const sendPaymentReceivedNotification = action({
  args: {
    userId: v.id("users"),
    invoiceId: v.optional(v.id("invoices")),
    contractId: v.id("contracts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internalAny.pushInternal._sendPushToUser, {
      userId: args.userId,
      title: "Payment Received! 💰",
      body: "Your client has completed payment. Please share the deliverable link.",
      contractId: args.contractId,
      invoiceId: args.invoiceId,
    });

    return null;
  },
});

/**
 * Send work delivered notification to client
 * Called when freelancer marks contract as delivered
 */
export const sendWorkDeliveredNotification = action({
  args: {
    contractId: v.id("contracts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await ctx.runQuery(api.contracts.getById, {
      contractId: args.contractId,
    });
    if (!contract || !contract.clientId) return null;

    await ctx.scheduler.runAfter(0, internalAny.pushInternal._sendPushToUser, {
      userId: contract.clientId,
      title: "Work Delivered! 🎉",
      body: "Your freelancer has submitted the work. Please review and approve.",
      contractId: args.contractId,
    });

    return null;
  },
});

/**
 * Send payment released notification to freelancer
 * Called when client approves work and releases payment
 */
export const sendPaymentReleasedNotification = action({
  args: {
    contractId: v.id("contracts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await ctx.runQuery(api.contracts.getById, {
      contractId: args.contractId,
    });
    if (!contract) return null;

    await ctx.scheduler.runAfter(0, internalAny.pushInternal._sendPushToUser, {
      userId: contract.freelancerId,
      title: "Payment Released! 💰",
      body: "Client approved the work. Your payment has been released.",
      contractId: args.contractId,
    });

    return null;
  },
});

/**
 * Send dispute notification to freelancer
 * Called when client raises a dispute about the work
 */
export const sendDisputeNotification = action({
  args: {
    contractId: v.id("contracts"),
    complaint: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await ctx.runQuery(api.contracts.getById, {
      contractId: args.contractId,
    });
    if (!contract) return null;

    await ctx.scheduler.runAfter(0, internalAny.pushInternal._sendPushToUser, {
      userId: contract.freelancerId,
      title: "Client Raised a Dispute ⚠️",
      body: "Client is not satisfied. Check your chat for details.",
      contractId: args.contractId,
    });

    return null;
  },
});
