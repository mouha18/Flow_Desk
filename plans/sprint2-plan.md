# Sprint 2 — Core Features (Contracts + Tasks + Chat)

**Goal:** Full freelancer → contract → task → chat flow working end to end with real Convex data.  
**Deliverable:** Freelancer creates contract, client accepts/declines, freelancer adds tasks with timer, both parties chat in real time.

---

## Phase 1: Convex Backend (contracts, tasks, messages, notifications)

### 1.1 `convex/contracts.ts`
Queries:
- `list` — list all contracts for current user (by freelancerId OR clientId)
- `getById` — get single contract by ID with validation

Mutations:
- `create` — freelancer creates contract with client details, status="pending"
- `accept` — client accepts: set status="active", clientId=currentUserId
- `decline` — client declines: set status="declined"

```typescript
// Key patterns from existing users.ts
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
```

### 1.2 `convex/tasks.ts`
Queries:
- `list` — list tasks by contractId

Mutations:
- `create` — create task for contract, status="pending"
- `updateStatus` — toggle between pending/completed
- `startTimer` — set status="running", startedAt=Date.now()
- `stopTimer` — set status="pending", accumulate timeSpent
- `setHourlyRate` — update hourlyRate
- `delete` — remove task

### 1.3 `convex/messages.ts`
Queries:
- `listByContract` — paginated message list by contractId

Mutations:
- `send` — send message, senderId=currentUserId

### 1.4 `convex/notifications.ts`
Queries:
- `list` — list notifications for current user, ordered by _creationTime desc

Mutations:
- `create` — internal helper for creating notifications (called by other mutations)
- `markRead` — mark single notification as read
- `markAllRead` — mark all user notifications as read

---

## Phase 2: Frontend Hooks

### 2.1 `hooks/useContracts.ts`
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Expose:
// - contracts: list of user's contracts
// - createContract: mutation
// - acceptContract: mutation  
// - declineContract: mutation
// - isLoading: boolean
```

### 2.2 `hooks/useTasks.ts`
```typescript
// Expose:
// - tasks: list of tasks for contract
// - completionPercent: calculated from completed/total tasks
// - createTask, updateStatus, startTimer, stopTimer, setHourlyRate, deleteTask
```

### 2.3 `hooks/useMessages.ts`
```typescript
// Expose:
// - messages: paginated message list
// - sendMessage: mutation
```

### 2.4 `hooks/useNotifications.ts`
```typescript
// Expose:
// - notifications: user's notifications
// - unreadCount: number
// - markRead, markAllRead: mutations
```

---

## Phase 3: UI Components

### 3.1 Contract Components
```
src/components/contracts/
  ContractCard.tsx      # Displays contract summary (title, status, client, completion%)
  CreateContractForm.tsx # Form for creating new contract
  ContractDetail.tsx    # Full contract view (shared by freelancer/client)
```

### 3.2 Task Components
```
src/components/tasks/
  TaskItem.tsx          # Single task with timer toggle
  TaskList.tsx          # List of tasks with completion bar
  TimerControl.tsx      # Start/stop timer button
  CompletionBar.tsx     # Visual completion percentage
```

### 3.3 Chat Components
```
src/components/chat/
  ChatBubble.tsx        # Message bubble (sender vs receiver styling)
  ChatInput.tsx         # Text input + send button
  ChatList.tsx          # Message list with real-time updates
```

### 3.4 Notification Components
```
src/components/notifications/
  NotificationItem.tsx  # Single notification row
  NotificationList.tsx  # Notification list with read/unread styling
```

---

## Phase 4: Screen Implementation

### 4.1 Freelancer Screens
```
app/(freelancer)/
  contracts/
    index.tsx           # Contract list (already stubbed)
    new.tsx             # Create contract form
    [id]/
      index.tsx         # Contract detail
      tasks.tsx         # Task list with timer
  chat/
    [contractId].tsx     # Chat screen
```

### 4.2 Client Screens
```
app/(client)/
  dashboard/
    index.tsx           # Update: add pending contract list
  contracts/
    [id]/
      index.tsx         # Contract detail with accept/decline
  chat/
    [contractId].tsx     # Chat screen
```

### 4.3 Navigation Updates
- Add `contracts` and `chat` routes to freelancer drawer layout
- Add `chat` route to client drawer layout

---

## Phase 5: SQLite Caching

### 5.1 Update `lib/sqlite.ts`
Add cache functions for:
- `cacheContracts(contracts)`
- `getCachedContracts()`
- `cacheTasks(tasks)`
- `getCachedTasks(contractId)`
- `cacheMessages(messages)`
- `getCachedMessages(contractId)`

### 5.2 Wire caching into hooks
After fetching from Convex, persist to SQLite for offline access.

---

## Implementation Order

1. **contracts.ts** — foundation for everything
2. **useContracts.ts** — test with simple list
3. **Freelancer contract list + ContractCard**
4. **Create contract form + screen**
5. **Client dashboard update + pending list**
6. **Client accept/decline**
7. **tasks.ts** + **useTasks.ts**
8. **Task list + timer components**
9. **messages.ts** + **useMessages.ts** + **Chat components**
10. **notifications.ts** + **useNotifications.ts** + **Notification components**
11. **SQLite caching**
12. **Final integration + testing**

---

## Critical Rules Reminder

1. **No navigation during render** — use `useEffect` for all router calls
2. **Auth session** — use `getAuthUserId(ctx)` NOT `ctx.auth.getUserIdentity()`
3. **Schema changes** — must run `npx convex dev` after any schema modification
4. **No Tailwind** — use only React Native `StyleSheet.create()`
5. **No components needed** — tables already exist in main schema, just add queries/mutations

---

## Files to Create/Modify

### New Files
- `convex/contracts.ts`
- `convex/tasks.ts`
- `convex/messages.ts`
- `convex/notifications.ts`
- `hooks/useContracts.ts`
- `hooks/useTasks.ts`
- `hooks/useMessages.ts`
- `hooks/useNotifications.ts`
- `src/components/contracts/*.tsx`
- `src/components/tasks/*.tsx`
- `src/components/chat/*.tsx`
- `src/components/notifications/*.tsx`
- `app/(freelancer)/contracts/new.tsx`
- `app/(freelancer)/contracts/[id]/index.tsx`
- `app/(freelancer)/contracts/[id]/tasks.tsx`
- `app/(freelancer)/chat/[contractId].tsx`
- `app/(client)/contracts/[id]/index.tsx`
- `app/(client)/chat/[contractId].tsx`
- `lib/sqlite.ts` (update)

### Files to Modify
- `app/(freelancer)/contracts/index.tsx` (update)
- `app/(client)/dashboard/index.tsx` (update)
- `app/(freelancer)/_layout.tsx` (add routes)
- `app/(client)/_layout.tsx` (add routes)
- `src/components/ui/*.tsx` (possibly add new primitives)

---

## Definition of Done

- [ ] Freelancer creates a contract and it appears in their list
- [ ] Client sees the contract and can accept or decline
- [ ] Accepted contract shows as active on both dashboards
- [ ] Freelancer adds tasks, toggles status, starts/stops timer, sees timeSpent
- [ ] Completion percentage updates in real time as tasks complete
- [ ] Both parties send and receive messages in real time
- [ ] Notifications appear in inbox for contract events
- [ ] Contracts and tasks readable offline via SQLite
