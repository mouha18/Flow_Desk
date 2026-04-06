# Flowdesk — Database Schema

**Database:** Convex (document store, TypeScript schema)  
**Naming convention:** camelCase fields, plural table names  
**Last Updated:** 2026-04-05  

> Convex uses a document model. The schema below is defined in `convex/schema.ts` using `defineSchema` and `defineTable`. All documents automatically get `_id` (Convex ID) and `_creationTime` (epoch ms).

---

## Tables

### `users`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"users">` | Auto | Convex document ID |
| `name` | `string` | Required | Full display name |
| `email` | `string` | Required, unique | Login email |
| `pseudo` | `string` | Required | Username / handle |
| `role` | `"freelancer" \| "client"` | Required | User role |
| `pushToken` | `string \| null` | Optional | Expo push token for notifications |
| `_creationTime` | `number` | Auto | Epoch ms |

---

### `contracts`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"contracts">` | Auto | Convex document ID |
| `freelancerId` | `Id<"users">` | Required | Owner freelancer |
| `clientId` | `Id<"users"> \| null` | Optional | Set after client registers |
| `clientEmail` | `string` | Required | Used for email before client has account |
| `clientName` | `string` | Required | Display name |
| `clientPseudo` | `string` | Required | Client handle |
| `title` | `string` | Required | Project title |
| `status` | `"pending" \| "active" \| "completed" \| "declined"` | Required | Contract lifecycle status |
| `pricingType` | `"fixed" \| "hourly"` | Required | Determines invoice logic |
| `fixedPrice` | `number \| null` | Conditional | Required if pricingType === "fixed" |
| `paymentTiming` | `"now" \| "later"` | Required | Client payment expectation |
| `paymentMethod` | `"stripe" \| "naboo_orange" \| "naboo_wave"` | Required | Payment method selection |
| `aiEmailTone` | `"formal" \| "friendly" \| "casual"` | Required | Tone for AI-generated email |
| `completionPercent` | `number` | Required, default 0 | Derived from tasks |
| `deliverableLink` | `string \| null` | Optional | Set by freelancer before invoice send |
| `_creationTime` | `number` | Auto | Epoch ms |

---

### `tasks`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"tasks">` | Auto | Convex document ID |
| `contractId` | `Id<"contracts">` | Required | Parent contract |
| `title` | `string` | Required | Task name |
| `status` | `"pending" \| "running" \| "completed"` | Required, default "pending" | Task progress |
| `hourlyRate` | `number \| null` | Optional | Per-task rate, null on fixed contracts |
| `startedAt` | `number \| null` | Optional | Epoch ms when timer started |
| `completedAt` | `number \| null` | Optional | Epoch ms when timer stopped |
| `timeSpent` | `number \| null` | Optional | Calculated in minutes |
| `_creationTime` | `number` | Auto | Epoch ms |

---

### `messages`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"messages">` | Auto | Convex document ID |
| `contractId` | `Id<"contracts">` | Required | Which contract chat this belongs to |
| `senderId` | `Id<"users">` | Required | Message author |
| `content` | `string` | Required | Message text |
| `_creationTime` | `number` | Auto | Used as message timestamp |

---

### `invoices`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"invoices">` | Auto | Convex document ID |
| `contractId` | `Id<"contracts">` | Required, unique | One invoice per contract |
| `lineItems` | `Array<LineItem>` | Required | Array of billing items |
| `subtotal` | `number` | Required | Sum before tax |
| `tax` | `number` | Required | Tax amount (default 18% of subtotal) |
| `total` | `number` | Required | subtotal + tax |
| `aiGenerated` | `boolean` | Required | Whether AI created the draft |
| `notes` | `string \| null` | Optional | AI note on pricing assumptions |
| `status` | `"draft" \| "sent" \| "paid"` | Required, default "draft" | Invoice lifecycle |
| `paymentSimulated` | `boolean` | Required, default false | Whether demo payment was triggered |
| `_creationTime` | `number` | Auto | Epoch ms |

**LineItem sub-type:**
```typescript
{
  description: string;
  hours: number | null;
  rate: number | null;
  amount: number;
}
```

---

### `notifications`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"notifications">` | Auto | Convex document ID |
| `userId` | `Id<"users">` | Required | Recipient |
| `type` | `NotificationType` | Required | Event type (see below) |
| `contractId` | `Id<"contracts"> \| null` | Optional | For deep link navigation |
| `message` | `string` | Required | Human-readable notification text |
| `read` | `boolean` | Required, default false | Read state |
| `_creationTime` | `number` | Auto | Used as notification timestamp |

**NotificationType values:**
```typescript
type NotificationType =
  | "contract_invite"
  | "contract_accepted"
  | "contract_declined"
  | "task_complete"
  | "invoice_received"
  | "payment_received"
  | "new_message"
```

---

## Indexes

```typescript
// In convex/schema.ts — defined with .index()

// contracts: query by freelancer or client
contracts.index("by_freelancer", ["freelancerId"])
contracts.index("by_client", ["clientId"])
contracts.index("by_status", ["status"])

// tasks: query by contract
tasks.index("by_contract", ["contractId"])
tasks.index("by_contract_status", ["contractId", "status"])

// messages: query by contract, ordered by creation time
messages.index("by_contract", ["contractId"])

// invoices: one per contract
invoices.index("by_contract", ["contractId"])

// notifications: query by user, ordered by creation time
notifications.index("by_user", ["userId"])
notifications.index("by_user_unread", ["userId", "read"])
```

---

## Relationships

- `contracts.freelancerId` → `users._id` (many-to-one: a freelancer has many contracts)
- `contracts.clientId` → `users._id` (many-to-one: a client has many contracts)
- `tasks.contractId` → `contracts._id` (many-to-one: a contract has many tasks)
- `messages.contractId` → `contracts._id` (many-to-one: a contract has many messages)
- `messages.senderId` → `users._id` (many-to-one: a user sends many messages)
- `invoices.contractId` → `contracts._id` (one-to-one: each contract has one invoice)
- `notifications.userId` → `users._id` (many-to-one: a user has many notifications)
- `notifications.contractId` → `contracts._id` (optional reference for deep links)

---

## Access Control

Convex does not have SQL RLS. Access control is enforced in every query/mutation via session checking:

```typescript
// Pattern used in every Convex function:
const user = await getUser(ctx);                          // throws if unauthenticated
if (contract.freelancerId !== user._id) throw new ConvexError("UNAUTHORIZED");

// Role check pattern:
if (user.role !== "freelancer") throw new ConvexError("UNAUTHORIZED");
```

---

## Migrations

```text
convex/migrations/
├── 001_initial_schema.ts          # users, contracts, tasks, messages, invoices, notifications
├── 002_add_push_token.ts          # add pushToken to users
├── 003_add_deliverable_link.ts    # add deliverableLink to contracts
└── 004_add_invoice_notes.ts       # add notes field to invoices
```
