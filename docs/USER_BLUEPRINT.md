# Flowdesk — User Blueprint

**Version:** 1.0  
**Last Updated:** 2026-04-05  
**Purpose:** Complete journey map for each user type — every screen, action, and transition from first open to repeat usage.

---

## User Types

| User Type | Description | Entry Point |
|---|---|---|
| Freelancer | Solo developer/designer/consultant managing client work | Registers, selects Freelancer role |
| Client | Business owner or individual commissioning digital work | Receives email invite OR downloads app and registers |

---

## Freelancer Journey

### Phase 1 — Discovery & Onboarding
**Goal:** Freelancer has a registered account, has seen their empty dashboard, and is ready to create their first contract.

| Step | Screen | What user does | What happens next | Notes |
|---|---|---|---|---|
| 1 | Splash / Login | Opens app for first time | Sees Login screen | |
| 2 | Register | Fills name, email, pseudo, password | Navigates to Role Select | |
| 3 | Role Select | Taps "I'm a Freelancer" | AsyncStorage saves role. Navigates to Freelancer Dashboard | |
| 4 | Dashboard (empty) | Sees empty state: "No contracts yet. Start one." | Taps "New Contract" CTA | Empty state has clear CTA |
| 5 | Create Contract | Fills client info, pricing type, payment method, AI email tone | Taps Submit | |
| 6 | Submit | Contract created in Convex | AI email generated + sent to client via Resend. Push sent to client if registered. | Freelancer lands back on Dashboard |
| 7 | Dashboard | Sees new contract card with status "Pending" | Waits for client response | |

---

### Phase 2 — Core Usage
**Goal:** Freelancer completes a full work cycle: contract accepted → tasks → 100% → invoice sent.

| Step | Screen | What user does | What happens next | Notes |
|---|---|---|---|---|
| 1 | Notification | Receives push: "Client accepted your contract" | Taps → deep links to Contract Detail | |
| 2 | Contract Detail | Sees contract now Active. Taps "Add Task" | Task creation modal opens | |
| 3 | Tasks | Adds tasks with titles + optional hourly rates | Tasks appear in list with status "Pending" | Hourly rate hidden on fixed contracts |
| 4 | Tasks | Taps "Start" on a task | Timer starts. Task status → "Running" | |
| 5 | Tasks | Taps "Stop" on running task | timeSpent calculated. Completion % updates | |
| 6 | Tasks | Marks all tasks "Completed" | Completion hits 100%. Client push notification sent | |
| 7 | Contract Detail | Sees "Generate Invoice" button appear | Taps it | Only visible at 100% |
| 8 | Invoice Draft | AI generates invoice draft with line items | Freelancer reviews + edits if needed | AI notes pricing assumptions if hourly rates missing |
| 9 | Invoice Draft | Pastes deliverable link. Taps "Send Invoice" | Invoice status → "Sent". Client receives push + email | |
| 10 | Dashboard | Sees invoice status badge on contract card | Waits for payment | |
| 11 | Notification | Receives push: "Payment received" | Contract status → "Completed" | |
| 12 | Chat | Uses chat throughout the project for questions | Messages sync in real time | Available on any active contract |

---

### Phase 3 — Retention & Return
**Goal:** Freelancer returns to the app for their next client without re-learning anything.

| Step | Screen | What user does | What happens next | Notes |
|---|---|---|---|---|
| 1 | Dashboard | Returns, sees completed contracts archived, starts new one | Same flow as Phase 1 | Completion history builds context |
| 2 | Notifications | Reviews past alerts | All historical notifications in inbox | |
| 3 | Profile | Updates pseudo or name | Saved to Convex | |

---

## Client Journey

### Phase 1 — Discovery & Onboarding
**Goal:** Client receives email, registers (if new), and lands on their dashboard with a pending contract visible.

| Step | Screen | What user does | What happens next | Notes |
|---|---|---|---|---|
| 1 | Email inbox | Receives AI-generated outreach email from Flowdesk (Resend) | Opens email | Tone matches freelancer's selection |
| 2 | App Store / Expo Go | Downloads app (or already has it) | Opens app | <!-- assumed: app is distributed via Expo Go for demo --> |
| 3 | Register | Fills name, email (same as in contract), pseudo, password | Role Select | Email match links them to pending contract |
| 4 | Role Select | Taps "I'm a Client" | AsyncStorage saves role. Navigates to Client Dashboard | |
| 5 | Dashboard | Sees pending contract card: "[Freelancer] wants to work with you" | Taps to view details | |

---

### Phase 2 — Core Usage
**Goal:** Client accepts contract, monitors progress, chats, receives and pays invoice, gets deliverable.

| Step | Screen | What user does | What happens next | Notes |
|---|---|---|---|---|
| 1 | Contract Detail | Reviews contract details (pricing, title, freelancer) | Taps "Accept" or "Decline" | |
| 2 | Accept | Taps Accept | Contract → Active. Freelancer notified (push + email). Client receives thank-you email | |
| 3 | Dashboard | Sees contract as Active with completion bar | Monitors progress | Completion bar updates in real time |
| 4 | Notification | Receives push: "Your project is 100% complete" | Taps → Contract Detail | |
| 5 | Notification | Receives push: "You have a new invoice" | Taps → Invoice View | |
| 6 | Invoice View | Reviews line items, total, payment method | Taps "Pay" | Payment method shows Stripe or NabooPay mock UI |
| 7 | Payment Simulation | Sees simulated payment screen (mock Stripe / NabooPay UI) | Confirms | Invoice → Paid. Freelancer notified. |
| 8 | Notification | Receives push with deliverable link | Taps → opens link externally | Link is whatever the freelancer set (website, Drive, etc.) |
| 9 | Chat | Sends questions / feedback throughout the project | Freelancer replies in real time | Available while contract is active |

---

### Phase 3 — Retention & Return
**Goal:** Client recognizes Flowdesk as the way to commission digital work and comes back for new projects.

| Step | Screen | What user does | What happens next | Notes |
|---|---|---|---|---|
| 1 | Dashboard | Returns, sees completed work history | Browses past contracts | |
| 2 | Profile | Updates info | Saved to Convex | |

---

## Page Index

| Page | Route | Purpose | Used in Journey |
|---|---|---|---|
| Login | `/(auth)/login` | Returning user auth | Both |
| Register | `/(auth)/register` | New user signup | Both |
| Role Select | `/(auth)/role-select` | Set user role | Both |
| Freelancer Dashboard | `/(freelancer)/dashboard` | Contract pipeline overview | Freelancer |
| Freelancer Contract List | `/(freelancer)/contracts` | All contracts by status | Freelancer |
| Create Contract | `/(freelancer)/contracts/new` | New contract form | Freelancer |
| Freelancer Contract Detail | `/(freelancer)/contracts/[id]` | Contract info + deliverable link | Freelancer |
| Task List | `/(freelancer)/contracts/[id]/tasks` | Tasks + timer | Freelancer |
| Invoice Draft | `/(freelancer)/contracts/[id]/invoice` | AI draft + edit + send | Freelancer |
| Client Dashboard | `/(client)/dashboard` | Pending + active contracts | Client |
| Client Contract Detail | `/(client)/contracts/[id]` | Accept / Decline + progress view | Client |
| Invoice View | `/(client)/contracts/[id]/invoice` | View invoice + pay | Client |
| Freelancer Chat List | `/(freelancer)/chat` | All contract chats | Freelancer |
| Chat Room | `/(freelancer or client)/chat/[contractId]` | Real-time messaging | Both |
| Notifications | `/(freelancer or client)/notifications` | Notification inbox | Both |
| Profile | `/(freelancer or client)/profile` | Edit profile + logout | Both |

---

## Edge Cases & Alternate Flows

| Scenario | Trigger | Where user lands | How it's handled |
|---|---|---|---|
| Client email not registered at contract creation | Freelancer creates contract with unregistered email | Client gets email with app download link | Contract stays pending until client registers with matching email |
| Client declines contract | Client taps Decline | Contract → Declined | Freelancer receives push notification. Contract archived on both dashboards |
| Freelancer tries to generate invoice before 100% | Taps invoice early | Button not visible | "Generate Invoice" button only appears at completionPercent === 100 |
| AI invoice generation fails | Anthropic API error | Invoice Draft screen shows error | Retry button shown. Freelancer can try again or create invoice manually |
| Payment simulated with no deliverable link | Client pays before freelancer set link | Payment processed, no link sent | Notification sent to freelancer: "Set a deliverable link for this contract" |
| App opened offline | No internet connection | Last SQLite cache shown | Contracts, tasks, and messages readable. Write actions queued or show error |
| Push permission denied | User declines on first launch | No push token stored | In-app notifications still work. Push sends silently fail (no crash) |
| Client has multiple pending contracts | Multiple freelancers send invites | Client dashboard shows all pending cards | Each handled independently |

---

## Notifications & Async Events

| Event | Trigger | Channel | Deep Link Destination |
|---|---|---|---|
| Contract invite sent | `contracts:create` | Push (to client, if registered) | `/(client)/contracts/[id]` |
| Contract accepted | `contracts:accept` | Push (to freelancer) + Email (to both) | `/(freelancer)/contracts/[id]` |
| Contract declined | `contracts:decline` | Push (to freelancer) | `/(freelancer)/contracts/[id]` |
| New message | `messages:send` | Push (to recipient, if not in chat) | Chat room for contract |
| Project 100% complete | `tasks:stopTimer` (when reaches 100%) | Push (to client) | `/(client)/contracts/[id]` |
| Invoice received | `invoices:send` | Push (to client) + Email (to client) | `/(client)/contracts/[id]/invoice` |
| Payment confirmed | `invoices:simulatePayment` | Push (to freelancer + client) + Email (to freelancer + client) | `/(freelancer)/contracts/[id]/invoice` |
