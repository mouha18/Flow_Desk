"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Type assertion for internal API access
// The internal API from Convex's generated types doesn't correctly expose all modules
// via dot notation. Using documented `as any` cast to enable access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internalTyped = internal as any;

// Type for line items
interface LineItem {
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
}

// Send a single email via Resend API
export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  returns: v.object({ success: v.boolean(), messageId: v.string() }),
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not configured, skipping email");
      return { success: false, messageId: "" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "FlowDesk <noreply@resend.dev>",
          to: args.to,
          subject: args.subject,
          html: args.html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Resend API error:", response.status, errorText);
        return { success: false, messageId: "" };
      }

      const result = await response.json();
      return { success: true, messageId: result.id || "" };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, messageId: "" };
    }
  },
});

// Generate professional email HTML template
function emailTemplate(params: {
  title: string;
  subtitle?: string;
  content: string;
  footer?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f7; }
    .container { background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { font-size: 22px; font-weight: 600; margin: 16px 0 8px; color: #1a1a1a; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .content { color: #444; font-size: 15px; margin-bottom: 24px; }
    .details { background-color: #fafafa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
    .details-row:last-child { border-bottom: none; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: center; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${params.title}</h1>
    ${params.subtitle ? `<p class="subtitle">${params.subtitle}</p>` : ""}
    <div class="content">${params.content}</div>
    <div class="footer">${params.footer || "Sent via FlowDesk"}</div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send contract accepted email to both freelancer and client
 */
export const sendContractAcceptedEmail = action({
  args: { contractId: v.id("contracts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await ctx.runQuery(api.contracts.getById, {
      contractId: args.contractId,
    });
    if (!contract) {
      console.error("Contract not found:", args.contractId);
      return null;
    }

    const freelancer = await ctx.runQuery(api.users.getUserById, {
      userId: contract.freelancerId,
    });

    const freelancerEmail = freelancer?.email;
    const clientEmail = contract.clientEmail;
    const clientName = contract.clientName;
    const freelancerName = freelancer?.name || "Your freelancer";
    const contractTitle = contract.title;

    const freelancerContent = emailTemplate({
      title: "Contract Accepted! 🎉",
      subtitle: "Your proposal has been accepted",
      content: `<p>Great news! <strong>${clientName}</strong> has accepted your contract proposal for <strong>${contractTitle}</strong>.</p><p>You can now start working on the project.</p>`,
      footer: "Happy working! · FlowDesk",
    });

    const clientContent = emailTemplate({
      title: "Contract Confirmed",
      subtitle: `Contract with ${freelancerName}`,
      content: `<p>You've accepted the contract proposal from <strong>${freelancerName}</strong> for <strong>${contractTitle}</strong>.</p>`,
      footer: "Thank you for using FlowDesk",
    });

    if (freelancerEmail) {
      await ctx.runAction(internalTyped.email.sendEmail, {
        to: freelancerEmail,
        subject: `Contract Accepted: ${contractTitle}`,
        html: freelancerContent,
      });
    }

    await ctx.runAction(internalTyped.email.sendEmail, {
      to: clientEmail,
      subject: `Contract Confirmed: ${contractTitle}`,
      html: clientContent,
    });

    return null;
  },
});

/**
 * Send invoice email to client
 */
export const sendInvoiceEmail = action({
  args: {
    invoiceId: v.id("invoices"),
    invoice: v.object({
      lineItems: v.array(v.object({
        description: v.string(),
        amount: v.number(),
        hours: v.optional(v.number()),
        rate: v.optional(v.number()),
      })),
      subtotal: v.number(),
      tax: v.number(),
      total: v.number(),
      aiGenerated: v.boolean(),
      contractId: v.id("contracts"),
      notes: v.optional(v.string()),
      paymentSimulated: v.boolean(),
      status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid")),
    }),
    contract: v.object({
      title: v.string(),
      clientEmail: v.string(),
      clientName: v.string(),
      freelancerId: v.id("users"),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { invoice, contract } = args;

    const clientEmail = contract.clientEmail;
    const clientName = contract.clientName;
    // Note: freelancer name would require additional query, using fallback
    const freelancerName = "Your freelancer";

    const lineItemsHtml = (invoice.lineItems as LineItem[])
      .map((item: LineItem) => `
        <div class="details-row">
          <span>${item.description}</span>
          <span>$${item.amount.toFixed(2)}</span>
        </div>
      `)
      .join("");

    const content = emailTemplate({
      title: "New Invoice Received",
      subtitle: `From ${freelancerName}`,
      content: `
        <p>Hello <strong>${clientName}</strong>,</p>
        <p>You've received an invoice for <strong>"${contract.title}"</strong>.</p>
        <div class="details">
          ${lineItemsHtml}
          <div class="details-row" style="font-weight: 600;">
            <span>Total</span>
            <span style="color: #007AFF;">$${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      `,
      footer: "Payment due upon receipt · FlowDesk",
    });

    await ctx.runAction(internalTyped.email.sendEmail, {
      to: clientEmail,
      subject: `Invoice from ${freelancerName}: ${contract.title}`,
      html: content,
    });

    return null;
  },
});

/**
 * Send payment received email to freelancer
 */
export const sendPaymentReceivedEmail = action({
  args: { invoiceId: v.id("invoices") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invoice = await ctx.runQuery(api.invoices.getById as any, {
      invoiceId: args.invoiceId,
    } as any) as any;

    if (!invoice) {
      console.error("Invoice not found:", args.invoiceId);
      return null;
    }

    const contract = await ctx.runQuery(api.contracts.getById, {
      contractId: invoice.contractId,
    });
    if (!contract) {
      console.error("Contract not found:", invoice.contractId);
      return null;
    }

    const freelancer = await ctx.runQuery(api.users.getUserById, {
      userId: contract.freelancerId,
    });

    const freelancerEmail = freelancer?.email;
    const freelancerName = freelancer?.name || "Freelancer";
    const clientName = contract.clientName;

    // Build deliverables HTML if they exist
    let deliverablesSection = "";
    if (invoice.deliverables && invoice.deliverables.length > 0) {
      const deliverablesHtml = invoice.deliverables.map((d: any) =>
        `<li><a href="${d.url}">${d.name}</a></li>`
      ).join("");
      deliverablesSection = `
        <p><strong>Your Deliverables:</strong></p>
        <ul>${deliverablesHtml}</ul>
      `;
    }

    const content = emailTemplate({
      title: "Payment Received! 💰",
      subtitle: `Payment confirmed for "${contract.title}"`,
      content: `
        <p>Congratulations <strong>${freelancerName}</strong>!</p>
        <p><strong>${clientName}</strong> has completed payment of <strong>${invoice.total.toFixed(2)}</strong>.</p>
        ${deliverablesSection ? deliverablesSection : "<p>Please share the deliverable link with your client.</p>"}
      `,
      footer: "Keep up the great work! · FlowDesk",
    });

    if (freelancerEmail) {
      await ctx.runAction(internalTyped.email.sendEmail, {
        to: freelancerEmail,
        subject: `Payment Received: ${invoice.total.toFixed(2)} for ${contract.title}`,
        html: content,
      });
    }

    return null;
  },
});
