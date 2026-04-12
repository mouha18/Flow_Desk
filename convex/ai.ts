"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Type assertion for internal API access
const internalAny = internal as any;

/**
 * OpenRouter API integration for AI-powered email generation.
 * Uses free models available on OpenRouter tier.
 */

// Build the prompt for outreach email generation based on tone
function buildEmailPrompt(args: {
  clientName: string;
  freelancerName: string;
  contractTitle: string;
  tone: "formal" | "friendly" | "casual";
}): string {
  const toneInstructions = {
    formal:
      "Use a professional, formal tone. Be respectful and business-appropriate. Avoid contractions and casual language.",
    friendly:
      "Use a warm, friendly tone. Be personable but professional. Feel free to use light casual language.",
    casual:
      "Use a relaxed, casual tone. Be approachable and conversational while still getting the message across.",
  };

  return `You are a professional freelancer reaching out to a potential client.

Write a compelling outreach email with the following details:
- Client Name: ${args.clientName}
- Freelancer Name: ${args.freelancerName}
- Contract/Project Title: ${args.contractTitle}

Tone: ${toneInstructions[args.tone]}

Requirements:
1. Write a concise, engaging email that introduces the freelancer and the project
2. Include a clear subject line and email body
3. Subject should be compelling but professional (max 60 characters)
4. Body should be 150-200 words
5. Include a subtle call-to-action to discuss further
6. Do not include any placeholder brackets like < >

Return your response as a JSON object with exactly this structure:
{
  "subject": "your subject line here (max 60 chars)",
  "body": "your email body here"
}

Only return valid JSON, no additional text.`;
}

// Parse the AI response
function parseEmailResponse(data: any): { subject: string; body: string } {
  try {
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in response");
    }

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    const parsed = JSON.parse(jsonStr.trim());
    return {
      subject: parsed.subject || "Project Proposal",
      body: parsed.body || "",
    };
  } catch (error) {
    console.error("Error parsing email response:", error);
    // Return fallback
    return {
      subject: "Project Proposal",
      body: "Hi, I'd like to discuss a project with you.",
    };
  }
}

/**
 * Generate outreach email using OpenRouter AI
 * Uses google/gemini-2.0-flash-exp:free model (no API cost)
 */
export const generateOutreachEmail = action({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    freelancerName: v.string(),
    contractTitle: v.string(),
    tone: v.union(v.literal("formal"), v.literal("friendly"), v.literal("casual")),
  },
  returns: v.object({ subject: v.string(), body: v.string() }),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    let subject = `Project Proposal: ${args.contractTitle}`;
    let body = `Dear ${args.clientName},\n\nI'm ${args.freelancerName} and I'm excited about the opportunity to work on "${args.contractTitle}".\n\nI'd love to discuss this project with you further. Please let me know a convenient time for a call.\n\nBest regards,\n${args.freelancerName}`;

    // Try to generate email with AI if API key is available
    if (apiKey) {
      const prompt = buildEmailPrompt(args);
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://flowdesk.app",
              "X-Title": "FlowDesk",
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-exp:free",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 500,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const parsed = parseEmailResponse(data);
          subject = parsed.subject;
          body = parsed.body;
        }
      } catch (error) {
        console.error("OpenRouter API error:", error);
      }
    }

    // Send the email via Resend
    if (resendApiKey) {
      const internalAny = internal as any;
      const emailResult = await ctx.runAction(internalAny.email.sendEmail, {
        to: args.clientEmail,
        subject,
        html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
      });
      console.log("Email sent:", emailResult);
    } else {
      console.log("RESEND_API_KEY not set. Email not sent. Subject:", subject);
    }

    return { subject, body };
  },
});

// Helper to parse invoice line items from AI response
function parseInvoiceResponse(data: any): {
  lineItems: { description: string; hours: number; rate: number; amount: number }[];
  notes: string;
} {
  try {
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in response");
    }

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    const parsed = JSON.parse(jsonStr.trim());

    return {
      lineItems: parsed.lineItems || [],
      notes: parsed.notes || "",
    };
  } catch (error) {
    console.error("Error parsing invoice response:", error);
    // Return fallback based on completed tasks
    return {
      lineItems: [],
      notes: "AI invoice generation failed. Please enter line items manually.",
    };
  }
}

// Build prompt for invoice generation from tasks
function buildInvoicePrompt(contractTitle: string, tasks: any[]): string {
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const tasksList = completedTasks
    .map((t, i) => {
      const hours = t.timeSpent ? (t.timeSpent / 3600000).toFixed(2) : "0";
      const rate = t.hourlyRate || 0;
      return `${i + 1}. "${t.title}" - ${hours}h @ ${rate}/hr = ${(parseFloat(hours) * rate).toFixed(2)}`;
    })
    .join("\n");

  return `You are an expert billing assistant for a freelance freelancer.

Generate a professional invoice based on the following completed tasks:

Contract: ${contractTitle}

Completed Tasks:
${tasksList}

Requirements:
1. Create a line item for each completed task
2. Calculate amounts based on hours worked × hourly rate
3. Add any fixed-price items if specified
4. Include a reasonable tax rate suggestion (e.g., 0% or 5% depending on region)
5. Add professional notes about the services provided

Return a JSON object with this structure:
{
  "lineItems": [
    {
      "description": "Task description",
      "hours": number or null,
      "rate": number or null,
      "amount": number
    }
  ],
  "notes": "Professional notes about the invoice"
}

Only return valid JSON, no additional text.`;
}

/**
 * Generate invoice from completed tasks using OpenRouter AI
 * Uses google/gemini-2.0-flash-exp:free model (no API cost)
 */
export const generateInvoiceFromTasks = action({
  args: {
    contractId: v.id("contracts"),
    userId: v.id("users"),
    contract: v.object({
      title: v.string(),
      hourlyRate: v.optional(v.number()),
    }),
    tasks: v.array(v.object({
      title: v.string(),
      hourlyRate: v.optional(v.number()),
      timeSpent: v.optional(v.number()),
      status: v.string(),
    })),
  },
  returns: v.object({
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
  }),
  handler: async (ctx, args) => {
    const { contract, tasks } = args;
    const completedTasks = (tasks || []).filter((t: any) => t.status === "completed");

    let lineItems: { description: string; hours: number; rate: number; amount: number }[] = [];
    let notes = "AI-generated invoice from completed tasks.";

    // Try to generate with AI
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey && completedTasks.length > 0) {
      const prompt = buildInvoicePrompt(contract.title, completedTasks);
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://flowdesk.app",
              "X-Title": "FlowDesk",
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-exp:free",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.3,
              max_tokens: 800,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const parsed = parseInvoiceResponse(data);
          // Convert null values to undefined for Convex validator compatibility
          lineItems = parsed.lineItems.map(item => ({
            description: item.description,
            hours: item.hours ?? 0,
            rate: item.rate ?? 0,
            amount: item.amount,
          }));
          notes = parsed.notes;
        }
      } catch (error) {
        console.error("OpenRouter API error for invoice:", error);
      }
    }

    // Fallback: create line items from tasks directly if AI didn't work
    if (lineItems.length === 0 && completedTasks.length > 0) {
      lineItems = completedTasks.map((task: any) => {
        const hours = task.timeSpent ? task.timeSpent / 3600000 : 0;
        const rate = task.hourlyRate || 0;
        return {
          description: task.title,
          hours,
          rate,
          amount: hours * rate,
        };
      });
      notes = "Invoice generated from task tracking data.";
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0; // No tax by default
    const total = subtotal + tax;

    // Schedule the internal mutation to create the invoice
    await ctx.scheduler.runAfter(0, internalAny.invoices._createInvoiceFromAI, {
      contractId: args.contractId,
      lineItems,
      subtotal,
      tax,
      total,
      notes,
      aiGenerated: lineItems.length > 0,
    });

    return {
      lineItems,
      subtotal,
      tax,
      total,
      notes,
      aiGenerated: lineItems.length > 0,
    };
  },
});
