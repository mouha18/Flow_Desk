"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Type assertion for internal API access
// The internal API from Convex's generated types doesn't correctly expose all modules
// via dot notation. Using documented `as any` cast to enable access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internalTyped = internal as any;

/**
 * OpenRouter AI integration for AI-powered email and invoice generation.
 *
 * Model Fallback Chain:
 * Tries models in order of preference. If one fails or is rate-limited,
 * falls back to the next. Uses free models with low traffic to maximize
 * availability. Configured via OPENROUTER_API_KEY in environment.
 *
 * Free model priority (low traffic, reliable):
 * 1. google/gemini-2.0-flash-exp:free  — best quality, fast, Google infrastructure
 * 2. qwen/qwen2.5-7b-instruct:free     — good for structured JSON, Alibaba Cloud
 * 3. meta-llama/llama-3.2-3b-instruct:free — open weights, moderate quality
 * 4. mistralai/mistral-nemo:free       — Mistral's base model, decent quality
 */

const MODEL_FALLBACK_CHAIN = [
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen2.5-7b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-nemo:free",
];

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature: number;
  max_tokens: number;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    code?: string;
  };
}

/**
 * Escape HTML special characters to prevent injection attacks.
 * Converts &, <, >, ", and ' to their HTML entity equivalents.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Call OpenRouter with model fallback. Tries each model in the chain
 * until one succeeds (HTTP 200). Returns raw response JSON on success.
 * Returns null if all models fail or no API key is set.
 */
async function callOpenRouterWithFallback(
  prompt: string,
  temperature: number = 0.7,
  maxTokens: number = 500
): Promise<OpenRouterResponse | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const messages: OpenRouterMessage[] = [{ role: "user", content: prompt }];

  for (const model of MODEL_FALLBACK_CHAIN) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://flowdesk.app",
          "X-Title": "FlowDesk",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        } satisfies OpenRouterRequest),
      });

      if (response.ok) {
        const data = (await response.json()) as OpenRouterResponse;
        // Check if the model returned actual content or an error
        if (!data.error && data.choices?.[0]?.message?.content) {
          console.log(`[AI] Success with model: ${model}`);
          return data;
        }
        // If model returned an error or empty content, try next model
        if (data.error) {
          console.warn(`[AI] Model ${model} returned error: ${data.error.message}. Trying next model...`);
          continue;
        }
      } else if (response.status === 429 || response.status >= 500) {
        // Rate limited or server error — try next model
        console.warn(`[AI] Model ${model} returned ${response.status}. Trying next model...`);
        continue;
      } else {
        // Client error (4xx except 429) — don't try other models
        console.error(`[AI] Model ${model} returned HTTP ${response.status}. Not trying fallback.`);
        break;
      }
    } catch (err) {
      console.warn(`[AI] Model ${model} failed with exception: ${err}. Trying next model...`);
      continue;
    }
  }

  // All models failed
  console.error("[AI] All models in fallback chain failed.");
  return null;
}

// ============================================================================
// Email Generation
// ============================================================================

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

// Parse the AI response for email generation
function parseEmailResponse(data: OpenRouterResponse): { subject: string; body: string } {
  try {
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in response");
    }

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch =
      content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const parsed = JSON.parse(jsonStr.trim());
    return {
      subject: parsed.subject || "Project Proposal",
      body: parsed.body || "",
    };
  } catch (error) {
    console.error("[AI] Error parsing email response:", error);
    // Return fallback
    return {
      subject: "Project Proposal",
      body: "Hi, I'd like to discuss a project with you.",
    };
  }
}

/**
 * Generate outreach email using OpenRouter AI with model fallback.
 * Tries free models in priority order until one succeeds.
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
    const resendApiKey = process.env.RESEND_API_KEY;

    let subject = `Project Proposal: ${args.contractTitle}`;
    let body = `Dear ${args.clientName},\n\nI'm ${args.freelancerName} and I'm excited about the opportunity to work on "${args.contractTitle}".\n\nI'd love to discuss this project with you further. Please let me know a convenient time for a call.\n\nBest regards,\n${args.freelancerName}`;

    // Try AI generation with model fallback
    const prompt = buildEmailPrompt(args);
    const aiResult = await callOpenRouterWithFallback(prompt, 0.7, 500);

    if (aiResult) {
      const parsed = parseEmailResponse(aiResult);
      subject = parsed.subject;
      body = parsed.body;
    }

    // Send the email via Resend
    if (resendApiKey) {
      const emailResult = await ctx.runAction(internalTyped.email.sendEmail, {
        to: args.clientEmail,
        subject,
        html: `<p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>`,
      });
      console.log("[AI] Email sent:", emailResult);
    } else {
      console.log("[AI] RESEND_API_KEY not set. Email not sent. Subject:", subject);
    }

    return { subject, body };
  },
});

// ============================================================================
// Invoice Generation
// ============================================================================

// Helper to parse invoice line items from AI response
function parseInvoiceResponse(data: OpenRouterResponse): {
  lineItems: { description: string; hours: number; rate: number; amount: number }[];
  notes: string;
} {
  try {
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in response");
    }

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch =
      content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const parsed = JSON.parse(jsonStr.trim());

    return {
      lineItems: parsed.lineItems || [],
      notes: parsed.notes || "",
    };
  } catch (error) {
    console.error("[AI] Error parsing invoice response:", error);
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
${tasksList || "No completed tasks found."}

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
 * Generate invoice from completed tasks using OpenRouter AI with model fallback.
 * Tries free models in priority order until one succeeds.
 */
export const generateInvoiceFromTasks = action({
  args: {
    contractId: v.id("contracts"),
    userId: v.id("users"),
    contract: v.object({
      title: v.string(),
      hourlyRate: v.optional(v.number()),
    }),
    tasks: v.array(
      v.object({
        title: v.string(),
        hourlyRate: v.optional(v.number()),
        timeSpent: v.optional(v.number()),
        status: v.string(),
      })
    ),
  },
  returns: v.object({
    lineItems: v.array(
      v.object({
        description: v.string(),
        hours: v.number(),
        rate: v.number(),
        amount: v.number(),
      })
    ),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    notes: v.string(),
    aiGenerated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { contract, tasks } = args;
    const completedTasks = (tasks || []).filter((t: any) => t.status === "completed");

    let lineItems: { description: string; hours: number; rate: number; amount: number }[] =
      [];
    let notes = "AI-generated invoice from completed tasks.";
    let aiGenerated = false;

    // Try AI generation with model fallback
    if (completedTasks.length > 0) {
      const prompt = buildInvoicePrompt(contract.title, completedTasks);
      const aiResult = await callOpenRouterWithFallback(prompt, 0.3, 800);

      if (aiResult) {
        const parsed = parseInvoiceResponse(aiResult);
        if (parsed.lineItems.length > 0) {
          // Convert null values to 0 for Convex validator compatibility
          lineItems = parsed.lineItems.map((item) => ({
            description: item.description,
            hours: item.hours ?? 0,
            rate: item.rate ?? 0,
            amount: item.amount,
          }));
          notes = parsed.notes;
          aiGenerated = true;
        }
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
      aiGenerated = false;
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0; // No tax by default
    const total = subtotal + tax;

    // Schedule the internal mutation to create the invoice
    await ctx.scheduler.runAfter(0, internalTyped.invoices._createInvoiceFromAI, {
      contractId: args.contractId,
      lineItems,
      subtotal,
      tax,
      total,
      notes,
      aiGenerated,
    });

    return {
      lineItems,
      subtotal,
      tax,
      total,
      notes,
      aiGenerated,
    };
  },
});
