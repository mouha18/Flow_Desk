# Sprint 3.1 — UI & Logic Fixes

**Goal:** Fix all identified UI and logic issues before final testing.

---

## Issues Summary

### 1. Contract Pricing Logic

**Current Problem:**
- Freelancer can set fixed price but still add hourly rate to tasks
- Hourly rate can be set per-task (should be global)
- "Pay now" can be selected with hourly rate (incompatible)

**Fix:**
- If `pricingType === "fixed"`:
  - Hide hourly rate field when creating tasks
  - Use `fixedPrice` for all calculations
- If `pricingType === "hourly"`:
  - Add `hourlyRate` to contract (global), not per-task
  - Remove hourly rate from task creation UI
  - `paymentTiming` must be "later" (can't pay now for hourly)
- If `paymentTiming === "now"`:
  - Must be `pricingType === "fixed"`
  - Skip invoice generation at 100%
  - Send report + deliverable instead

---

### 2. Client Name Auto-Fill

**Current Problem:**
- Freelancer manually enters client name/pseudo
- Redundant when email is the identifier

**Fix:**
- Remove `clientName` and `clientPseudo` from contract creation form
- Auto-fill client name from `users` table using `clientEmail`
- `users` table has `name` field from registration

---

### 3. "Pay Now" Flow

**Current Problem:**
- "Pay now" still triggers invoice generation
- No clear path to just send deliverable

**Fix:**
- If `paymentTiming === "now"`:
  - Skip invoice generation entirely
  - At 100% completion, freelancer adds deliverable links
  - Client sees "Pay Now" button on contract
  - On payment: status → completed, deliverable released
  - Email sent: deliverable link to client

---

### 4. Multi-Deliverable Links

**Current Problem:**
- Only one deliverable link field
- No name/description for the link

**Fix:**
- Add `deliverables` array to contract schema:
  ```typescript
  deliverables: v.array(v.object({
    name: v.string(),
    url: v.string(),
  }))
  ```
- UI: Add/remove deliverable items
- Each item has: name (e.g., "GitHub Repository") + URL

---

### 5. Navigation Dropdown

**Current Problem:**
- No dropdown for contracts
- Can't easily navigate between contracts

**Fix:**
- Menu structure:
  - Dashboard
  - Contracts (dropdown with recent 5)
    - All Contracts
    - [Contract 1]
    - [Contract 2]
    - ...
  - Tasks (all tasks organized by contract)
  - Chat (dropdown of active contract chats)
  - Invoices (freelancer only)
  - Notifications
  - Profile

---

### 6. Chat UI Bug

**Current Problem:**
- Last message shows at top instead of bottom
- No unread message badge/count

**Fix:**
- Chat should scroll to bottom on new message
- Add unread count badge on chat button/menu
- Store `lastReadAt` per user per contract
- Unread = messages after `lastReadAt`

---

### 7. Client Contract Display

**Current Problem:**
- ContractCard shows client name (redundant for client)
- Should show freelancer name

**Fix:**
- If viewing as client: show `freelancerName`
- If viewing as freelancer: show `clientName`

---

### 8. Notification Types

**Current Problem:**
- All notification types sent to both roles
- No unread count indicator

**Fix:**

| Event | Client | Freelancer |
|-------|--------|------------|
| New message | ✅ | ✅ |
| Contract proposal received | ✅ | - |
| Contract accepted | - | ✅ |
| Contract rejected | - | ✅ |
| Tasks at 100% | ✅ | - |
| Invoice sent | ✅ | - |
| Invoice paid | - | ✅ |
| Deliverable sent | ✅ | - |

---

## File Changes

### Schema Changes (`convex/schema.ts`)

```typescript
contracts: defineTable({
  // ... existing fields ...
  // REMOVE: clientName, clientPseudo
  deliverables: v.array(v.object({
    name: v.string(),
    url: v.string(),
  })),
  // Add global hourlyRate if hourly pricing
  hourlyRate: v.optional(v.number()),
})
```

### UI Changes

| File | Change |
|------|--------|
| `CreateContractForm.tsx` | Remove clientName/clientPseudo, conditional payNow |
| `ContractCard.tsx` | Show correct name based on viewer role |
| `freelancer/_layout.tsx` | Dropdown navigation with contracts |
| `client/_layout.tsx` | Dropdown navigation |
| `ChatList.tsx` | Scroll to bottom, unread badge |
| `ChatScreen.tsx` | Mark as read on view |
| `TaskItem.tsx` | Remove hourly rate if fixed price contract |
| `InvoiceScreen.tsx` | Skip invoice if payNow |
| `Notifications.tsx` | Filter by role, show unread count |

### Logic Changes

| File | Change |
|------|--------|
| `contracts:create` | Auto-fill clientName from email |
| `contracts:accept` | Send correct notifications |
| `tasks:stopTimer` | Push to client on 100% |
| `invoices:generate` | Skip if payNow, handle deliverables |
| `invoices:send` | Skip if payNow |
| `simulatePayment` | Release deliverables, send email |

---

## Deliverables Checklist

- [ ] Schema updated with `deliverables` array
- [ ] Contract creation: no client name input, auto-fill from email
- [ ] Task creation: hourly rate hidden if fixed price
- [ ] Pay now → skips invoice, shows pay button to client
- [ ] Deliverables UI: add/remove links with name + URL
- [ ] Navigation: dropdown with contract list
- [ ] Chat: scroll to bottom, unread badge
- [ ] Notifications: role-based filtering
- [ ] ContractCard: shows freelancer name for client view
