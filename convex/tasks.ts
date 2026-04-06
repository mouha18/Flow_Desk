import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { getAuthUser, requireRole } from "./lib/auth";

/**
 * Create a new task (freelancer only)
 */
export const create = mutation({
  args: {
    contractId: v.id("contracts"),
    title: v.string(),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");

    const contract = await ctx.db.get(args.contractId);
    if (!contract || contract.freelancerId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    const taskId = await ctx.db.insert("tasks", {
      contractId: args.contractId,
      title: args.title,
      status: "pending",
      hourlyRate: args.hourlyRate,
      startedAt: undefined,
      completedAt: undefined,
      timeSpent: undefined,
    });

    return { taskId };
  },
});

/**
 * List all tasks for a contract
 */
export const listByContract = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUser(ctx);
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    // Check access
    if (
      contract.freelancerId !== userId &&
      contract.clientId !== userId
    ) {
      throw new ConvexError("UNAUTHORIZED");
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .order("asc")
      .collect();
  },
});

/**
 * Update task status (freelancer only)
 */
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new ConvexError("Task not found");
    }

    const contract = await ctx.db.get(task.contractId);
    if (!contract || contract.freelancerId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    await ctx.db.patch(task._id, { status: args.status });

    // Recalculate completion percent
    await ctx.runMutation(internal.contracts.updateCompletionPercent, {
      contractId: task.contractId,
    });

    return { success: true };
  },
});

/**
 * Start task timer (freelancer only)
 */
export const startTimer = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new ConvexError("Task not found");
    }

    const contract = await ctx.db.get(task.contractId);
    if (!contract || contract.freelancerId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    if (task.status === "completed") {
      throw new ConvexError("Cannot start timer on completed task");
    }

    const now = Date.now();
    await ctx.db.patch(task._id, {
      startedAt: now,
      status: "running",
    });

    return { startedAt: now };
  },
});

/**
 * Stop task timer and calculate timeSpent (freelancer only)
 */
export const stopTimer = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new ConvexError("Task not found");
    }

    const contract = await ctx.db.get(task.contractId);
    if (!contract || contract.freelancerId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    if (!task.startedAt) {
      throw new ConvexError("Timer not started");
    }

    const now = Date.now();
    const timeSpentMs = now - task.startedAt;
    const timeSpentMinutes = Math.round(timeSpentMs / 60000);

    await ctx.db.patch(task._id, {
      completedAt: now,
      timeSpent: timeSpentMinutes,
      status: "completed",
    });

    // Recalculate completion percent
    await ctx.runMutation(internal.contracts.updateCompletionPercent, {
      contractId: task.contractId,
    });

    return { completedAt: now, timeSpent: timeSpentMinutes };
  },
});

/**
 * Set hourly rate on a task (freelancer only, hourly contracts)
 */
export const setHourlyRate = mutation({
  args: {
    taskId: v.id("tasks"),
    hourlyRate: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new ConvexError("Task not found");
    }

    const contract = await ctx.db.get(task.contractId);
    if (!contract || contract.freelancerId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    if (contract.pricingType !== "hourly") {
      throw new ConvexError("Cannot set hourly rate on fixed-price contract");
    }

    await ctx.db.patch(task._id, { hourlyRate: args.hourlyRate });

    return { success: true };
  },
});

/**
 * Delete a task (freelancer only)
 */
export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new ConvexError("Task not found");
    }

    const contract = await ctx.db.get(task.contractId);
    if (!contract || contract.freelancerId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    await ctx.db.delete(task._id);

    // Recalculate completion percent
    await ctx.runMutation(internal.contracts.updateCompletionPercent, {
      contractId: task.contractId,
    });

    return { success: true };
  },
});
