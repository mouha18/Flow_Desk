# Flowdesk — API Design

**Protocol:** Convex real-time subscriptions + mutations (no REST layer)  
**Auth:** Convex Auth JWT — token stored in AsyncStorage, injected by Convex client  
**Format:** TypeScript function calls, JSON over WebSocket  
**Version:** v1  

> Note: Flowdesk uses Convex as its backend. There is no traditional HTTP REST API. "Endpoints" are Convex query/mutation/action functions called from the client via the Convex React SDK (`useQuery`, `useMutation`, `useAction`). This document describes the public function surface.

---

## Design Principles

1. **Queries are real-time subscriptions** — every `useQuery` call opens a live subscription; UI updates automatically when data changes.
2. **Mutations are the only write path** — all data changes go through named Convex mutations; no direct DB writes from the client.
3. **Actions handle side effects** — Anthropic API calls, Resend emails, and push sends run in Convex actions (server-side), never on the client.
4. **Role-based access** — every query and mutation checks the caller's role via their session; cross-role data access throws an error.
5. **Optimistic updates** — the Convex client applies optimistic local updates for mutations; server state reconciles automatically.

---

## Authentication

Convex Auth manages sessions. After login, a JWT is issued and managed by the Convex client automatically. No manual header management required.

Public functions (no auth required):
- `auth:signIn`
- `auth:signUp`
- `auth:signOut`

All other functions require a valid session. Unauthorized calls return:

```text
ConvexError: "Unauthenticated"
```

---

## Function Map

### Users

| Type | Function | Description | Auth |
|---|---|---|---|
| mutation | `users:updatePushToken` | Store Expo push token for current user | ✅ |
| query | `users:me` | Get current user profile | ✅ |
| mutation | `users:updateProfile` | Update name, pseudo, avatar | ✅ |

---

### Contracts

| Type | Function | Description | Auth |
|---|---|---|---|
| mutation | `contracts:create` | Create new contract + trigger outreach email | Freelancer |
| query | `contracts:listByFreelancer` | All contracts for logged-in freelancer | Freelancer |
| query | `contracts:listByClient` | All contracts for logged-in client | Client |
| query | `contracts:getById` | Single contract detail | ✅ |
| mutation | `contracts:accept` | Client accepts contract → status: active | Client |
| mutation | `contracts:decline` | Client declines contract → status: declined | Client |
| mutation | `contracts:updateDeliverableLink` | Freelancer sets deliverable link | Freelancer |
| mutation | `contracts:updateCompletionPercent` | Recalculate based on tasks (internal) | Internal |

---

### Tasks

| Type | Function | Description | Auth |
|---|---|---|---|
| mutation | `tasks:create` | Add task to a contract | Freelancer |
| query | `tasks:listByContract` | All tasks for a contract | ✅ |
| mutation | `tasks:updateStatus` | Set status: pending/running/completed | Freelancer |
| mutation | `tasks:startTimer` | Record startedAt timestamp | Freelancer |
| mutation | `tasks:stopTimer` | Record completedAt + calculate timeSpent | Freelancer |
| mutation | `tasks:setHourlyRate` | Set rate on a task (hourly contracts only) | Freelancer |
| mutation | `tasks:delete` | Remove a task | Freelancer |

---

### Invoices

| Type | Function | Description | Auth |
|---|---|---|---|
| action | `invoices:generate` | Call Anthropic API → save draft invoice | Freelancer |
| query | `invoices:getByContract` | Get invoice for a contract | ✅ |
| mutation | `invoices:update` | Freelancer edits line items / total | Freelancer |
| mutation | `invoices:send` | Change status to sent + notify client | Freelancer |
| mutation | `invoices:simulatePayment` | Client pays → trigger delivery + notifications | Client |

---

### Messages

| Type | Function | Description | Auth |
|---|---|---|---|
| mutation | `messages:send` | Send a message in a contract chat | ✅ |
| query | `messages:listByContract` | Real-time message list for a contract | ✅ |

---

### Notifications

| Type | Function | Description | Auth |
|---|---|---|---|
| query | `notifications:listByUser` | All notifications for current user | ✅ |
| mutation | `notifications:markRead` | Mark a notification as read | ✅ |
| mutation | `notifications:markAllRead` | Mark all as read | ✅ |

---

## Error Responses

Convex throws typed errors using `ConvexError`. All errors follow this shape:

```json
{
  "message": "Contract not found",
  "code": "NOT_FOUND"
}
```

| Code | Meaning |
|---|---|
| `UNAUTHENTICATED` | No valid session |
| `UNAUTHORIZED` | Authenticated but wrong role |
| `NOT_FOUND` | Resource does not exist |
| `VALIDATION_ERROR` | Invalid input fields |
| `AI_ERROR` | Anthropic API call failed |
| `EMAIL_ERROR` | Resend call failed |
| `ALREADY_EXISTS` | Duplicate creation attempt |

---

## Rate Limiting

Convex does not have built-in rate limiting at the function level. For v1:

- AI invoice generation is limited to one call per contract (guarded by checking for existing invoice with status `draft` or higher)
- Email sends are fire-and-forget; Resend enforces its own rate limits (3k/month on free tier)
- Push sends: no client-side rate limit; Expo Push API enforces 600 req/min

---

## Pagination

Real-time queries use Convex's built-in `usePaginatedQuery` for message lists. Shape:

```json
{
  "results": [...],
  "isDone": false,
  "loadMore": "<function>"
}
```

Contract and task lists are not paginated in v1 (user volume is low enough). <!-- assumed: pagination added in v2 -->
