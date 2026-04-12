import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal, api } from "./_generated/api";

// Type assertion for internal API access
// The internal API from Convex's generated types doesn't correctly expose all modules
// via dot notation (particularly modules with slashes like "actions/push").
// Using documented `as any` cast to enable bracket notation access pattern.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internalTyped = internal as any;

/**
 * Helper function to send a notification to a user
 */
async function sendNotification(
  ctx: any,
  userId: any,
  type: string,
  message: string,
  contractId?: any
) {
  await ctx.db.insert("notifications", {
    userId,
    type,
    message,
    contractId,
    read: false,
  });
}

/**
 * Format milliseconds to human-readable time string
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

// List tasks by contractId
export const list = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // SECURITY: Verify user is a party to the contract
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) return []; // Contract doesn't exist
    // Allow access if user is the freelancer OR the client
    if (contract.freelancerId !== userId && contract.clientId !== userId) return [];

    return await ctx.db
      .query("tasks")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();
  },
});

// Create a new task
export const create = mutation({
  args: {
    contractId: v.id("contracts"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify contract exists and user is the freelancer
    const contract = await ctx.db.get("contracts", args.contractId);
    if (!contract) throw new Error("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("Only the contract freelancer can add tasks");
    }

    const taskId = await ctx.db.insert("tasks", {
      contractId: args.contractId,
      title: args.title,
      status: "pending",
      startedAt: undefined,
      completedAt: undefined,
      timeSpent: undefined,
    });

    return taskId;
  },
});

// Update task status (toggle pending/completed)
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("pending"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get("tasks", args.taskId);
    if (!task) throw new Error("Task not found");

    const contract = await ctx.db.get("contracts", task.contractId);
    if (!contract) throw new Error("Contract not found");

    if (args.status === "completed" && !task.completedAt) {
      await ctx.db.patch("tasks", args.taskId, {
        status: "completed",
        completedAt: Date.now(),
      });

      // Send notification to client
      if (contract.clientId) {
        let message = `Task completed: "${task.title}"`;
        if (contract.hourlyRate && task.timeSpent) {
          const amount = ((task.timeSpent / 1000 / 60 / 60) * contract.hourlyRate).toFixed(2);
          message += ` (${amount} @ ${contract.hourlyRate}/h)`;
        }
        await sendNotification(ctx, contract.clientId, "task_completed", message, contract._id);
      }
    } else if (args.status === "pending" && task.completedAt) {
      await ctx.db.patch("tasks", args.taskId, {
        status: "pending",
        completedAt: undefined,
      });
    }

    return null;
  },
});

// Start timer for a task
export const startTimer = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get("tasks", args.taskId);
    if (!task) throw new Error("Task not found");

    // If timer is already running, treat it as potentially stale (app may have closed while running)
    // Auto-recover by accumulating elapsed time and restarting fresh
    if (task.startedAt) {
      const now = Date.now();
      const runningFor = now - task.startedAt;
      
      // Accumulate any elapsed time and restart the timer
      const totalTimeSpent = (task.timeSpent || 0) + runningFor;
      await ctx.db.patch("tasks", args.taskId, {
        status: "running",
        startedAt: now, // Restart from now
        timeSpent: totalTimeSpent,
      });
    } else {
      // Normal start - no timer running
      await ctx.db.patch("tasks", args.taskId, {
        status: "running",
        startedAt: Date.now(),
      });
    }

    return null;
  },
});

// Stop timer for a task
export const stopTimer = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get("tasks", args.taskId);
    if (!task) throw new Error("Task not found");

    if (!task.startedAt) {
      throw new ConvexError("Timer not running");
    }

    const now = Date.now();
    const elapsed = now - task.startedAt;
    const totalTimeSpent = (task.timeSpent || 0) + elapsed;

    await ctx.db.patch("tasks", args.taskId, {
      status: "completed",
      startedAt: undefined,
      timeSpent: totalTimeSpent,
    });

    // Update contract completion percentage
    const contract = await ctx.db.get("contracts", task.contractId);
    if (contract) {
      const allTasks = await ctx.db
        .query("tasks")
        .withIndex("by_contract", (q) => q.eq("contractId", task.contractId))
        .collect();
      const completedCount = allTasks.filter((t) => t.status === "completed").length;
      const totalCount = allTasks.length;
      const completionPercent = Math.round((completedCount / totalCount) * 100);

      await ctx.db.patch("contracts", task.contractId, { completionPercent });

      // Send notification to client about time tracked
      if (contract.clientId) {
        let message = `Time tracked on "${task.title}": ${formatTime(elapsed)}`;
        if (contract.hourlyRate) {
          const amount = ((elapsed / 1000 / 60 / 60) * contract.hourlyRate).toFixed(2);
          message += ` (${amount} @ ${contract.hourlyRate}/h)`;
        }

        await sendNotification(ctx, contract.clientId, "time_tracked", message, contract._id);
      }

      // Check if all tasks completed (100%)
      if (completedCount === totalCount && totalCount > 0) {
        // All tasks done - update contract completion
        await ctx.db.patch("contracts", task.contractId, { completionPercent: 100 });
        
        // Schedule push notification to client via scheduler (not ctx.runAction in mutation)
        if (contract.clientId) {
          await ctx.scheduler.runAfter(0, internalTyped["actions/push"]["sendTaskCompleteNotification"], {
            userId: contract.clientId,
            title: "Work Complete! 🎉",
            body: `All tasks for "${contract.title}" are done! Ready to generate invoice.`,
            data: { contractId: contract._id },
          });
        }
      }
    }

    return null;
  },
});

// Set hourly rate for a task - DEPRECATED, rates are now per-contract
export const setHourlyRate = mutation({
  args: {
    taskId: v.id("tasks"),
    hourlyRate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const task = await ctx.db.get("tasks", args.taskId);
    if (!task) throw new ConvexError("Task not found");

    // Verify user is the freelancer for this contract
    const contract = await ctx.db.get("contracts", task.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    if (contract.freelancerId !== userId) {
      throw new ConvexError("Only the contract freelancer can set hourly rates");
    }


    // This is now deprecated - rates are set at the contract level
    // Keeping for backwards compatibility but it doesn't actually update anything
    return null;
  },
});
