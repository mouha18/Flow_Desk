# Flowdesk — Product Requirements Document

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-04-05  
**Author:** Mouhamed Diallo  

---

## 1. Problem Statement

Freelancers in Senegal and across Africa manage their client work across a fragmented set of tools: WhatsApp for communication, Google Sheets for invoicing, Notion or paper for task tracking, and Wave/Orange Money for payments — with no connection between any of them. This friction costs time, creates errors, and makes freelancers look unprofessional to clients.

Clients on the other side have zero visibility into project progress and receive invoices with no context, no history, and no clean way to pay.

Existing solutions like HoneyBook, Bonsai, or Dubsado are web-only, USD-priced, English-first, and built for Western markets with Stripe as the only payment option. They solve none of the local context problems.

---

## 2. Product Vision

In 12 months, Flowdesk is the default workspace for freelance developers, designers, and consultants across francophone Africa — a single mobile app where every project starts with a contract, progresses through tracked tasks, and closes with an AI-generated invoice paid through local mobile money. Both freelancer and client have a real-time view of the work, with zero friction between them.

---

## 3. Target Users

### Freelancer
**Who:** Solo developer, designer, or digital consultant aged 18–35, smartphone-first, uses Wave or Orange Money daily.  
**Goal:** Manage all active client work from their phone without juggling multiple apps.  
**Pain point:** Loses money on unbilled hours, looks unprofessional with ad-hoc invoices, wastes time chasing clients for updates.

### Client
**Who:** Small business owner, startup founder, or individual commissioning digital work.  
**Goal:** Know the status of their project, communicate easily with their freelancer, and pay conveniently.  
**Pain point:** No visibility into progress, unclear what they're paying for, uncomfortable with Stripe.

---

## 4. User Stories

### P0 — Must have for v1

- As a freelancer, I want to create a contract for a new client so that the work has a formal starting point.
- As a freelancer, I want to choose fixed price or hourly so that the invoice is calculated correctly.
- As a freelancer, I want the app to generate an outreach email using AI so that I don't have to write it myself.
- As a client, I want to receive a notification when a freelancer wants to work with me so that I can accept or decline.
- As a client, I want to accept or decline a contract so that only confirmed work begins.
- As a freelancer, I want to add tasks to a contract and track their status so that I know what's done.
- As a freelancer, I want to start and stop a timer on each task so that hours are tracked automatically.
- As a freelancer, I want to add an hourly rate per task (on hourly contracts) so that each task is billed correctly.
- As a freelancer, I want to see a completion percentage so that I know when the project is done.
- As a client, I want to be notified when my project hits 100% so that I know it's ready.
- As a freelancer, I want to generate an AI invoice draft when the project is complete so that I don't have to calculate manually.
- As a freelancer, I want to edit the AI invoice draft before sending so that I have final control.
- As a client, I want to receive the invoice with a payment link so that I can pay easily.
- As a client, I want to simulate a payment so that the freelancer is notified and I receive the deliverable link.
- As both users, I want a real-time chat per contract so that communication is in context.
- As both users, I want push notifications for key events so that I never miss important updates.

### P1 — Should have for v1

- As a freelancer, I want to set payment timing (now / later) on the contract so that client expectations are clear.
- As a freelancer, I want to choose the AI email tone (formal / friendly / casual) so that it matches my brand.
- As a freelancer, I want to paste a deliverable link that is released automatically on payment so that delivery is seamless.
- As both users, I want a notification inbox in the app so that I can review past alerts.
- As a freelancer, I want to see my contracts organized by status (pending / active / completed / declined) so that I have a clear pipeline view.

### P2 — Nice to have for v1

- As a freelancer, I want to see a revenue dashboard so that I know how much I've earned.
- As both users, I want offline access to contract and task data so that the app works without internet.
- As a client, I want to choose which mobile money provider to pay with so that I use what I have.

---

## 5. Feature Specifications

### 5.1 Contract Creation
**Priority:** P0  
**Description:** Freelancer fills a form with client name, email, pseudo, project title, pricing type (fixed or hourly), fixed price (if applicable), payment timing, payment method, and AI email tone. On submit, Convex creates the contract record in `pending` status and triggers an Anthropic API call to generate the outreach email copy, which is sent via Resend. A push notification is sent to the client if they have an account.

**Acceptance Criteria:**
- [ ] Form validates all required fields before submit
- [ ] Pricing type selection shows/hides fixed price field
- [ ] AI email is generated using selected tone and project info
- [ ] Contract is created with status `pending`
- [ ] Client receives push notification (if registered) and email

### 5.2 Contract Accept / Decline
**Priority:** P0  
**Description:** Client sees pending contracts on their dashboard. They can accept or decline. On accept: contract status changes to `active`, freelancer receives push notification and email. On decline: contract status changes to `declined`, freelancer receives push notification only.

**Acceptance Criteria:**
- [ ] Client dashboard shows all pending contracts
- [ ] Accept changes status to `active`
- [ ] Decline changes status to `declined`
- [ ] Freelancer receives push notification on both outcomes
- [ ] Freelancer receives email on accept only

### 5.3 Task Management
**Priority:** P0  
**Description:** On an active contract, the freelancer can add tasks, set status (pending / running / completed), start/stop a timer that auto-calculates time spent, and optionally set an hourly rate per task. Hourly rate is hidden if the contract is fixed price. Completion percentage is calculated as (completed tasks / total tasks) × 100.

**Acceptance Criteria:**
- [ ] Tasks can be created, edited, and deleted
- [ ] Timer records startedAt and completedAt, calculates timeSpent
- [ ] Hourly rate field only visible on hourly contracts
- [ ] Completion percentage updates in real time
- [ ] Client receives push notification when percentage hits 100%

### 5.4 AI Invoice Generation
**Priority:** P0  
**Description:** When completion hits 100%, the freelancer sees a "Generate Invoice" button. The app sends contract data, task list, time spent, hourly rates (or fixed price), and client info to the Anthropic API. Claude returns a structured JSON with line items, descriptions, subtotal, tax, and total. If hourly rates are missing, Claude suggests a fair price with a note. The freelancer can edit all fields before sending.

**Acceptance Criteria:**
- [ ] Button appears only at 100% completion
- [ ] AI returns valid structured invoice JSON
- [ ] If no hourly rate: AI adds a pricing suggestion note
- [ ] Freelancer can edit all line items, tax, total
- [ ] Invoice is saved as `draft` until manually sent

### 5.5 Invoice Send + Payment Simulation
**Priority:** P0  
**Description:** Freelancer taps "Send Invoice." Invoice status changes to `sent`. Client receives push notification and email with invoice details and a payment simulation button. Client taps "Pay" → status changes to `paid`, freelancer receives push notification and email, and deliverable link is released to the client via notification and email.

**Acceptance Criteria:**
- [ ] Invoice send changes status to `sent`
- [ ] Client push notification and email triggered
- [ ] Payment simulation button visible to client on invoice screen
- [ ] On simulate: status changes to `paid`
- [ ] Freelancer receives push notification and email
- [ ] Deliverable link sent to client via notification and email

### 5.6 Real-time Chat
**Priority:** P0  
**Description:** Each active contract has a dedicated chat room. Messages are stored in Convex and synced in real time. Both parties receive a push notification on new message when not in the chat screen.

**Acceptance Criteria:**
- [ ] Messages appear in real time without refresh
- [ ] Push notification fires when recipient is not in chat
- [ ] Chat history persists and is paginated
- [ ] Messages are cached in SQLite for offline read

### 5.7 Push & Remote Notifications
**Priority:** P0  
**Description:** Expo push tokens are stored per user in Convex. Convex server actions trigger push sends via Expo Push API at all notification events. Notifications are also stored in the `notifications` table for in-app inbox.

**Acceptance Criteria:**
- [ ] Push token stored on app launch after permission granted
- [ ] All P0 notification events trigger a push
- [ ] In-app notification inbox shows unread count
- [ ] Tapping a notification deep links to the relevant contract

### 5.8 Local Persistence
**Priority:** P1  
**Description:** SQLite caches contracts, tasks, and messages for offline read. AsyncStorage stores auth token, user role, and last-viewed contract ID.

**Acceptance Criteria:**
- [ ] Contracts and tasks readable offline
- [ ] Chat messages cached locally
- [ ] Auth token persists across app restarts
- [ ] Cache syncs with Convex on reconnect

---

## 6. Out of Scope (v1)

- Real payment processing (Stripe or NabooPay live integration)
- File upload for deliverables (link only)
- Multi-freelancer teams or agencies
- Web dashboard
- Invoice PDF export
- Recurring contracts
- Reviews or ratings

---

## 7. Success Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Contract-to-invoice completion rate | > 70% | Convex: contracts with status `paid` / `active` |
| AI invoice acceptance rate (no edit) | > 40% | Invoice: aiGenerated true + no edits before send |
| Push notification open rate | > 50% | Expo push delivery + app open tracking |
| Chat messages per contract | > 5 | messages table count per contractId |
| Demo grade | A / distinction | Professor evaluation |

---

## 8. Timeline & Milestones

| Milestone | Target Date | Deliverable |
|---|---|---|
| Foundation | Week 1 | Navigation + Auth + Convex schema live |
| Core Features | Week 2 | Contracts + Tasks + Chat working end to end |
| AI + Invoice | Week 3 | AI invoice generation + payment simulation |
| Polish + Demo | Week 4 | Notifications + SQLite + UI polish + demo ready |

---

## 9. Open Questions

- [ ] Should the client be able to initiate a contract themselves (invite a freelancer), or is that V2?
- [ ] What tax rate should the AI invoice assume by default? <!-- assumed: 18% VAT, can be edited -->
- [ ] Should declined contracts be permanently hidden or archivable?
- [ ] What happens if the client is not yet registered when the freelancer creates the contract — do they get a sign-up link in the email?
