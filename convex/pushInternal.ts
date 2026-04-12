import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to send Expo push notification.
 * This is called by the sendPushNotification action.
 * Must be in a non-Node.js file since it's a mutation.
 */
export const _sendPushToUser = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    contractId: v.optional(v.id("contracts")),
    invoiceId: v.optional(v.id("invoices")),
  },
  handler: async (ctx, args) => {
    // Get all push tokens for this user directly from database
    const tokens = await ctx.db
      .query("userPushTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (!tokens || tokens.length === 0) {
      return null;
    }

    // Build notification messages for all tokens
    const messages = tokens.map((tokenRecord: { token: string }) => ({
      to: tokenRecord.token,
      title: args.title,
      body: args.body,
      data: {
        contractId: args.contractId,
        invoiceId: args.invoiceId,
      },
      sound: "default" as const,
      priority: "high" as const,
    }));

    // Send to Expo Push API
    const expoToken = process.env.EXPO_ACCESS_TOKEN;
    if (!expoToken) {
      console.warn("EXPO_ACCESS_TOKEN not configured, skipping push notification");
      return null;
    }

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${expoToken}`,
        },
        body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Expo Push API error:", response.status, errorText);
        return null;
      }

      const result = await response.json();
      console.log("Push notification sent:", result);

      return null;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return null;
    }
  },
});
