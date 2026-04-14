import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex Auth tables
  ...authTables,

  // App-specific tables
  contracts: defineTable({
    freelancerId: v.id("users"),
    clientId: v.optional(v.id("users")),
    clientEmail: v.string(),
    clientName: v.optional(v.string()),
    clientPseudo: v.optional(v.string()),
    title: v.string(),
    status: v.union(
      v.literal("pending"),      // Awaiting acceptance
      v.literal("active"),        // Work in progress
      v.literal("completed"),    // Deprecated: Work completed but not yet paid/escrow released (use "finished" instead)
      v.literal("declined"),      // Offer declined by freelancer
      v.literal("finished"),      // Work completed AND escrow released to freelancer (final state)
      v.literal("disputed")       // Payment dispute in progress
    ),
    escrowStatus: v.optional(v.union(
      v.literal("held"),
      v.literal("delivered"),
      v.literal("released"),
      v.literal("refunded")
    )),
    escrowPaidAt: v.optional(v.number()),
    escrowReleasedAt: v.optional(v.number()),
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
    completionPercent: v.number(),
    deliverableLink: v.optional(v.string()),
    deliverables: v.optional(v.array(
      v.object({
        name: v.string(),
        url: v.string(),
      })
    )),
  })
    .index("by_freelancer", ["freelancerId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_clientEmail", ["clientEmail"]),

  tasks: defineTable({
    contractId: v.id("contracts"),
    title: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    timeSpent: v.optional(v.number()),
  })
    .index("by_contract", ["contractId"])
    .index("by_contract_status", ["contractId", "status"]),

  messages: defineTable({
    contractId: v.id("contracts"),
    senderId: v.id("users"),
    content: v.string(),
  })
    .index("by_contract", ["contractId"]),

  invoices: defineTable({
    contractId: v.id("contracts"),
    lineItems: v.array(
      v.object({
        description: v.string(),
        hours: v.optional(v.number()),
        rate: v.optional(v.number()),
        amount: v.number(),
      })
    ),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    aiGenerated: v.boolean(),
    notes: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid")),
    paymentSimulated: v.boolean(),
    deliverables: v.optional(v.array(
      v.object({ name: v.string(), url: v.string() })
    )),
  })
    .index("by_contract", ["contractId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("contract_invite"),
      v.literal("contract_accepted"),
      v.literal("contract_declined"),
      v.literal("task_complete"),
      v.literal("invoice_received"),
      v.literal("payment_received"),
      v.literal("new_message"),
      v.literal("time_tracked"),
      v.literal("project_complete"),
      v.literal("deliverable_released")
    ),
    contractId: v.optional(v.id("contracts")),
    message: v.string(),
    read: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),

  userPushTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    platform: v.optional(v.union(v.literal("android"), v.literal("ios"), v.literal("web"))),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),

  // User roles — one role per user (upsert pattern)
  userRoles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("freelancer"), v.literal("client")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Email lookup table — enables O(1) email lookups instead of full table scan
  userEmails: defineTable({
    userId: v.id("users"),
    email: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_user", ["userId"]),

  // Chat read status — tracks lastReadAt per user per contract
  chatReadStatus: defineTable({
    userId: v.id("users"),
    contractId: v.id("contracts"),
    lastReadAt: v.number(),
  })
    .index("by_user_contract", ["userId", "contractId"]),

  // Notification preferences — per-user settings for which notification types to receive
  notificationPreferences: defineTable({
    userId: v.id("users"),
    key: v.string(), // e.g., "contract_invite", "payment_received", etc.
    enabled: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_key", ["userId", "key"]),
});
