# Flowdesk — Technical Roadmap

**Version:** 1.0  
**Last Updated:** 2026-04-05  

---

## 1. Project File Structure

```text
flowdesk/
├── app/                                    # Expo Router screens
│   ├── _layout.tsx                         # Root layout, auth guard, role routing
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── role-select.tsx
│   ├── (freelancer)/
│   │   ├── _layout.tsx                     # Freelancer Tab + Drawer navigator
│   │   ├── dashboard/
│   │   │   └── index.tsx                   # Contract pipeline overview
│   │   ├── contracts/
│   │   │   ├── index.tsx                   # Contract list by status
│   │   │   ├── new.tsx                     # Create contract form
│   │   │   └── [id]/
│   │   │       ├── index.tsx               # Contract detail
│   │   │       ├── tasks.tsx               # Task list + timer
│   │   │       └── invoice.tsx             # Invoice draft + send
│   │   ├── chat/
│   │   │   ├── index.tsx                   # Chat list (all contracts)
│   │   │   └── [contractId].tsx            # Contract chat room
│   │   ├── notifications/
│   │   │   └── index.tsx                   # Notification inbox
│   │   └── profile/
│   │       └── index.tsx
│   └── (client)/
│       ├── _layout.tsx                     # Client Tab + Drawer navigator
│       ├── dashboard/
│       │   └── index.tsx                   # Pending + active contracts
│       ├── contracts/
│       │   ├── index.tsx
│       │   └── [id]/
│       │       ├── index.tsx               # Contract detail (read-only)
│       │       └── invoice.tsx             # Invoice view + payment simulation
│       ├── chat/
│       │   ├── index.tsx
│       │   └── [contractId].tsx
│       ├── notifications/
│       │   └── index.tsx
│       └── profile/
│           └── index.tsx
│
├── components/
│   ├── ui/                                 # Base design system
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Screen.tsx                      # Safe area wrapper
│   │   ├── Divider.tsx
│   │   └── Typography.tsx
│   ├── contracts/
│   │   ├── ContractCard.tsx
│   │   ├── ContractStatusBadge.tsx
│   │   ├── CompletionBar.tsx
│   │   └── CreateContractForm.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskStatusToggle.tsx
│   │   └── TimerControl.tsx
│   ├── invoice/
│   │   ├── InvoiceLineItem.tsx
│   │   ├── InvoiceSummary.tsx
│   │   └── PaymentMethodSelector.tsx
│   └── chat/
│       ├── MessageBubble.tsx
│       ├── ChatInput.tsx
│       └── ChatList.tsx
│
├── convex/                                 # Convex backend
│   ├── schema.ts
│   ├── auth.config.ts
│   ├── users.ts
│   ├── contracts.ts
│   ├── tasks.ts
│   ├── messages.ts
│   ├── invoices.ts
│   ├── notifications.ts
│   └── actions/
│       ├── ai.ts                           # Anthropic API calls
│       ├── email.ts                        # Resend email sends
│       └── push.ts                         # Expo Push API sends
│
├── hooks/
│   ├── useCurrentUser.ts
│   ├── useContracts.ts
│   ├── useTasks.ts
│   ├── useInvoice.ts
│   ├── useMessages.ts
│   ├── useNotifications.ts
│   └── usePushNotifications.ts
│
├── lib/
│   ├── sqlite.ts                           # SQLite cache layer (init, read, write, sync)
│   ├── storage.ts                          # AsyncStorage helpers (token, role, prefs)
│   └── formatting.ts                       # Currency (XOF/USD), date, duration formatters
│
├── constants/
│   ├── colors.ts                           # Design token palette
│   ├── typography.ts                       # Font sizes, weights, families
│   └── spacing.ts                          # Spacing scale
│
├── types/
│   └── index.ts                            # All shared TypeScript types
│
├── .env.example
├── app.json
├── package.json
└── tsconfig.json
```

---

## 2. Type Definitions

```typescript
// types/index.ts

import { Id } from "../convex/_generated/dataModel";

// ─── Entities ───────────────────────────────────────────────

export type User = {
  _id: Id<"users">;
  name: string;
  email: string;
  pseudo: string;
  role: "freelancer" | "client";
  pushToken: string | null;
  _creationTime: number;
};

export type Contract = {
  _id: Id<"contracts">;
  freelancerId: Id<"users">;
  clientId: Id<"users"> | null;
  clientEmail: string;
  clientName: string;
  clientPseudo: string;
  title: string;
  status: ContractStatus;
  pricingType: PricingType;
  fixedPrice: number | null;
  paymentTiming: PaymentTiming;
  paymentMethod: PaymentMethod;
  aiEmailTone: EmailTone;
  completionPercent: number;
  deliverableLink: string | null;
  _creationTime: number;
};

export type Task = {
  _id: Id<"tasks">;
  contractId: Id<"contracts">;
  title: string;
  status: TaskStatus;
  hourlyRate: number | null;
  startedAt: number | null;
  completedAt: number | null;
  timeSpent: number | null;
  _creationTime: number;
};

export type LineItem = {
  description: string;
  hours: number | null;
  rate: number | null;
  amount: number;
};

export type Invoice = {
  _id: Id<"invoices">;
  contractId: Id<"contracts">;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  aiGenerated: boolean;
  notes: string | null;
  status: InvoiceStatus;
  paymentSimulated: boolean;
  _creationTime: number;
};

export type Message = {
  _id: Id<"messages">;
  contractId: Id<"contracts">;
  senderId: Id<"users">;
  senderName: string;
  content: string;
  _creationTime: number;
};

export type Notification = {
  _id: Id<"notifications">;
  userId: Id<"users">;
  type: NotificationType;
  contractId: Id<"contracts"> | null;
  message: string;
  read: boolean;
  _creationTime: number;
};

// ─── Union Types ─────────────────────────────────────────────

export type ContractStatus = "pending" | "active" | "completed" | "declined";
export type TaskStatus = "pending" | "running" | "completed";
export type InvoiceStatus = "draft" | "sent" | "paid";
export type PricingType = "fixed" | "hourly";
export type PaymentTiming = "now" | "later";
export type PaymentMethod = "stripe" | "naboo_orange" | "naboo_wave";
export type EmailTone = "formal" | "friendly" | "casual";
export type NotificationType =
  | "contract_invite"
  | "contract_accepted"
  | "contract_declined"
  | "task_complete"
  | "invoice_received"
  | "payment_received"
  | "new_message";

// ─── Input Types ─────────────────────────────────────────────

export type CreateContractInput = {
  clientEmail: string;
  clientName: string;
  clientPseudo: string;
  title: string;
  pricingType: PricingType;
  fixedPrice?: number;
  paymentTiming: PaymentTiming;
  paymentMethod: PaymentMethod;
  aiEmailTone: EmailTone;
};

export type CreateTaskInput = {
  contractId: Id<"contracts">;
  title: string;
  hourlyRate?: number;
};

export type UpdateInvoiceInput = {
  invoiceId: Id<"invoices">;
  lineItems?: LineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
};

// ─── SQLite Cache Types ───────────────────────────────────────

export type CachedContract = Omit<Contract, "_id" | "freelancerId" | "clientId"> & {
  id: string;
  freelancerId: string;
  clientId: string | null;
};

export type CachedTask = Omit<Task, "_id" | "contractId"> & {
  id: string;
  contractId: string;
};

export type CachedMessage = Omit<Message, "_id" | "contractId" | "senderId"> & {
  id: string;
  contractId: string;
  senderId: string;
};
```

---

## 3. Function Signatures

### `hooks/useCurrentUser.ts`
```typescript
export function useCurrentUser(): {
  user: User | null | undefined;
  isLoading: boolean;
  isFreelancer: boolean;
  isClient: boolean;
}
```

### `hooks/useContracts.ts`
```typescript
export function useFreelancerContracts(): {
  contracts: Contract[] | undefined;
  createContract: (input: CreateContractInput) => Promise<Id<"contracts">>;
  isCreating: boolean;
}

export function useClientContracts(): {
  contracts: Contract[] | undefined;
  acceptContract: (contractId: Id<"contracts">) => Promise<void>;
  declineContract: (contractId: Id<"contracts">) => Promise<void>;
}

export function useContract(contractId: Id<"contracts">): {
  contract: Contract | null | undefined;
  updateDeliverableLink: (link: string) => Promise<void>;
}
```

### `hooks/useTasks.ts`
```typescript
export function useTasks(contractId: Id<"contracts">): {
  tasks: Task[] | undefined;
  completionPercent: number;
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateStatus: (taskId: Id<"tasks">, status: TaskStatus) => Promise<void>;
  startTimer: (taskId: Id<"tasks">) => Promise<void>;
  stopTimer: (taskId: Id<"tasks">) => Promise<void>;
  setHourlyRate: (taskId: Id<"tasks">, rate: number) => Promise<void>;
  deleteTask: (taskId: Id<"tasks">) => Promise<void>;
}
```

### `hooks/useInvoice.ts`
```typescript
export function useInvoice(contractId: Id<"contracts">): {
  invoice: Invoice | null | undefined;
  generateInvoice: () => Promise<void>;
  updateInvoice: (input: UpdateInvoiceInput) => Promise<void>;
  sendInvoice: () => Promise<void>;
  simulatePayment: () => Promise<void>;
  isGenerating: boolean;
}
```

### `hooks/useMessages.ts`
```typescript
export function useMessages(contractId: Id<"contracts">): {
  messages: Message[] | undefined;
  sendMessage: (content: string) => Promise<void>;
  loadMore: () => void;
  isDone: boolean;
}
```

### `hooks/useNotifications.ts`
```typescript
export function useNotifications(): {
  notifications: Notification[] | undefined;
  unreadCount: number;
  markRead: (notificationId: Id<"notifications">) => Promise<void>;
  markAllRead: () => Promise<void>;
}
```

### `lib/sqlite.ts`
```typescript
export async function initSQLite(): Promise<void>;
export async function cacheContracts(contracts: Contract[]): Promise<void>;
export async function getCachedContracts(): Promise<CachedContract[]>;
export async function cacheTasks(tasks: Task[]): Promise<void>;
export async function getCachedTasks(contractId: string): Promise<CachedTask[]>;
export async function cacheMessages(messages: Message[]): Promise<void>;
export async function getCachedMessages(contractId: string): Promise<CachedMessage[]>;
export async function clearCache(): Promise<void>;
```

### `lib/storage.ts`
```typescript
export async function storeRole(role: "freelancer" | "client"): Promise<void>;
export async function getRole(): Promise<"freelancer" | "client" | null>;
export async function storeLastContractId(id: string): Promise<void>;
export async function getLastContractId(): Promise<string | null>;
export async function clearStorage(): Promise<void>;
```

---

## 4. Exact Data Flows

### Contract Creation

```text
CreateContractForm (component)
  → calls useContracts().createContract(input)
  → calls useMutation(api.contracts.create)(input)
  → Convex mutation contracts.create:
      1. Validates input with v validators
      2. Gets caller user via ctx.auth
      3. Inserts contract doc (status: "pending")
      4. Schedules action: actions/ai.generateOutreachEmail
         → calls Anthropic API
         → returns email subject + body
         → calls actions/email.sendContractInvite (Resend)
      5. If clientId found by email: schedules actions/push.sendPush to client
      6. Inserts notification doc for client
  ← returns { contractId }
  → router.push to contract detail screen
```

### Task Timer Stop → Completion Check

```text
TimerControl (component) taps Stop
  → calls useTasks().stopTimer(taskId)
  → calls useMutation(api.tasks.stopTimer)({ taskId })
  → Convex mutation tasks.stopTimer:
      1. Sets task.completedAt = Date.now()
      2. Calculates task.timeSpent = (completedAt - startedAt) / 60000
      3. Updates task.status = "completed"
      4. Queries all tasks for this contract
      5. Recalculates completionPercent
      6. Updates contract.completionPercent
      7. If completionPercent === 100:
         a. Schedules actions/push.sendPush to client
         b. Inserts notification doc for client
  ← returns { completedAt, timeSpent }
  → UI updates via useQuery subscription (real time)
```

### AI Invoice Generation

```text
InvoiceScreen taps "Generate Invoice"
  → calls useInvoice().generateInvoice()
  → calls useAction(api.invoices.generate)({ contractId })
  → Convex action invoices.generate:
      1. Fetches contract + all tasks
      2. Builds prompt payload:
         - pricingType, fixedPrice
         - tasks: [{ title, timeSpent, hourlyRate }]
         - clientName
      3. Calls Anthropic API (claude-sonnet-4-20250514)
      4. Parses JSON response → { lineItems, subtotal, tax, total, notes }
      5. Inserts invoice doc (status: "draft", aiGenerated: true)
  ← returns invoice doc
  → InvoiceDraftScreen renders editable line items
```

---

## 5. Files to Create vs. Modify

### Create from Scratch

| File | Purpose |
|---|---|
| `convex/schema.ts` | Full Convex schema definition |
| `convex/contracts.ts` | Contract queries + mutations |
| `convex/tasks.ts` | Task queries + mutations |
| `convex/messages.ts` | Message queries + mutations |
| `convex/invoices.ts` | Invoice query + mutations |
| `convex/notifications.ts` | Notification queries + mutations |
| `convex/actions/ai.ts` | Anthropic API calls |
| `convex/actions/email.ts` | Resend email sends |
| `convex/actions/push.ts` | Expo Push API sends |
| `lib/sqlite.ts` | SQLite cache layer |
| `lib/storage.ts` | AsyncStorage helpers |
| `lib/formatting.ts` | Currency + date formatters |
| `constants/colors.ts` | Design token palette |
| `types/index.ts` | All shared types |
| All screen files | See file structure above |
| All component files | See file structure above |
| All hook files | See file structure above |

### Modify Existing

| File | What to Change |
|---|---|
| `app.json` | Add notification permissions, app name, icon |
| `package.json` | Add convex, expo-sqlite, expo-notifications, @react-navigation/* |
| `tsconfig.json` | Add path aliases for `@/components`, `@/lib`, `@/types` |

---

## 6. Component Interaction Map

```text
app/_layout.tsx
  └── useCurrentUser()                         # determines which navigator to render
      ├── (auth)/_layout.tsx                   # if no session
      ├── (freelancer)/_layout.tsx             # if role === freelancer
      │   ├── Tab.Navigator
      │   │   ├── dashboard/index.tsx
      │   │   │   └── useFreelancerContracts() → ContractCard[]
      │   │   ├── contracts/index.tsx
      │   │   │   └── useFreelancerContracts() → ContractCard[]
      │   │   ├── contracts/[id]/tasks.tsx
      │   │   │   └── useTasks(contractId) → TaskCard[], TimerControl
      │   │   ├── contracts/[id]/invoice.tsx
      │   │   │   └── useInvoice(contractId) → InvoiceLineItem[], InvoiceSummary
      │   │   ├── chat/[contractId].tsx
      │   │   │   └── useMessages(contractId) → MessageBubble[], ChatInput
      │   │   └── notifications/index.tsx
      │   │       └── useNotifications() → Notification[]
      │   └── Drawer.Navigator (Settings, Profile, Logout)
      └── (client)/_layout.tsx                 # if role === client
          └── (mirrors freelancer structure, read-only contract views)
```

**State ownership:**

| State | Lives in | Shared via |
|---|---|---|
| Current user | `useCurrentUser` hook | Context / prop drilling |
| Contracts list | Convex `useQuery` | Per-screen subscription |
| Active contract | Convex `useQuery` | Per-screen subscription |
| Tasks | Convex `useQuery` | `useTasks` hook |
| Invoice | Convex `useQuery` | `useInvoice` hook |
| Messages | Convex `usePaginatedQuery` | `useMessages` hook |
| Notifications | Convex `useQuery` | `useNotifications` hook |
| Auth token | Convex Auth SDK | Auto-managed |
| User role | AsyncStorage | `useCurrentUser` hook reads on mount |
| SQLite cache | `lib/sqlite.ts` | Called in hooks on reconnect |

---

## 7. Build Order

1. Set up TypeScript types in `types/index.ts`
2. Define Convex schema in `convex/schema.ts`
3. Set up Convex Auth (`auth.config.ts`)
4. Implement `lib/storage.ts` (AsyncStorage helpers)
5. Implement `lib/sqlite.ts` (cache layer, init + CRUD)
6. Build `constants/colors.ts`, `typography.ts`, `spacing.ts`
7. Build base UI components (Button, Card, Badge, Input, Screen)
8. Build auth screens (Login, Register, Role Select)
9. Build navigation structure (Root layout + role routing)
10. Implement `convex/users.ts` + `useCurrentUser` hook
11. Implement `convex/contracts.ts` + `useContracts` hook + Contract screens
12. Implement `convex/tasks.ts` + `useTasks` hook + Task screens + timer
13. Implement `convex/messages.ts` + `useMessages` hook + Chat screens
14. Implement `convex/notifications.ts` + `useNotifications` hook + Notification screen
15. Implement `convex/actions/push.ts` + `hooks/usePushNotifications.ts` (register token)
16. Wire push notification sends into all contract/task/invoice mutations
17. Implement `convex/actions/ai.ts` (Anthropic — email generation)
18. Implement `convex/actions/email.ts` (Resend — 3 email triggers)
19. Implement `convex/invoices.ts` + AI invoice generation + `useInvoice` hook
20. Build Invoice Draft screen (editable line items)
21. Build Payment Simulation screen (client side)
22. Wire SQLite cache sync in hooks (on query result changes)
23. Polish: empty states, loading states, error states, animations
24. End-to-end demo walkthrough + bug fixes
