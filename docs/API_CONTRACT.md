# Flowdesk — API Contract

**Version:** 1.0  
**Last Updated:** 2026-04-05  

Full input/output shapes for every Convex function.

---

## Auth

### `auth:signUp`
```typescript
// Input
{
  email: string;
  password: string;
  name: string;
  pseudo: string;
  role: "freelancer" | "client";
}

// Output
{
  userId: Id<"users">;
  token: string;
}
```

### `auth:signIn`
```typescript
// Input
{
  email: string;
  password: string;
}

// Output
{
  userId: Id<"users">;
  token: string;
  role: "freelancer" | "client";
}
```

---

## Users

### `users:me` (query)
```typescript
// Input: none (uses session)

// Output
{
  _id: Id<"users">;
  name: string;
  email: string;
  pseudo: string;
  role: "freelancer" | "client";
  pushToken: string | null;
  createdAt: number;
}
```

### `users:updatePushToken` (mutation)
```typescript
// Input
{ pushToken: string }

// Output
{ success: true }
```

### `users:updateProfile` (mutation)
```typescript
// Input
{
  name?: string;
  pseudo?: string;
}

// Output
{ success: true }
```

---

## Contracts

### `contracts:create` (mutation)
```typescript
// Input
{
  clientEmail: string;
  clientName: string;
  clientPseudo: string;
  title: string;
  pricingType: "fixed" | "hourly";
  fixedPrice?: number;          // required if pricingType === "fixed"
  paymentTiming: "now" | "later";
  paymentMethod: "stripe" | "naboo_orange" | "naboo_wave";
  aiEmailTone: "formal" | "friendly" | "casual";
}

// Output
{
  contractId: Id<"contracts">;
  status: "pending";
}
```

### `contracts:listByFreelancer` (query)
```typescript
// Input: none (uses session)

// Output: Array<{
  _id: Id<"contracts">;
  title: string;
  clientName: string;
  status: "pending" | "active" | "completed" | "declined";
  pricingType: "fixed" | "hourly";
  completionPercent: number;
  createdAt: number;
}>
```

### `contracts:listByClient` (query)
```typescript
// Input: none (uses session)

// Output: same shape as listByFreelancer
```

### `contracts:getById` (query)
```typescript
// Input
{ contractId: Id<"contracts"> }

// Output
{
  _id: Id<"contracts">;
  freelancerId: Id<"users">;
  clientId: Id<"users"> | null;
  clientEmail: string;
  clientName: string;
  clientPseudo: string;
  title: string;
  status: "pending" | "active" | "completed" | "declined";
  pricingType: "fixed" | "hourly";
  fixedPrice: number | null;
  paymentTiming: "now" | "later";
  paymentMethod: "stripe" | "naboo_orange" | "naboo_wave";
  aiEmailTone: "formal" | "friendly" | "casual";
  completionPercent: number;
  deliverableLink: string | null;
  createdAt: number;
}
```

### `contracts:accept` (mutation)
```typescript
// Input
{ contractId: Id<"contracts"> }

// Output
{ status: "active" }
```

### `contracts:decline` (mutation)
```typescript
// Input
{ contractId: Id<"contracts"> }

// Output
{ status: "declined" }
```

### `contracts:updateDeliverableLink` (mutation)
```typescript
// Input
{
  contractId: Id<"contracts">;
  deliverableLink: string;
}

// Output
{ success: true }
```

---

## Tasks

### `tasks:create` (mutation)
```typescript
// Input
{
  contractId: Id<"contracts">;
  title: string;
  hourlyRate?: number;    // optional, ignored on fixed contracts
}

// Output
{ taskId: Id<"tasks"> }
```

### `tasks:listByContract` (query)
```typescript
// Input
{ contractId: Id<"contracts"> }

// Output: Array<{
  _id: Id<"tasks">;
  contractId: Id<"contracts">;
  title: string;
  status: "pending" | "running" | "completed";
  hourlyRate: number | null;
  startedAt: number | null;
  completedAt: number | null;
  timeSpent: number | null;    // in minutes
}>
```

### `tasks:updateStatus` (mutation)
```typescript
// Input
{
  taskId: Id<"tasks">;
  status: "pending" | "running" | "completed";
}

// Output
{ success: true }
```

### `tasks:startTimer` (mutation)
```typescript
// Input
{ taskId: Id<"tasks"> }

// Output
{ startedAt: number }
```

### `tasks:stopTimer` (mutation)
```typescript
// Input
{ taskId: Id<"tasks"> }

// Output
{
  completedAt: number;
  timeSpent: number;    // minutes
}
```

### `tasks:setHourlyRate` (mutation)
```typescript
// Input
{
  taskId: Id<"tasks">;
  hourlyRate: number;
}

// Output
{ success: true }
```

---

## Invoices

### `invoices:generate` (action)
```typescript
// Input
{ contractId: Id<"contracts"> }

// Output
{
  invoiceId: Id<"invoices">;
  lineItems: Array<{
    description: string;
    hours: number | null;
    rate: number | null;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;    // AI note if hourly rates were missing
  status: "draft";
}
```

### `invoices:getByContract` (query)
```typescript
// Input
{ contractId: Id<"contracts"> }

// Output (same as generate output) | null
```

### `invoices:update` (mutation)
```typescript
// Input
{
  invoiceId: Id<"invoices">;
  lineItems?: Array<{
    description: string;
    hours: number | null;
    rate: number | null;
    amount: number;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
}

// Output
{ success: true }
```

### `invoices:send` (mutation)
```typescript
// Input
{ invoiceId: Id<"invoices"> }

// Output
{ status: "sent" }
```

### `invoices:simulatePayment` (mutation)
```typescript
// Input
{ invoiceId: Id<"invoices"> }

// Output
{
  status: "paid";
  deliverableLink: string | null;
}
```

---

## Messages

### `messages:send` (mutation)
```typescript
// Input
{
  contractId: Id<"contracts">;
  content: string;
}

// Output
{ messageId: Id<"messages"> }
```

### `messages:listByContract` (paginated query)
```typescript
// Input
{
  contractId: Id<"contracts">;
  paginationOpts: PaginationOptions;
}

// Output
{
  results: Array<{
    _id: Id<"messages">;
    contractId: Id<"contracts">;
    senderId: Id<"users">;
    senderName: string;
    content: string;
    createdAt: number;
  }>;
  isDone: boolean;
}
```

---

## Notifications

### `notifications:listByUser` (query)
```typescript
// Input: none (uses session)

// Output: Array<{
  _id: Id<"notifications">;
  type: "contract_invite" | "contract_accepted" | "contract_declined"
       | "task_complete" | "invoice_received" | "payment_received" | "new_message";
  contractId: Id<"contracts"> | null;
  message: string;
  read: boolean;
  createdAt: number;
}>
```

### `notifications:markRead` (mutation)
```typescript
// Input
{ notificationId: Id<"notifications"> }

// Output
{ success: true }
```

### `notifications:markAllRead` (mutation)
```typescript
// Input: none

// Output
{ count: number }    // number of notifications marked read
```
