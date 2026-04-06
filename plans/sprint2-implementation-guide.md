# Sprint 2 Implementation Guide

**Version:** 1.0  
**Created:** 2026-04-06  
**For:** Code Mode Implementation  

---

## Overview

This guide provides step-by-step implementation instructions for Sprint 2. Follow the phases in order to avoid dependency issues.

---

## Prerequisites

Before starting Sprint 2:

1. ✅ Sprint 1 is complete
2. ✅ `npx convex dev` is running
3. ✅ Schema includes all tables: contracts, tasks, messages, invoices, notifications, userRoles, userPushTokens
4. ✅ Auth is working (login/register/role-select)

---

## Phase 1: Verify Schema & Add Helper Functions

### Step 1.1: Verify Schema Indexes

Open [`convex/schema.ts`](convex/schema.ts) and verify all indexes are present:

```typescript
// contracts table
contracts: defineTable({
  // ... fields
})
  .index("by_freelancer", ["freelancerId"])
  .index("by_client", ["clientId"])
  .index("by_status", ["status"]),

// tasks table
tasks: defineTable({
  // ... fields
})
  .index("by_contract", ["contractId"])
  .index("by_contract_and_status", ["contractId", "status"]),

// messages table
messages: defineTable({
  // ... fields
})
  .index("by_contract", ["contractId"]),

// notifications table
notifications: defineTable({
  // ... fields
})
  .index("by_user", ["userId"])
  .index("by_user_and_read", ["userId", "read"]),
```

If any index is missing, add it and run `npx convex dev` to push the schema.

### Step 1.2: Create Auth Helpers File

Create [`convex/lib/auth.ts`](convex/lib/auth.ts):

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get the authenticated user from the session.
 * Throws if no session exists.
 */
export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("UNAUTHENTICATED");
  }
  return userId;
}

/**
 * Get the role of a user from the userRoles table.
 * Throws if role not found.
 */
export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<"freelancer" | "client"> {
  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  if (!roleDoc) {
    throw new ConvexError("Role not found for user");
  }

  return roleDoc.role;
}

/**
 * Require a specific role for the authenticated user.
 * Throws if unauthenticated or wrong role.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  expectedRole: "freelancer" | "client"
) {
  const userId = await getAuthUser(ctx);
  const role = await getUserRole(ctx, userId);

  if (role !== expectedRole) {
    throw new ConvexError({
      message: "UNAUTHORIZED",
      expected: expectedRole,
      actual: role,
    });
  }

  return { userId, role };
}

/**
 * Get the authenticated user and their role.
 * Throws if unauthenticated.
 */
export async function getAuthUserWithRole(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUser(ctx);
  const role = await getUserRole(ctx, userId);
  return { userId, role };
}
```

---

## Phase 2: Implement Convex Backend

### Step 2.1: Implement `convex/contracts.ts`

Create [`convex/contracts.ts`](convex/contracts.ts):

```typescript
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { getAuthUser, getUserRole, requireRole } from "./lib/auth";

/**
 * Create a new contract (freelancer only)
 */
export const create = mutation({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    clientPseudo: v.string(),
    title: v.string(),
    pricingType: v.union(v.literal("fixed"), v.literal("hourly")),
    fixedPrice: v.optional(v.number()),
    paymentTiming: v.union(v.literal("now"), v.literal("later")),
    paymentMethod: v.union(
      v.literal("stripe"),
      v.literal("naboo_orange"),
      v.literal("naboo_wave")
    ),
    aiEmailTone: v.union(
      v.literal("formal"),
      v.literal("friendly"),
      v.literal("casual")
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");

    // Validate fixed price is provided for fixed pricing
    if (args.pricingType === "fixed" && !args.fixedPrice) {
      throw new ConvexError("fixedPrice is required for fixed pricing type");
    }

    const contractId = await ctx.db.insert("contracts", {
      freelancerId: userId,
      clientId: null, // Set when client registers
      clientEmail: args.clientEmail,
      clientName: args.clientName,
      clientPseudo: args.clientPseudo,
      title: args.title,
      status: "pending",
      pricingType: args.pricingType,
      fixedPrice: args.fixedPrice ?? null,
      paymentTiming: args.paymentTiming,
      paymentMethod: args.paymentMethod,
      aiEmailTone: args.aiEmailTone,
      completionPercent: 0,
      deliverableLink: null,
    });

    // TODO Sprint 3: Schedule AI email generation action
    // await ctx.scheduler.runAfter(0, internal.actions.ai.generateOutreachEmail, {
    //   contractId,
    // });

    return { contractId, status: "pending" as const };
  },
});

/**
 * List all contracts for the authenticated freelancer
 */
export const listByFreelancer = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireRole(ctx, "freelancer");

    return await ctx.db
      .query("contracts")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", userId))
      .order("desc")
      .take(100);
  },
});

/**
 * List all contracts for the authenticated client
 */
export const listByClient = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireRole(ctx, "client");

    return await ctx.db
      .query("contracts")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .order("desc")
      .take(100);
  },
});

/**
 * Get a single contract by ID
 * Both freelancer and client can view if they're part of the contract
 */
export const getById = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUser(ctx);
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    // Check access: must be freelancer or client of this contract
    if (
      contract.freelancerId !== userId &&
      contract.clientId !== userId
    ) {
      throw new ConvexError("UNAUTHORIZED");
    }

    return contract;
  },
});

/**
 * Client accepts a contract
 */
export const accept = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "client");
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    // Verify this client is the intended recipient
    if (contract.clientId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    if (contract.status !== "pending") {
      throw new ConvexError("Contract is not pending");
    }

    await ctx.db.patch(contract._id, { status: "active" });

    // Create notification for freelancer
    await ctx.runMutation(internal.notifications.create, {
      userId: contract.freelancerId,
      type: "contract_accepted",
      contractId: contract._id,
      message: `${contract.clientName} accepted your contract "${contract.title}"`,
    });

    // TODO Sprint 3: Send email + push notification
    // await ctx.scheduler.runAfter(0, internal.actions.email.onContractAccepted, {
    //   contractId: contract._id,
    // });

    return { status: "active" as const };
  },
});

/**
 * Client declines a contract
 */
export const decline = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "client");
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      throw new ConvexError("Contract not found");
    }

    if (contract.clientId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    if (contract.status !== "pending") {
      throw new ConvexError("Contract is not pending");
    }

    await ctx.db.patch(contract._id, { status: "declined" });

    // Create notification for freelancer
    await ctx.runMutation(internal.notifications.create, {
      userId: contract.freelancerId,
      type: "contract_declined",
      contractId: contract._id,
      message: `${contract.clientName} declined your contract "${contract.title}"`,
    });

    return { status: "declined" as const };
  },
});

/**
 * Update deliverable link (freelancer only)
 */
export const updateDeliverableLink = mutation({
  args: {
    contractId: v.id("contracts"),
    deliverableLink: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "freelancer");
    const contract = await ctx.db.get(args.contractId);

    if (!contract || contract.freelancerId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    await ctx.db.patch(contract._id, {
      deliverableLink: args.deliverableLink,
    });

    return { success: true };
  },
});

/**
 * Internal mutation to recalculate completion percent based on tasks
 */
export const updateCompletionPercent = internalMutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();

    if (tasks.length === 0) {
      await ctx.db.patch(args.contractId, { completionPercent: 0 });
      return;
    }

    const completedCount = tasks.filter((t) => t.status === "completed").length;
    const completionPercent = Math.round((completedCount / tasks.length) * 100);

    await ctx.db.patch(args.contractId, { completionPercent });

    // If 100% complete, notify client
    if (completionPercent === 100) {
      const contract = await ctx.db.get(args.contractId);
      if (contract?.clientId) {
        await ctx.runMutation(internal.notifications.create, {
          userId: contract.clientId,
          type: "task_complete",
          contractId: contract._id,
          message: `Project "${contract.title}" is 100% complete!`,
        });
      }
    }
  },
});
```

### Step 2.2: Implement `convex/tasks.ts`

Create [`convex/tasks.ts`](convex/tasks.ts):

```typescript
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
      hourlyRate: args.hourlyRate ?? null,
      startedAt: null,
      completedAt: null,
      timeSpent: null,
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
```

### Step 2.3: Implement `convex/messages.ts`

Create [`convex/messages.ts`](convex/messages.ts):

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";
import { getAuthUser } from "./lib/auth";

/**
 * Send a message in a contract chat
 */
export const send = mutation({
  args: {
    contractId: v.id("contracts"),
    content: v.string(),
  },
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

    const messageId = await ctx.db.insert("messages", {
      contractId: args.contractId,
      senderId: userId,
      content: args.content,
    });

    // TODO Sprint 3: Create notification for the other party
    // const recipientId = userId === contract.freelancerId
    //   ? contract.clientId
    //   : contract.freelancerId;
    // if (recipientId) {
    //   await ctx.runMutation(internal.notifications.create, {
    //     userId: recipientId,
    //     type: "new_message",
    //     contractId: args.contractId,
    //     message: `New message in "${contract.title}"`,
    //   });
    // }

    return { messageId };
  },
});

/**
 * List messages for a contract (paginated, newest first)
 */
export const listByContract = query({
  args: {
    contractId: v.id("contracts"),
    paginationOpts: paginationOptsValidator,
  },
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
      .query("messages")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

### Step 2.4: Implement `convex/notifications.ts`

Create [`convex/notifications.ts`](convex/notifications.ts):

```typescript
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getAuthUser } from "./lib/auth";

/**
 * Internal mutation to create a notification
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    contractId: v.optional(v.id("contracts")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type as any, // Cast to NotificationType
      contractId: args.contractId ?? null,
      message: args.message,
      read: false,
    });
  },
});

/**
 * List all notifications for the authenticated user
 */
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUser(ctx);

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});

/**
 * Mark a notification as read
 */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== userId) {
      throw new ConvexError("UNAUTHORIZED");
    }

    await ctx.db.patch(notification._id, { read: true });

    return { success: true };
  },
});

/**
 * Mark all notifications as read
 */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUser(ctx);

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return { count: unreadNotifications.length };
  },
});
```

### Step 2.5: Extend `convex/users.ts`

Update [`convex/users.ts`](convex/users.ts) to add `updateProfile` mutation:

```typescript
// Add to existing file:

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    pseudo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("UNAUTHENTICATED");

    // Build update object with only provided fields
    const updates: { name?: string; pseudo?: string } = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.pseudo !== undefined) updates.pseudo = args.pseudo;

    if (Object.keys(updates).length === 0) {
      throw new ConvexError("No fields to update");
    }

    await ctx.db.patch(userId, updates);

    return { success: true };
  },
});
```

---

## Phase 3: Test Backend with Convex Dashboard

Before building the frontend, test each function:

1. Open Convex dashboard: `http://localhost:3210` (or your cloud dashboard)
2. Go to "Functions" tab
3. Test each function with sample data:

```typescript
// Example: Test contracts.create
{
  "clientEmail": "test@client.com",
  "clientName": "Test Client",
  "clientPseudo": "testclient",
  "title": "Test Project",
  "pricingType": "fixed",
  "fixedPrice": 1000,
  "paymentTiming": "later",
  "paymentMethod": "stripe",
  "aiEmailTone": "friendly"
}

// Example: Test tasks.create
{
  "contractId": "<contract_id_from_above>",
  "title": "Task 1",
  "hourlyRate": null
}
```

Verify:
- ✅ Contracts appear in `contracts` table
- ✅ Tasks appear in `tasks` table
- ✅ Notifications created on accept/decline
- ✅ Completion percent updates when tasks complete

---

## Phase 4: Implement React Hooks

### Step 4.1: Create `hooks/use-contracts.ts`

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export function useContracts() {
  const contracts = useQuery(api.contracts.listByFreelancer);
  return { contracts, isLoading: contracts === undefined };
}

export function useClientContracts() {
  const contracts = useQuery(api.contracts.listByClient);
  return { contracts, isLoading: contracts === undefined };
}

export function useContract(contractId: Id<"contracts"> | null) {
  const contract = useQuery(
    api.contracts.getById,
    contractId ? { contractId } : "skip"
  );
  return { contract, isLoading: contract === undefined };
}

export function useCreateContract() {
  const createContract = useMutation(api.contracts.create);
  return { createContract };
}

export function useAcceptContract() {
  const acceptContract = useMutation(api.contracts.accept);
  return { acceptContract };
}

export function useDeclineContract() {
  const declineContract = useMutation(api.contracts.decline);
  return { declineContract };
}

export function useUpdateDeliverableLink() {
  const updateDeliverableLink = useMutation(api.contracts.updateDeliverableLink);
  return { updateDeliverableLink };
}
```

### Step 4.2: Create `hooks/use-tasks.ts`

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMemo } from "react";

export function useTasks(contractId: Id<"contracts"> | null) {
  const tasks = useQuery(
    api.tasks.listByContract,
    contractId ? { contractId } : "skip"
  );
  return { tasks, isLoading: tasks === undefined };
}

export function useCreateTask() {
  const createTask = useMutation(api.tasks.create);
  return { createTask };
}

export function useUpdateTaskStatus() {
  const updateStatus = useMutation(api.tasks.updateStatus);
  return { updateStatus };
}

export function useStartTimer() {
  const startTimer = useMutation(api.tasks.startTimer);
  return { startTimer };
}

export function useStopTimer() {
  const stopTimer = useMutation(api.tasks.stopTimer);
  return { stopTimer };
}

export function useSetHourlyRate() {
  const setHourlyRate = useMutation(api.tasks.setHourlyRate);
  return { setHourlyRate };
}

export function useDeleteTask() {
  const deleteTask = useMutation(api.tasks.deleteTask);
  return { deleteTask };
}

/**
 * Calculate completion percentage from tasks
 */
export function useCompletionPercent(contractId: Id<"contracts"> | null) {
  const { tasks } = useTasks(contractId);

  const completionPercent = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const completedCount = tasks.filter((t) => t.status === "completed").length;
    return Math.round((completedCount / tasks.length) * 100);
  }, [tasks]);

  return completionPercent;
}
```

### Step 4.3: Create `hooks/use-messages.ts`

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export function useMessages(contractId: Id<"contracts"> | null) {
  const messages = useQuery(
    api.messages.listByContract,
    contractId
      ? { contractId, paginationOpts: { numItems: 50, cursor: null } }
      : "skip"
  );
  return { messages, isLoading: messages === undefined };
}

export function useSendMessage() {
  const sendMessage = useMutation(api.messages.send);
  return { sendMessage };
}
```

### Step 4.4: Create `hooks/use-notifications.ts`

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useMemo } from "react";

export function useNotifications() {
  const notifications = useQuery(api.notifications.listByUser);
  return { notifications, isLoading: notifications === undefined };
}

export function useUnreadCount() {
  const { notifications } = useNotifications();

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return unreadCount;
}

export function useMarkRead() {
  const markRead = useMutation(api.notifications.markRead);
  return { markRead };
}

export function useMarkAllRead() {
  const markAllRead = useMutation(api.notifications.markAllRead);
  return { markAllRead };
}
```

---

## Phase 5: Build UI Components

### Step 5.1: Contract Components

**ContractCard:**

```typescript
// src/components/contracts/ContractCard.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Typography } from "../ui/typography";
import { Badge } from "../ui/badge";
import { Doc } from "convex/_generated/dataModel";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";

interface ContractCardProps {
  contract: Doc<"contracts">;
  onPress: () => void;
}

export function ContractCard({ contract, onPress }: ContractCardProps) {
  const statusColors = {
    pending: colors.warning,
    active: colors.primary,
    completed: colors.success,
    declined: colors.error,
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Typography variant="h3">{contract.title}</Typography>
        <Badge label={contract.status} color={statusColors[contract.status]} />
      </View>
      <Typography variant="body" style={styles.clientName}>
        {contract.clientName}
      </Typography>
      <View style={styles.footer}>
        <Typography variant="caption">{contract.pricingType}</Typography>
        <Typography variant="caption">
          {contract.completionPercent}% complete
        </Typography>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  clientName: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
```

**(Continue with TaskCard, MessageBubble, NotificationCard...)**

---

## Phase 6: Build Screens

### Step 6.1: Freelancer Contract List

Update [`app/(freelancer)/contracts/index.tsx`](app/(freelancer)/contracts/index.tsx):

```typescript
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { Screen } from "src/components/ui/screen";
import { Button } from "src/components/ui/button";
import { Typography } from "src/components/ui/typography";
import { ContractCard } from "src/components/contracts/ContractCard";
import { useContracts } from "hooks/use-contracts";
import { useRouter } from "expo-router";

export default function ContractsScreen() {
  const { contracts, isLoading } = useContracts();
  const router = useRouter();

  if (isLoading) {
    return (
      <Screen>
        <Typography variant="body">Loading contracts...</Typography>
      </Screen>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <Screen>
        <Typography variant="h2">No Contracts Yet</Typography>
        <Typography variant="body">Create your first contract to get started.</Typography>
        <Button
          label="Create Contract"
          onPress={() => router.push("/(freelancer)/contracts/new")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Button
        label="+ New Contract"
        onPress={() => router.push("/(freelancer)/contracts/new")}
      />
      <FlatList
        data={contracts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ContractCard
            contract={item}
            onPress={() => router.push(`/(freelancer)/contracts/${item._id}`)}
          />
        )}
      />
    </Screen>
  );
}
```

**(Continue with other screens...)**

---

## Phase 7: SQLite Caching (Optional for Sprint 2)

This can be deferred to polish phase if time is tight. The app works fully online without caching.

---

## Definition of Done Checklist

Before marking Sprint 2 complete:

- [ ] Freelancer can create a contract and it appears in their list
- [ ] Client can see the contract and accept/decline
- [ ] Accepted contract shows as active on both dashboards
- [ ] Freelancer can add tasks, toggle status, start/stop timer
- [ ] Completion percentage updates in real time as tasks complete
- [ ] Both parties can send and receive messages in real time
- [ ] Notifications appear in inbox for contract events
- [ ] All Convex functions have proper auth checks
- [ ] No console errors in Metro or Convex logs

---

**Next Step:** Switch to Code mode and implement Phase 1 (Backend) first.
