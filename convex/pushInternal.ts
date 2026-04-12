import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal action to send Expo push notification.
 * Uses internalAction because it performs network I/O (fetch to Expo Push API).
 * Database queries are done by the caller action and tokens are passed in.
 */
export const _sendPushToUser = internalAction({
  args: {
    tokens: v.array(
      v.object({
        token: v.string(),
      })
    ),
    title: v.string(),
    body: v.string(),
    contractId: v.optional(v.id("contracts")),
    invoiceId: v.optional(v.id("invoices")),
  },
  handler: async (ctx, args) => {
    if (!args.tokens || args.tokens.length === 0) {
      return null;
    }

    // Build notification messages for all tokens
    const messages = args.tokens.map((tokenRecord) => ({
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
