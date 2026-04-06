# Sprint 2 Architecture Plan — Core Features

**Version:** 1.0  
**Sprint:** Sprint 2 — Core Features (Contracts + Tasks + Chat)  
**Created:** 2026-04-06  
**Status:** Planning Phase

---

## Overview

Sprint 2 implements the core business logic of FlowDesk: contract management, task tracking with timers, real-time chat, and notifications. This sprint builds on the authentication and navigation foundation from Sprint 1.

**Key deliverable:** Freelancer creates contract → Client accepts → Freelancer adds tasks with timer → Both parties chat in real time → Notifications trigger on key events.

---

## 1. Sprint 2 Scope Analysis

### 1.1 Backend (Convex Functions)

#### Required Convex Modules:

1. **[`convex/contracts.ts`](convex/contracts.ts)**
   - `create` (mutation) — Create new contract
   - `listByFreelancer` (query) — List all contracts for authenticated freelancer
   - `listByClient` (query) — List all contracts for authenticated client
   - `getById` (query) — Get single contract details
   - `accept` (mutation) — Client accepts contract
   - `decline` (mutation) — Client declines contract
   - `updateCompletionPercent` (internal mutation) — Recalculate based on tasks

2. **[`convex/tasks.ts`](convex/tasks.ts)**
   - `create` (mutation) — Add task to contract
   - `listByContract` (query) — Get all tasks for a contract
   - `updateStatus` (mutation) — Change task status
   - `startTimer` (mutation) — Record start time
   - `stopTimer` (mutation) — Calculate timeSpent
   - `setHourlyRate` (mutation) — Set rate on task (hourly contracts)
   - `deleteTask` (mutation) — Remove task

3. **[`convex/messages.ts`](convex/messages.ts)**
   - `send` (mutation) — Send message in contract chat
   - `listByContract` (query with pagination) — Get messages for contract

4. **[`convex/notifications.ts`](convex/notifications.ts)**
   - `create` (internal mutation) — Create notification
   - `listByUser` (query) — Get all notifications for user
   - `markRead` (mutation) — Mark single notification as read
   - `markAllRead` (mutation) — Mark all notifications as read

5. **[`convex/users.ts`](convex/users.ts)** (already exists, extend)
   - Update `me` query to include role from `userRoles` table
   - Add `updateProfile` mutation

### 1.2 Frontend (React Native + Hooks)

#### Required Custom Hooks:

1. **[`hooks/use-contracts.ts`](hooks/use-contracts.ts)**
   - `useContracts()` — Subscribe to contract list (role-aware)
   - `useContract(contractId)` — Subscribe to single contract
   - `useCreateContract()` — Mutation wrapper
   - `useAcceptContract()` — Mutation wrapper
   - `useDeclineContract()` — Mutation wrapper

2. **[`hooks/use-tasks.ts`](hooks/use-tasks.ts)**
   - `useTasks(contractId)` — Subscribe to task list
   - `useCreateTask()` — Mutation wrapper
   - `useUpdateTaskStatus()` — Mutation wrapper
   - `useStartTimer()` — Mutation wrapper
   - `useStopTimer()` — Mutation wrapper
   - `useSetHourlyRate()` — Mutation wrapper
   - `useDeleteTask()` — Mutation wrapper
   - `useCompletionPercent(contractId)` — Derived calculation

3. **[`hooks/use-messages.ts`](hooks/use-messages.ts)**
   - `useMessages(contractId)` — Paginated subscription
   - `useSendMessage()` — Mutation wrapper

4. **[`hooks/use-notifications.ts`](hooks/use-notifications.ts)**
   - `useNotifications()` — Subscribe to notifications
   - `useUnreadCount()` — Derived count
   - `useMarkRead()` — Mutation wrapper
   - `useMarkAllRead()` — Mutation wrapper

#### Required UI Components:

**Contracts:**
- [`src/components/contracts/ContractCard.tsx`](src/components/contracts/ContractCard.tsx)
- [`src/components/contracts/ContractList.tsx`](src/components/contracts/ContractList.tsx)
- [`src/components/contracts/ContractStatusBadge.tsx`](src/components/contracts/ContractStatusBadge.tsx)
- [`src/components/contracts/CreateContractForm.tsx`](src/components/contracts/CreateContractForm.tsx)

**Tasks:**
- [`src/components/tasks/TaskCard.tsx`](src/components/tasks/TaskCard.tsx)
- [`src/components/tasks/TaskList.tsx`](src/components/tasks/TaskList.tsx)
- [`src/components/tasks/TimerControl.tsx`](src/components/tasks/TimerControl.tsx)
- [`src/components/tasks/CompletionBar.tsx`](src/components/tasks/CompletionBar.tsx)
- [`src/components/tasks/CreateTaskForm.tsx`](src/components/tasks/CreateTaskForm.tsx)

**Chat:**
- [`src/components/chat/MessageBubble.tsx`](src/components/chat/MessageBubble.tsx)
- [`src/components/chat/MessageList.tsx`](src/components/chat/MessageList.tsx)
- [`src/components/chat/MessageInput.tsx`](src/components/chat/MessageInput.tsx)

**Notifications:**
- [`src/components/notifications/NotificationCard.tsx`](src/components/notifications/NotificationCard.tsx)
- [`src/components/notifications/NotificationList.tsx`](src/components/notifications/NotificationList.tsx)

#### Required Screens:

**Freelancer:**
- [`app/(freelancer)/contracts/index.tsx`](app/(freelancer)/contracts/index.tsx) — Contract list (exists, needs data wiring)
- [`app/(freelancer)/contracts/new.tsx`](app/(freelancer)/contracts/new.tsx) — Create contract form (NEW)
- [`app/(freelancer)/contracts/[id]/index.tsx`](app/(freelancer)/contracts/[id]/index.tsx) — Contract detail (NEW)
- [`app/(freelancer)/contracts/[id]/tasks.tsx`](app/(freelancer)/contracts/[id]/tasks.tsx) — Task list with timer (NEW)
- [`app/(freelancer)/chat/[contractId].tsx`](app/(freelancer)/chat/[contractId].tsx) — Chat screen (NEW)
- [`app/(freelancer)/notifications/index.tsx`](app/(freelancer)/notifications/index.tsx) — Notification inbox (exists, needs data wiring)

**Client:**
- [`app/(client)/contracts/index.tsx`](app/(client)/contracts/index.tsx) — Contract list (exists, needs data wiring)
- [`app/(client)/contracts/[id]/index.tsx`](app/(client)/contracts/[id]/index.tsx) — Contract detail + accept/decline (NEW)
- [`app/(client)/chat/[contractId].tsx`](app/(client)/chat/[contractId].tsx) — Chat screen (NEW)
- [`app/(client)/notifications/index.tsx`](app/(client)/notifications/index.tsx) — Notification inbox (exists, needs data wiring)

---

## 2. Convex Backend Architecture

### 2.1 Authorization Patterns

All Convex functions must verify user identity and role. Standard pattern:

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Helper: Get authenticated user
async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("UNAUTHENTICATED");
  
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError("User not found");
  
  return user;
}

// Helper: Get user role
async function getUserRole(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  
  if (!roleDoc) throw new ConvexError("Role not found");
  return roleDoc.role;
}

// Helper: Check role
async function requireRole(ctx: QueryCtx | MutationCtx, expectedRole: "freelancer" | "client") {
  const user = await getAuthUser(ctx);
  const role = await getUserRole(ctx, user._id);
  
  if (role !== expectedRole) {
    throw new ConvexError({ message: "UNAUTHORIZED", role: expectedRole });
  }
  
  return { user, role };
}
```

### 2.2 Schema Verification

Current schema in [`convex/schema.ts`](convex/schema.ts) includes:

✅ `userRoles` — `{ userId, role, createdAt }`  
✅ `userPushTokens` — `{ userId, token, createdAt }`  
✅ `contracts` — Full schema defined  
✅ `tasks` — Full schema defined  
✅ `messages` — Full schema defined  
✅ `invoices` — Full schema defined  
✅ `notifications` — Full schema defined  

**Indexes required (verify in schema.ts):**

```typescript
// contracts
.index("by_freelancer", ["freelancerId"])
.index("by_client", ["clientId"])
.index("by_status", ["status"])

// tasks
.index("by_contract", ["contractId"])
.index("by_contract_and_status", ["contractId", "status"])

// messages
.index("by_contract", ["contractId"])

// notifications
.index("by_user", ["userId"])
.index("by_user_and_read", ["userId", "read"])
```

### 2.3 Real-time Query Strategy

**Convex queries are live subscriptions by default.** When data changes, all subscribed clients receive updates instantly.

#### Query Design Principles:

1. **Use indexes for all queries** — Never use `.filter()`, always define indexes
2. **Return only necessary fields** — Project only what the UI needs
3. **Paginate long lists** — Messages use pagination; contracts/tasks can use `.take(100)` for v1
4. **Derive completion percent client-side** — Avoids extra DB reads

#### Example Query Pattern:

```typescript
// contracts.ts
export const listByFreelancer = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireRole(ctx, "freelancer");
    
    return await ctx.db
      .query("contracts")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .order("desc")
      .take(100);
  },
});
```

### 2.4 Mutation Design Patterns

#### Atomic Updates with Derived State:

When a task completes, we need to:
1. Update task status
2. Recalculate contract completion percent
3. Create notification if 100% complete

**Pattern: Use internal mutations for derived updates**

```typescript
// tasks.ts
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, "freelancer");
    
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    
    // Verify ownership
    const contract = await ctx.db.get(task.contractId);
    if (!contract || contract.freelancerId !== user._id) {
      throw new ConvexError("UNAUTHORIZED");
    }
    
    // Update task
    await ctx.db.patch(task._id, { status: args.status });
    
    // Trigger completion recalculation
    await ctx.runMutation(internal.contracts.updateCompletionPercent, {
      contractId: task.contractId,
    });
    
    return { success: true };
  },
});
```

### 2.5 Notification Creation Pattern

Notifications are created by internal mutations called from other mutations:

```typescript
// notifications.ts
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
      type: args.type as any,
      contractId: args.contractId ?? null,
      message: args.message,
      read: false,
    });
  },
});

// Usage in contracts.ts:accept
await ctx.runMutation(internal.notifications.create, {
  userId: contract.freelancerId,
  type: "contract_accepted",
  contractId: contract._id,
  message: `${clientName} accepted your contract "${contract.title}"`,
});
```

---

## 3. Frontend Architecture

### 3.1 Hook Patterns

**Standard Convex Hook Wrapper:**

```typescript
// hooks/use-contracts.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export function useContracts() {
  const contracts = useQuery(api.contracts.listByFreelancer);
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
```

### 3.2 SQLite Caching Strategy

**Goal:** Offline read for contracts, tasks, and messages.

#### Cache Update Pattern:

```typescript
// hooks/use-contracts.ts (extended)
import { upsertContract } from "lib/sqlite";

export function useContracts() {
  const contracts = useQuery(api.contracts.listByFreelancer);
  
  useEffect(() => {
    if (contracts) {
      // Cache all contracts
      contracts.forEach((contract) => {
        upsertContract(contract);
      });
    }
  }, [contracts]);
  
  return { contracts, isLoading: contracts === undefined };
}
```

#### SQLite Schema Extension:

Add to [`lib/sqlite.ts`](lib/sqlite.ts):

```sql
-- Contracts cache
CREATE TABLE IF NOT EXISTS cached_contracts (
  id TEXT PRIMARY KEY,
  freelancerId TEXT,
  clientId TEXT,
  title TEXT,
  status TEXT,
  pricingType TEXT,
  completionPercent INTEGER,
  data TEXT, -- JSON blob of full contract
  updatedAt INTEGER
);

-- Tasks cache
CREATE TABLE IF NOT EXISTS cached_tasks (
  id TEXT PRIMARY KEY,
  contractId TEXT,
  title TEXT,
  status TEXT,
  timeSpent INTEGER,
  data TEXT, -- JSON blob
  updatedAt INTEGER
);

-- Messages cache
CREATE TABLE IF NOT EXISTS cached_messages (
  id TEXT PRIMARY KEY,
  contractId TEXT,
  senderId TEXT,
  content TEXT,
  createdAt INTEGER
);
```

### 3.3 UI Component Patterns

#### ContractCard Example:

```typescript
// src/components/contracts/ContractCard.tsx
import { Contract } from "src/types";
import { Card, Typography, Badge } from "../ui";

interface ContractCardProps {
  contract: Contract;
  onPress: () => void;
}

export function ContractCard({ contract, onPress }: ContractCardProps) {
  return (
    <Card onPress={onPress}>
      <Typography variant="h3">{contract.title}</Typography>
      <Typography variant="body">{contract.clientName}</Typography>
      <Badge status={contract.status} />
      <CompletionBar percent={contract.completionPercent} />
    </Card>
  );
}
```

---

## 4. Implementation Order

### Phase 1: Backend Foundation (Tasks 1-2)
1. ✅ Verify schema indexes
2. ✅ Implement [`convex/contracts.ts`](convex/contracts.ts)
3. ✅ Implement [`convex/tasks.ts`](convex/tasks.ts)
4. ✅ Implement [`convex/messages.ts`](convex/messages.ts)
5. ✅ Implement [`convex/notifications.ts`](convex/notifications.ts)
6. ✅ Update [`convex/users.ts`](convex/users.ts) (me query + updateProfile)

### Phase 2: Hooks Layer (Task 3)
1. ✅ Create [`hooks/use-contracts.ts`](hooks/use-contracts.ts)
2. ✅ Create [`hooks/use-tasks.ts`](hooks/use-tasks.ts)
3. ✅ Create [`hooks/use-messages.ts`](hooks/use-messages.ts)
4. ✅ Create [`hooks/use-notifications.ts`](hooks/use-notifications.ts)

### Phase 3: UI Components (Task 4)
1. ✅ Create contract components
2. ✅ Create task components (including timer)
3. ✅ Create chat components
4. ✅ Create notification components

### Phase 4: Freelancer Screens (Tasks 4-6)
1. ✅ Wire [`app/(freelancer)/contracts/index.tsx`](app/(freelancer)/contracts/index.tsx)
2. ✅ Create [`app/(freelancer)/contracts/new.tsx`](app/(freelancer)/contracts/new.tsx)
3. ✅ Create [`app/(freelancer)/contracts/[id]/index.tsx`](app/(freelancer)/contracts/[id]/index.tsx)
4. ✅ Create [`app/(freelancer)/contracts/[id]/tasks.tsx`](app/(freelancer)/contracts/[id]/tasks.tsx)
5. ✅ Create [`app/(freelancer)/chat/[contractId].tsx`](app/(freelancer)/chat/[contractId].tsx)
6. ✅ Wire [`app/(freelancer)/notifications/index.tsx`](app/(freelancer)/notifications/index.tsx)

### Phase 5: Client Screens (Tasks 7-8)
1. ✅ Update [`app/(client)/dashboard/index.tsx`](app/(client)/dashboard/index.tsx)
2. ✅ Wire [`app/(client)/contracts/index.tsx`](app/(client)/contracts/index.tsx)
3. ✅ Create [`app/(client)/contracts/[id]/index.tsx`](app/(client)/contracts/[id]/index.tsx)
4. ✅ Create [`app/(client)/chat/[contractId].tsx`](app/(client)/chat/[contractId].tsx)
5. ✅ Wire [`app/(client)/notifications/index.tsx`](app/(client)/notifications/index.tsx)

### Phase 6: SQLite Caching (Task 15)
1. ✅ Extend [`lib/sqlite.ts`](lib/sqlite.ts) with cache tables
2. ✅ Add cache writers to hooks
3. ✅ Add cache readers for offline fallback

### Phase 7: Testing & Refinement (Task 17)
1. ✅ End-to-end flow: Create contract → Accept → Add tasks → Complete
2. ✅ Verify real-time updates
3. ✅ Test offline mode (airplane mode)
4. ✅ Verify notifications appear

---

## 5. Security & Authorization Checklist

### Convex Functions:

- [ ] All queries use `getAuthUserId()` to verify session
- [ ] All mutations check ownership before updates
- [ ] Role checks use `userRoles` table, not client-provided args
- [ ] Cross-role data access throws `ConvexError("UNAUTHORIZED")`
- [ ] Internal mutations are not exposed to client

### Frontend:

- [ ] No sensitive logic in client code
- [ ] Role checks happen server-side, not just UI hiding
- [ ] Navigation guards in `_layout.tsx` files
- [ ] No API keys or secrets in app bundle

---

## 6. File Structure Map

```
convex/
├── contracts.ts          ← NEW: Contract CRUD + accept/decline
├── tasks.ts              ← NEW: Task CRUD + timer logic
├── messages.ts           ← NEW: Chat send + paginated list
├── notifications.ts      ← NEW: Notification CRUD
├── users.ts              ← EXTEND: Add updateProfile mutation
└── schema.ts             ← VERIFY: All indexes present

hooks/
├── use-contracts.ts      ← NEW: Contract queries + mutations
├── use-tasks.ts          ← NEW: Task queries + mutations
├── use-messages.ts       ← NEW: Message subscription + send
└── use-notifications.ts  ← NEW: Notification subscription + mark read

src/components/
├── contracts/
│   ├── ContractCard.tsx
│   ├── ContractList.tsx
│   ├── ContractStatusBadge.tsx
│   └── CreateContractForm.tsx
├── tasks/
│   ├── TaskCard.tsx
│   ├── TaskList.tsx
│   ├── TimerControl.tsx
│   ├── CompletionBar.tsx
│   └── CreateTaskForm.tsx
├── chat/
│   ├── MessageBubble.tsx
│   ├── MessageList.tsx
│   └── MessageInput.tsx
└── notifications/
    ├── NotificationCard.tsx
    └── NotificationList.tsx

app/(freelancer)/
├── contracts/
│   ├── index.tsx         ← UPDATE: Wire contract list
│   ├── new.tsx           ← NEW: Create contract form
│   └── [id]/
│       ├── index.tsx     ← NEW: Contract detail
│       └── tasks.tsx     ← NEW: Task management
├── chat/
│   └── [contractId].tsx  ← NEW: Chat screen
└── notifications/
    └── index.tsx         ← UPDATE: Wire notification list

app/(client)/
├── contracts/
│   ├── index.tsx         ← UPDATE: Wire contract list
│   └── [id]/
│       └── index.tsx     ← NEW: Contract detail + accept/decline
├── chat/
│   └── [contractId].tsx  ← NEW: Chat screen
└── notifications/
    └── index.tsx         ← UPDATE: Wire notification list

lib/
└── sqlite.ts             ← EXTEND: Add contract/task/message cache tables
```

---

## 7. Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Timer state lost on app backgrounding | Store `startedAt` in DB, recalculate on foreground |
| Race condition in completion percent update | Use internal mutation for atomic update |
| Message list too long (performance) | Use pagination (`usePaginatedQuery`) |
| Offline cache stale data | Show timestamp of last sync in UI |
| User accidentally deletes task | Add confirmation dialog before delete |

---

## 8. Next Steps After Architecture Approval

1. Switch to Code mode
2. Implement Phase 1 (Backend) first
3. Test each Convex function with `convex dev` dashboard
4. Implement hooks layer
5. Build UI components in Storybook-style isolation
6. Wire screens incrementally
7. Add SQLite caching last
8. End-to-end testing with two test accounts (freelancer + client)

---

## 9. Definition of Done (Sprint 2)

- [ ] Freelancer creates a contract and it appears in their list
- [ ] Client sees the contract and can accept or decline
- [ ] Accepted contract shows as active on both dashboards
- [ ] Freelancer adds tasks, toggles status, starts/stops timer, sees timeSpent
- [ ] Completion percentage updates in real time as tasks complete
- [ ] Both parties send and receive messages in real time
- [ ] Notifications appear in inbox for contract events
- [ ] Contracts and tasks readable offline via SQLite

---

## 10. Skills Required for Sprint 2

Based on the implementation needs, the following skills will be used:

1. **convex-functions** — Writing queries, mutations, actions with proper validation
2. **convex-quickstart** — Already used in Sprint 1, reference for patterns
3. **convex-setup-auth** — Already used in Sprint 1, reference for auth patterns
4. **native-data-fetching** (optional) — If we need complex data fetching patterns
5. **building-native-ui** (optional) — For complex UI components

**Primary skill for Sprint 2:** `convex-functions` (queries, mutations, validation, auth)

No need to load other skills yet — Sprint 2 is primarily backend-focused with standard React Native patterns already established in Sprint 1.

---

## Appendix A: Convex Guidelines Reference

Key patterns from [`convex/_generated/ai/guidelines.md`](convex/_generated/ai/guidelines.md):

1. **Always include argument validators** for all functions
2. **Use `withIndex` for queries**, never `.filter()`
3. **Use `.take(n)` for bounded collections**, not `.collect()`
4. **Use `ctx.runMutation` for internal mutations**, pass `internal.module.function`
5. **Use `getAuthUserId(ctx)` from `@convex-dev/auth/server`** for auth checks
6. **Use `ConvexError` for typed errors**
7. **Use pagination for long lists** (messages)
8. **Never use `.collect().length`** for counts — maintain denormalized counter

---

**End of Sprint 2 Architecture Plan**
