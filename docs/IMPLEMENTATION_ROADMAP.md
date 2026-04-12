# FlowDesk — Implementation Roadmap

**Version:** 2.0  
**Last Updated:** 2026-04-12  
**Total Sprints:** 4  
**Sprint Length:** 1 week  

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Done |
| 🔄 | In Progress |
| 📋 | Planned |
| ⏸ | Blocked |

---

#### Sprint 1 — Foundation ✅ COMPLETED
**Goal:** Navigation skeleton, auth, Convex schema, and design system live. Every screen is reachable, no data yet.  
**Deliverable:** Login → Role select → Freelancer/Client dashboard (empty state). Push token registered on launch.

| # | Task | Type | Files Involved | Status |
|---|---|---|---|---|
| 1 | Expo project init (managed, TypeScript) | `infra` | `app.json`, `package.json`, `tsconfig.json` | ✅ |
| 2 | Install all dependencies (Convex, React Navigation, expo-sqlite, expo-notifications) | `infra` | `package.json` | ✅ |
| 3 | Define all TypeScript types | `chore` | `src/types/index.ts` | ✅ |
| 4 | Define Convex schema | `infra` | `convex/schema.ts` | ✅ |
| 5 | Configure Convex Auth | `infra` | `convex/auth.config.ts`, `convex/auth.ts` | ✅ |
| 6 | Build design system constants (colors, typography, spacing) | `chore` | `src/constants/*` | ✅ |
| 7 | Build base UI components (Button, Card, Badge, Input, Screen, Typography) | `feat` | `src/components/ui/*` | ✅ |
| 8 | Build auth screens (Login, Register, Role Select) | `feat` | `app/(auth)/*` | ✅ |
| 9 | Build root layout with auth guard + role-based navigator routing | `feat` | `app/_layout.tsx` | ✅ |
| 10 | Build Freelancer Tab + Drawer navigator skeleton | `feat` | `app/(freelancer)/_layout.tsx` | ✅ |
| 11 | Build Client Tab + Drawer navigator skeleton | `feat` | `app/(client)/_layout.tsx` | ✅ |
| 12 | Implement AsyncStorage helpers (role, lastContractId) | `feat` | `lib/storage.ts` | ✅ |
| 13 | Implement SQLite init + table creation | `feat` | `lib/sqlite.ts` | ✅ |
| 14 | Register Expo push token on app launch + store in Convex | `feat` | `hooks/usePushNotifications.ts`, `convex/users.ts` | ✅ |

**Definition of Done:**
- [x] App compiles and runs on Expo Go
- [x] Login and Register screens work with Convex Auth
- [x] Role selection persists to AsyncStorage
- [x] Freelancer sees freelancer tab layout; client sees client tab layout
- [x] All three navigation types (Stack, Tab, Drawer) are reachable
- [x] Push token is stored in Convex after permission granted

---

#### Sprint 2 — Core Features (Contracts + Tasks + Chat) ✅ COMPLETED
**Goal:** Full freelancer → contract → task → chat flow working end to end with real Convex data.  
**Deliverable:** Freelancer creates contract, client accepts/declines, freelancer adds tasks with timer, both parties chat in real time.

| # | Task | Type | Files Involved | Status |
|---|---|---|---|---|
| 1 | Implement `convex/users.ts` (me, updateProfile) | `feat` | `convex/users.ts`, `hooks/useCurrentUser.ts` | ✅ |
| 2 | Implement `convex/contracts.ts` (create, list, getById, accept, decline) | `feat` | `convex/contracts.ts` | ✅ |
| 3 | Build `useContracts` hook | `feat` | `hooks/useContracts.ts` | ✅ |
| 4 | Build Freelancer contract list screen + ContractCard component | `feat` | `app/(freelancer)/contracts/index.tsx`, `components/contracts/ContractCard.tsx` | ✅ |
| 5 | Build Create Contract form screen | `feat` | `app/(freelancer)/contracts/new.tsx`, `components/contracts/CreateContractForm.tsx` | ✅ |
| 6 | Build Contract Detail screen (freelancer view) | `feat` | `app/(freelancer)/contracts/[id]/index.tsx` | ✅ |
| 7 | Build Client dashboard + pending contract list | `feat` | `app/(client)/dashboard/index.tsx` | ✅ |
| 8 | Build Client contract detail + accept/decline UI | `feat` | `app/(client)/contracts/[id]/index.tsx` | ✅ |
| 9 | Implement `convex/tasks.ts` (create, list, updateStatus, startTimer, stopTimer, setHourlyRate, delete) | `feat` | `convex/tasks.ts` | ✅ |
| 10 | Build `useTasks` hook + completionPercent calculation | `feat` | `hooks/useTasks.ts` | ✅ |
| 11 | Build Task list screen with TimerControl + CompletionBar | `feat` | `app/(freelancer)/contracts/[id]/tasks.tsx`, `components/tasks/*` | ✅ |
| 12 | Implement `convex/messages.ts` (send, listByContract paginated) | `feat` | `convex/messages.ts` | ✅ |
| 13 | Build `useMessages` hook | `feat` | `hooks/useMessages.ts` | ✅ |
| 14 | Build Chat screen (freelancer + client, same component) | `feat` | `app/(freelancer)/chat/[contractId].tsx`, `app/(client)/chat/[contractId].tsx` | ✅ |
| 15 | Cache contracts + tasks + messages in SQLite after load | `feat` | `lib/sqlite.ts`, hooks | ✅ |
| 16 | Implement `convex/notifications.ts` (list, markRead, markAllRead) | `feat` | `convex/notifications.ts`, `hooks/useNotifications.ts` | ✅ |
| 17 | Build notification inbox screen (both roles) | `feat` | `app/(freelancer)/notifications/index.tsx`, `app/(client)/notifications/index.tsx` | ✅ |

**Definition of Done:**
- [x] Freelancer creates a contract and it appears in their list
- [x] Client sees the contract and can accept or decline
- [x] Accepted contract shows as active on both dashboards
- [x] Freelancer adds tasks, toggles status, starts/stops timer, sees timeSpent
- [x] Completion percentage updates in real time as tasks complete
- [x] Both parties send and receive messages in real time
- [x] Notifications appear in inbox for contract events
- [x] Contracts and tasks readable offline via SQLite

---

#### Sprint 3 — UI & Logic Fixes ✅ COMPLETED
**Goal:** Fix all identified UI and logic issues before final testing.  

| # | Task | Type | Files Involved | Status |
|---|---|---|---|---|
| 1 | Contract pricing logic: hide hourly rate on fixed contracts, global hourlyRate on hourly | `fix` | `CreateContractForm.tsx`, `schema.ts` | ✅ |
| 2 | Client name auto-fill from users table via clientEmail | `fix` | `contracts.ts` | ✅ |
| 3 | "Pay Now" flow: skip invoice, show pay button, release deliverable on payment | `fix` | `invoices.ts`, `contracts.ts` | ✅ |
| 4 | Multi-deliverable support: `deliverables` array with name + URL | `feat` | `schema.ts`, `DeliverableLinks.tsx` | ✅ |
| 5 | Chat UI: scroll to bottom, mark as read on view, unread badge | `fix` | `ChatList.tsx`, `ChatScreen.tsx` | ✅ |
| 6 | ContractCard: show correct name based on viewer role | `fix` | `ContractCard.tsx` | ✅ |
| 7 | Notification types: role-based filtering, 10 types total | `feat` | `notifications.ts`, preferences screen | ✅ |
| 8 | ChatReadStatus table for tracking last read per user/contract | `feat` | `schema.ts`, `messages.ts` | ✅ |
| 9 | notificationPreferences table for per-user settings | `feat` | `schema.ts`, preferences screen | ✅ |

**Note:** Navigation dropdown was partially addressed via drawer, full dropdown with contract list still in progress.

---

#### Sprint 4 — Payment & Earnings 🔄 IN PROGRESS
**Goal:** Payment simulation and escrow management, AI email generation, invoice automation.  
**Deliverable:** Full lifecycle demo-ready with payment flow and earnings tracking.

| # | Task | Type | Files Involved | Status |
|---|---|---|---|---|
| 1 | AI outreach email generation via Anthropic API | `feat` | `convex/ai.ts` | ✅ |
| 2 | Resend email triggers (accept, invoice, payment) | `feat` | `convex/email.ts` | ✅ |
| 3 | Expo push notification sends (all events) | `feat` | `convex/actions/push.ts` | ✅ |
| 4 | AI invoice generation | `feat` | `convex/invoices.ts`, `convex/ai.ts` | ✅ |
| 5 | Invoice draft editing (line items, totals) | `feat` | `InvoiceLineItems.tsx`, `InvoiceSummary.tsx` | ✅ |
| 6 | Invoice send with deliverables | `feat` | `app/(freelancer)/contracts/[id]/invoice.tsx` | ✅ |
| 7 | Payment simulation (Stripe / NabooPay) | `feat` | `PaymentSimulation.tsx` | ✅ |
| 8 | Deliverable link release on payment | `feat` | `convex/invoices.ts` | ✅ |
| 9 | Escrow status tracking (held/delivered/released/refunded) | `feat` | `schema.ts`, `contracts.ts` | ✅ |
| 10 | Freelancer earnings query + dashboard display | `feat` | `invoices.ts`, `useInvoice.ts`, dashboard | 📋 |
| 11 | Preferred payment method highlighting in PaymentSimulation | `feat` | `PaymentSimulation.tsx` | 📋 |
| 12 | Client contract view: "View Invoice" / "Pay Now" button | `feat` | `app/(client)/contracts/[id]/index.tsx` | 📋 |

**Definition of Done:**
- [x] Contract creation triggers AI-generated outreach email sent via Resend
- [x] Client accept triggers email to both parties
- [x] 100% completion triggers push notification to client
- [x] "Generate Invoice" appears at 100%; Anthropic returns valid invoice JSON
- [x] Invoice draft is editable (line items, totals)
- [x] Sending invoice triggers client push + email with invoice summary
- [x] Client can simulate payment (Stripe or NabooPay mock UI)
- [x] Payment triggers push + email to freelancer + deliverable link to client
- [ ] Freelancer earnings displayed on dashboard
- [ ] Preferred payment method highlighted in payment UI
- [ ] Client sees pay button when invoice is ready

---

#### Sprint 5 — Polish, Empty States, Demo Prep 📋
**Goal:** Every screen has a proper empty state, loading state, and error state. UI is polished and demo-ready.  
**Deliverable:** App ready for final project presentation with complete end-to-end demo flow working flawlessly.

| # | Task | Type | Files Involved | Status |
|---|---|---|---|---|
| 1 | Add empty states to all list screens (no contracts, no tasks, no messages) | `feat` | All list screens | 📋 |
| 2 | Add loading skeletons / activity indicators to all data-fetching screens | `feat` | All screens | 📋 |
| 3 | Add error boundaries + retry UI for failed Convex queries | `feat` | All screens | 📋 |
| 4 | Add unread notification badge to Tab navigator | `feat` | Navigator layouts | 📋 |
| 5 | Add deep link navigation from notification tap to correct contract screen | `feat` | `hooks/usePushNotifications.ts`, navigator | 📋 |
| 6 | End-to-end demo run (create contract → full cycle → deliverable received) | `chore` | — | 📋 |
| 7 | Bug fixes from demo run | `chore` | TBD | 📋 |

---

## Full Feature Checklist

| Feature | Status | Sprint |
|---|---|---|
| User registration + role selection | ✅ | Sprint 1 |
| Auth guard + role-based navigation | ✅ | Sprint 1 |
| Push token registration | ✅ | Sprint 1 |
| Design system + base components | ✅ | Sprint 1 |
| AsyncStorage (token, role, prefs) | ✅ | Sprint 1 |
| SQLite init + cache tables | ✅ | Sprint 1 |
| Contract creation form | ✅ | Sprint 2 |
| Contract accept / decline | ✅ | Sprint 2 |
| Task management (CRUD + status) | ✅ | Sprint 2 |
| Task timer (start/stop, timeSpent) | ✅ | Sprint 2 |
| Completion percentage | ✅ | Sprint 2 |
| Real-time chat | ✅ | Sprint 2 |
| Chat read status tracking | ✅ | Sprint 3 |
| Notification inbox | ✅ | Sprint 2 |
| Notification preferences (per-user settings) | ✅ | Sprint 3 |
| SQLite cache sync (contracts, tasks, messages) | ✅ | Sprint 2 |
| Escrow management (held/delivered/released/refunded) | ✅ | Sprint 4 |
| AI outreach email generation | ✅ | Sprint 4 |
| Resend email triggers (3 events) | ✅ | Sprint 4 |
| Expo push notification sends (all events) | ✅ | Sprint 4 |
| AI invoice generation | ✅ | Sprint 4 |
| Invoice draft editing | ✅ | Sprint 4 |
| Invoice send | ✅ | Sprint 4 |
| Multiple deliverables support | ✅ | Sprint 3 |
| Payment simulation | ✅ | Sprint 4 |
| Deliverable link release on payment | ✅ | Sprint 4 |
| Chat scroll to bottom + unread badge | ✅ | Sprint 3 |
| ContractCard shows correct name by role | ✅ | Sprint 3 |
| Legal screen (terms of service) | ✅ | Sprint 3 |
| Profile screen (both roles) | ✅ | Sprint 2 |
| Freelancer earnings dashboard | 🔄 | Sprint 4 |
| Preferred payment method highlighting | 🔄 | Sprint 4 |
| Client pay button on contract view | 🔄 | Sprint 4 |
| Empty states + loading states | 📋 | Sprint 5 |
| Deep link from notification | 📋 | Sprint 5 |
| Demo-ready end-to-end flow | 📋 | Sprint 5 |
