# FlowDesk — Database Schema

**Database:** Convex (document store, TypeScript schema)  
**Naming convention:** camelCase fields, plural table names  
**Last Updated:** 2026-04-12  

> Convex uses a document model. The schema below is defined in `convex/schema.ts` using `defineSchema` and `defineTable`. All documents automatically get `_id` (Convex ID) and `_creationTime` (epoch ms).

---

## Tables

### `users` (from Convex Auth)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"users">` | Auto | Convex document ID |
| `email` | `string` | Required, unique | Login email |
| `name` | `string` | Optional | Display name |
| `_creationTime` | `number` | Auto | Epoch ms |

> **Note:** The `users` table is provided by `@convex-dev/auth/server` via `authTables`. Do NOT add fields directly to it. Use related tables for additional user data.

---

### `userRoles`

Stores the user's role (freelancer or client). One role per user via upsert pattern.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"userRoles">` | Auto | Convex document ID |
| `userId` | `Id<"users">` | Required | User reference |
| `role` | `"freelancer" \| "client"` | Required | User role |
| `createdAt` | `number` | Required | Epoch ms |
| **Indexes** | `by_user` on `["userId"]` | | |

---

### `userPushTokens`

Stores Expo push notification tokens per user.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"userPushTokens">` | Auto | Convex document ID |
| `userId` | `Id<"users">` | Required | User reference |
| `token` | `string` | Required | Expo push token |
| `platform` | `"android" \| "ios" \| "web" \| null` | Optional | Device platform |
| `createdAt` | `number` | Required | Epoch ms |
| **Indexes** | `by_user` on `["userId"]`, `by_token` on `["token"]` | | |

---

### `userEmails`

Enables O(1) email lookups instead of full table scan.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"userEmails">` | Auto | Convex document ID |
| `userId` | `Id<"users">` | Required | User reference |
| `email` | `string` | Required | Email address |
| **Indexes** | `by_email` on `["email"]`, `by_user` on `["userId"]` | | |

---

### `chatReadStatus`

Tracks last read timestamp per user per contract for unread message indicators.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"chatReadStatus">` | Auto | Convex document ID |
| `userId` | `Id<"users">` | Required | User reference |
| `contractId` | `Id<"contracts">` | Required | Contract reference |
| `lastReadAt` | `number` | Required | Epoch ms |
| **Indexes** | `by_user_contract` on `["userId", "contractId"]` | | |

---

### `notificationPreferences`

Per-user settings for which notification types to receive.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"notificationPreferences">` | Auto | Convex document ID |
| `userId` | `Id<"users">` | Required | User reference |
| `key` | `string` | Required | Notification type key (e.g., "contract_invite") |
| `enabled` | `boolean` | Required | Whether notifications are enabled |
| **Indexes** | `by_user` on `["userId"]`, `by_user_key` on `["userId", "key"]` | | |

---

### `contracts`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"contracts">` | Auto | Convex document ID |
| `freelancerId` | `Id<"users">` | Required | Owner freelancer |
| `clientId` | `Id<"users"> \| null` | Optional | Set after client registers |
| `clientEmail` | `string` | Required | Used for email before client has account |
| `clientName` | `string \| null` | Optional | Display name |
| `clientPseudo` | `string \| null` | Optional | Client handle |
| `title` | `string` | Required | Project title |
| `status` | `"pending" \| "active" \| "completed" \| "declined" \| "finished" \| "disputed"` | Required | Contract lifecycle status |
| `escrowStatus` | `"held" \| "delivered" \| "released" \| "refunded" \| null` | Optional | Escrow payment status |
| `escrowPaidAt` | `number \| null` | Optional | Epoch ms when escrow was paid |
| `escrowReleasedAt` | `number \| null` | Optional | Epoch ms when escrow was released |
| `pricingType` | `"fixed" \| "hourly"` | Required | Determines invoice logic |
| `fixedPrice` | `number \| null` | Conditional | Required if pricingType === "fixed" |
| `hourlyRate` | `number \| null` | Optional | Required if pricingType === "hourly" |
| `paymentTiming` | `"now" \| "later"` | Required | Client payment expectation |
| `paymentMethod` | `"stripe" \| "naboo_orange" \| "naboo_wave"` | Required | Payment method selection |
| `aiEmailTone` | `"formal" \| "friendly" \| "casual"` | Required | Tone for AI-generated email |
| `completionPercent` | `number` | Required | Derived from tasks (0-100) |
| `deliverableLink` | `string \| null` | Optional | Single deliverable link |
| `deliverables` | `Array<{name: string, url: string}> \| null` | Optional | Multiple deliverables |
| **Indexes** | `by_freelancer` on `["freelancerId"]`, `by_client` on `["clientId"]`, `by_status` on `["status"]`, `by_clientEmail` on `["clientEmail"]` | | |

---

### `tasks`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"tasks">` | Auto | Convex document ID |
| `contractId` | `Id<"contracts">` | Required | Parent contract |
| `title` | `string` | Required | Task name |
| `status` | `"pending" \| "running" \| "completed"` | Required | Task progress |
| `startedAt` | `number \| null` | Optional | Epoch ms when timer started |
| `completedAt` | `number \| null` | Optional | Epoch ms when timer stopped |
| `timeSpent` | `number \| null` | Optional | Total time in ms |
| **Indexes** | `by_contract` on `["contractId"]`, `by_contract_status` on `["contractId", "status"]` | | |

---

### `messages`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"messages">` | Auto | Convex document ID |
| `contractId` | `Id<"contracts">` | Required | Which contract chat this belongs to |
| `senderId` | `Id<"users">` | Required | Message author |
| `content` | `string` | Required | Message text |
| **Indexes** | `by_contract` on `["contractId"]` | | |

---

### `invoices`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | `Id<"invoices">` | Auto | Convex document ID |
| `contractId` | `Id<"contracts">` | Required | Parent contract |
| `lineItems` | `Array<LineItem>` | Required | Array of billing items |
| `subtotal` | `number` | Required | Sum before tax |
| `tax` | `number` | Required | Tax amount |
| `total` | `number` | Required | subtotal + tax |
| `aiGenerated` | `boolean` | Required | Whether AI created the draft |
| `notes` | `string \| null` | Optional | AI note on pricing assumptions |
| `status` | `"draft" \| "sent" \| "paid"` | Required | Invoice lifecycle |
| `paymentSimulated` | `boolean` | Required | Whether demo payment was triggered |
| `deliverables` | `Array<{name: string, url: string}> \| null` | Optional | Links to deliverables |
| **Indexes** | `by_contract` on `["contractId"]` | | |

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
| `read` | `boolean` | Required | Read state |
| **Indexes** | `by_user` on `["userId"]`, `by_user_unread` on `["userId", "read"]` | | |

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
  | "time_tracked"
  | "project_complete"
  | "deliverable_released"
```

---

## Relationships

- `userRoles.userId` → `users._id` (one-to-one: each user has one role)
- `userPushTokens.userId` → `users._id` (one-to-many: user can have multiple devices)
- `userEmails.userId` → `users._id` (one-to-many: user can have multiple emails)
- `chatReadStatus.userId` → `users._id` (one-to-many)
- `chatReadStatus.contractId` → `contracts._id` (one-to-many)
- `notificationPreferences.userId` → `users._id` (one-to-many)
- `contracts.freelancerId` → `users._id` (many-to-one)
- `contracts.clientId` → `users._id` (many-to-one)
- `tasks.contractId` → `contracts._id` (many-to-one)
- `messages.contractId` → `contracts._id` (many-to-one)
- `messages.senderId` → `users._id` (many-to-one)
- `invoices.contractId` → `contracts._id` (one-to-one)
- `notifications.userId` → `users._id` (many-to-one)
- `notifications.contractId` → `contracts._id` (optional reference)

---

## Access Control

Convex does not have SQL RLS. Access control is enforced in every query/mutation via session checking:

```typescript
// Pattern used in every Convex function:
const userId = await getAuthUserId(ctx);  // returns null if not authenticated
if (!userId) throw new ConvexError("UNAUTHORIZED");

// Role check pattern via userRoles table:
const userRole = await ctx.db.query("userRoles")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .first();
if (userRole?.role !== "freelancer") throw new ConvexError("UNAUTHORIZED");
```

---

## Migrations

The project uses the `@convex-dev/migrations` component for schema migrations. See `skills/convex-migration-helper/` for guidance.
