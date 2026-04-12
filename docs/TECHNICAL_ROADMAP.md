# FlowDesk — Technical Roadmap

**Version:** 2.0  
**Last Updated:** 2026-04-12  
**Status:** Sprints 1-3 ✅ Complete | Sprint 4 🔄 In Progress

---

## 1. Project File Structure (Current)

```text
flowdesk/
├── app/                                    # Expo Router screens
│   ├── _layout.tsx                         # Root layout with ConvexAuthProvider
│   ├── index.tsx                           # Entry point (auth + role redirect)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── legal.tsx                       # Terms of service
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── role-select.tsx
│   ├── (freelancer)/                        # Drawer navigation
│   │   ├── _layout.tsx
│   │   ├── dashboard/index.tsx
│   │   ├── contracts/
│   │   │   ├── index.tsx                   # Contract list
│   │   │   ├── new.tsx                     # Create contract
│   │   │   └── [id]/
│   │   │       ├── index.tsx               # Contract detail
│   │   │       ├── tasks.tsx               # Task list + timer
│   │   │       ├── complete.tsx            # Mark contract complete
│   │   │       └── invoice.tsx             # Invoice draft + send
│   │   ├── chat/[contractId].tsx           # Contract chat room
│   │   ├── notifications/
│   │   │   ├── index.tsx                   # Notification inbox
│   │   │   └── preferences.tsx             # Notification settings
│   │   └── profile/index.tsx
│   └── (client)/                            # Drawer navigation
│       ├── _layout.tsx
│       ├── dashboard/index.tsx
│       ├── contracts/
│       │   ├── index.tsx
│       │   └── [id]/
│       │       ├── index.tsx               # Contract detail + accept/decline
│       │       └── invoice.tsx             # Invoice view + payment
│       ├── chat/[contractId].tsx
│       ├── notifications/
│       │   ├── index.tsx
│       │   └── preferences.tsx
│       └── profile/index.tsx
│
├── src/                                     # Shared source code
│   ├── components/
│   │   ├── ui/                             # Design system
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── input.tsx
│   │   │   ├── screen.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── typography.tsx
│   │   ├── contracts/
│   │   │   ├── ContractCard.tsx
│   │   │   ├── CreateContractForm.tsx
│   │   │   └── DeliverableLinks.tsx
│   │   ├── tasks/
│   │   │   ├── CompletionBar.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── TimerControl.tsx
│   │   ├── invoice/
│   │   │   ├── InvoiceLineItems.tsx
│   │   │   ├── InvoiceSummary.tsx
│   │   │   └── PaymentSimulation.tsx
│   │   ├── chat/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ChatList.tsx
│   │   ├── notifications/
│   │   │   ├── NotificationItem.tsx
│   │   │   └── NotificationList.tsx
│   │   └── drawer/
│   │       └── DrawerContent.tsx
│   ├── constants/
│   │   ├── colors.ts                       # Brand + role colors
│   │   ├── spacing.ts
│   │   └── typography.ts
│   └── types/
│       └── index.ts                        # Shared TypeScript types
│
├── convex/                                 # Convex backend
│   ├── schema.ts                           # DB schema (10 tables)
│   ├── auth.ts                             # Convex Auth config
│   ├── auth.config.ts
│   ├── users.ts                            # User queries/mutations
│   ├── contracts.ts                        # Contract CRUD
│   ├── tasks.ts                            # Task CRUD + timer
│   ├── messages.ts                         # Chat messages
│   ├── invoices.ts                         # Invoice + payment
│   ├── notifications.ts                    # Notification CRUD
│   ├── ai.ts                               # Anthropic API calls
│   ├── email.ts                            # Resend email
│   ├── pushInternal.ts                     # Internal push helpers
│   └── actions/
│       └── push.ts                         # Expo Push sender
│
├── hooks/                                  # Custom React hooks
│   ├── use-auth.ts                         # Auth state
│   ├── use-contracts.ts
│   ├── use-tasks.ts
│   ├── use-invoice.ts
│   ├── use-messages.ts
│   ├── use-notifications.ts
│   ├── use-unread-counts.ts
│   └── use-push-notifications.ts
│
├── lib/
│   ├── sqlite.ts                           # SQLite cache layer
│   ├── storage.ts                          # AsyncStorage helpers
│   ├── formatting.ts                       # Currency, date formatters
│   └── index.ts
│
├── .env.example
├── app.json
├── package.json
├── tsconfig.json
└── AGENTS.md                               # Agent guidelines
```

---

## 2. Database Schema (Convex)

See `docs/DATABASE_SCHEMA.md` for full schema documentation.

**Tables:**
| Table | Status | Notes |
|---|---|---|
| `users` | ✅ | From Convex Auth (authTables) |
| `userRoles` | ✅ | Freelancer/Client per user |
| `userPushTokens` | ✅ | Push tokens per user |
| `userEmails` | ✅ | Email lookup optimization |
| `chatReadStatus` | ✅ | Last read per user/contract |
| `notificationPreferences` | ✅ | Per-user notification settings |
| `contracts` | ✅ | With escrow fields |
| `tasks` | ✅ | With time tracking |
| `messages` | ✅ | Chat messages |
| `invoices` | ✅ | With line items + deliverables |
| `notifications` | ✅ | 10 notification types |

---

## 3. Implemented Hooks

### `hooks/use-auth.ts`
```typescript
export function useAuth(): {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userRole: "freelancer" | "client" | null;
}
```

### `hooks/use-contracts.ts`
```typescript
export function useContracts(): {
  contracts: Contract[] | undefined;
  isLoading: boolean;
  createContract: (input: CreateContractInput) => Promise<Id<"contracts">>;
}

export function useContract(contractId: Id<"contracts">): {
  contract: Contract | null | undefined;
  // ...
}
```

### `hooks/use-tasks.ts`
```typescript
export function useTasks(contractId: Id<"contracts">): {
  tasks: Task[] | undefined;
  completionPercent: number;
  createTask: (title: string) => Promise<void>;
  toggleStatus: (taskId: Id<"tasks">) => Promise<void>;
  startTimer: (taskId: Id<"tasks">) => Promise<void>;
  stopTimer: (taskId: Id<"tasks">) => Promise<void>;
}
```

### `hooks/use-invoice.ts`
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

### `hooks/use-messages.ts`
```typescript
export function useMessages(contractId: Id<"contracts">): {
  messages: Message[] | undefined;
  sendMessage: (content: string) => Promise<void>;
}
```

---

## 4. Convex Functions

### Queries
| Function | File | Status |
|---|---|---|
| `users.me` | users.ts | ✅ |
| `contracts.list` | contracts.ts | ✅ |
| `contracts.getById` | contracts.ts | ✅ |
| `tasks.list` | tasks.ts | ✅ |
| `messages.list` | messages.ts | ✅ |
| `invoices.getByContract` | invoices.ts | ✅ |
| `notifications.list` | notifications.ts | ✅ |

### Mutations
| Function | File | Status |
|---|---|---|
| `users.updateProfile` | users.ts | ✅ |
| `users.registerPushToken` | users.ts | ✅ |
| `contracts.create` | contracts.ts | ✅ |
| `contracts.accept` | contracts.ts | ✅ |
| `contracts.decline` | contracts.ts | ✅ |
| `contracts.updateCompletion` | contracts.ts | ✅ |
| `contracts.updateDeliverables` | contracts.ts | ✅ |
| `tasks.create` | tasks.ts | ✅ |
| `tasks.updateStatus` | tasks.ts | ✅ |
| `tasks.startTimer` | tasks.ts | ✅ |
| `tasks.stopTimer` | tasks.ts | ✅ |
| `messages.send` | messages.ts | ✅ |
| `invoices.generate` | invoices.ts | ✅ |
| `invoices.update` | invoices.ts | ✅ |
| `invoices.send` | invoices.ts | ✅ |
| `invoices.simulatePayment` | invoices.ts | ✅ |
| `notifications.markRead` | notifications.ts | ✅ |
| `notifications.markAllRead` | notifications.ts | ✅ |
| `notificationPreferences.upsert` | notifications.ts | ✅ |

### Actions
| Function | File | Status |
|---|---|---|
| `ai.generateOutreachEmail` | ai.ts | ✅ |
| `ai.generateInvoice` | ai.ts | ✅ |
| `email.sendContractInvite` | email.ts | ✅ |
| `email.sendAcceptNotification` | email.ts | ✅ |
| `email.sendInvoiceEmail` | email.ts | ✅ |
| `email.sendPaymentConfirmation` | email.ts | ✅ |
| `actions.push.sendPush` | actions/push.ts | ✅ |
| `actions.push.sendPaymentReceivedNotification` | actions/push.ts | ✅ |

---

## 5. Data Flows (Implemented)

### Contract Creation → AI Email
```text
1. CreateContractForm → useMutation('contracts:create')
2. contracts.create mutation inserts contract (pending)
3. Mutation schedules action: ai.generateOutreachEmail
4. Action calls Anthropic API → returns email copy
5. Action calls Resend → sends email to clientEmail
6. If client exists: Action sends push notification
```

### Task 100% Completion → Invoice Generation
```text
1. useTasks().stopTimer(taskId)
2. tasks.stopTimer: sets completedAt, timeSpent
3. Calculates completionPercent on contract
4. If completionPercent === 100: sends push to client
5. Freelancer taps "Generate Invoice"
6. useAction('invoices:generate') → ai.generateInvoice
7. Action calls Anthropic API → returns invoice JSON
8. Invoice saved as status: 'draft'
```

### Payment Simulation → Deliverable Release
```text
1. useInvoice().simulatePayment()
2. invoices.simulatePayment: updates invoice to 'paid'
3. Updates contract escrowStatus to 'released'
4. Schedules email to freelancer + client
5. Schedules push to both parties
6. Client sees deliverable links revealed
```

---

## 6. Status Summary

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Foundation (auth, schema, UI components) | ✅ Complete |
| Phase 2 | Core Features (contracts, tasks, chat, notifications) | ✅ Complete |
| Phase 3 | UI & Logic Fixes (pricing, deliverables, chat UI, notifications) | ✅ Complete |
| Phase 4 | Payment & Earnings (AI, email, payment simulation, escrow) | 🔄 In Progress |
| Phase 5 | Polish (empty states, loading states, deep links) | 📋 Planned |

---

## 7. Environment Variables Required

```text
CONVEX_DEPLOYMENT=your-deployment-url
ANTHROPIC_API_KEY=your-anthropic-key
RESEND_API_KEY=your-resend-key
EXPO_PUBLIC_CONVEX_URL=your-public-url
```

---

## 8. External Services

| Service | Purpose | Status |
|---|---|---|
| Convex | Realtime DB + auth + actions | ✅ Integrated |
| Anthropic API | AI email + invoice generation | ✅ Integrated |
| Resend | Transactional email | ✅ Integrated |
| Expo Push API | Remote push notifications | ✅ Integrated |
| Stripe (mock) | Payment simulation | ✅ Integrated |
| NabooPay (mock) | Payment simulation | ✅ Integrated |
