# Sprint 4: Payment Flow & Earnings Implementation Plan

## Overview

This sprint implements the payment simulation flow after invoice generation, with the freelancer's preferred payment method highlighted for the client, earnings tracking on the freelancer dashboard, and proper notification flow.

---

## Current State Analysis

### Already Implemented
- ✅ Invoice pages exist for both client and freelancer
- ✅ PaymentSimulation component with card/mobile money inputs
- ✅ Payment success animation and state
- ✅ Notification system with `sendPaymentReceivedNotification` action
- ✅ Tasks page exists at `app/(freelancer)/contracts/[id]/tasks.tsx`
- ✅ Contract detail pages show payment method
- ✅ `simulatePayment` mutation updates invoice status and contract

### Gaps Identified
- ❌ Client contract view doesn't link to invoice page
- ❌ Preferred payment method not highlighted in PaymentSimulation
- ❌ Freelancer dashboard missing earnings summary
- ❌ No query to calculate freelancer total earnings from paid invoices
- ❌ Client needs a "Pay" button visible in contract view when invoice is ready

---

## Task Breakdown

### Phase 1: Backend - Earnings Query

#### Task 1.1: Add `getFreelancerEarnings` query in `convex/invoices.ts`
- Query all contracts for the freelancer
- Sum up totals from paid invoices
- Return total earnings and paid invoice count

```typescript
// New query to add
export const getFreelancerEarnings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { totalEarnings: 0, paidInvoicesCount: 0 };

    // Get all freelancer's contracts
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", userId))
      .collect();

    // Get paid invoices for each contract
    let totalEarnings = 0;
    let paidInvoicesCount = 0;

    for (const contract of contracts) {
      const invoice = await ctx.db
        .query("invoices")
        .withIndex("by_contract", (q) => q.eq("contractId", contract._id))
        .first();

      if (invoice?.status === "paid") {
        totalEarnings += invoice.total;
        paidInvoicesCount++;
      }
    }

    return { totalEarnings, paidInvoicesCount };
  },
});
```

#### Task 1.2: Add `getEarningsStats` hook in `hooks/useInvoice.ts`
- Export a new `useFreelancerEarnings` hook
- Uses `api.invoices.getFreelancerEarnings` query

---

### Phase 2: Frontend - Freelancer Dashboard Earnings

#### Task 2.1: Update `app/(freelancer)/dashboard/index.tsx`
- Add earnings card showing total earnings
- Add paid invoices count
- Use `useFreelancerEarnings` hook

```typescript
// Add to stats section
<Card style={styles.earningsCard}>
  <Typography variant="caption" color={colors.gray500}>
    Total Earnings
  </Typography>
  <Heading level="h2" color={colors.freelancer}>
    ${earningsStats.totalEarnings.toFixed(2)}
  </Heading>
  <Typography variant="bodySmall" color={colors.gray500}>
    {earningsStats.paidInvoicesCount} paid invoice(s)
  </Typography>
</Card>
```

---

### Phase 3: Payment Simulation - Preferred Method Highlighting

#### Task 3.1: Update `PaymentSimulation.tsx` to accept preferred method

```typescript
interface PaymentSimulationProps {
  total: number;
  onPayment: (method: PaymentMethod) => Promise<void>;
  isProcessing?: boolean;
  deliverableLink?: string | null;
  preferredMethod?: PaymentMethod;  // NEW PROP
  style?: ViewStyle;
}
```

#### Task 3.2: Visual highlighting in payment method selection
- If `preferredMethod` is set, show it with a "Recommended" badge
- Pre-select the preferred method by default

```typescript
// In render, add badge to preferred method
const isPreferred = method.id === preferredMethod;

return (
  <View style={[styles.methodOption, isPreferred && styles.methodPreferred]}>
    {isPreferred && <Text style={styles.preferredBadge}>Recommended</Text>}
    {/* ... rest of method UI */}
  </View>
);
```

---

### Phase 4: Client Contract View - Invoice Link & Pay Button

#### Task 4.1: Update `app/(client)/contracts/[id]/index.tsx`
- Import `useInvoice` hook
- Add "View Invoice" / "Pay Now" button when invoice exists
- Navigate to invoice page

```typescript
const { invoice } = useInvoice(contractId);

// When contract is active and invoice exists and is "sent"
{contract.status === "active" && invoice?.status === "sent" && (
  <Button
    title="Pay Invoice"
    variant="primary"
    onPress={() => router.push(`/contracts/${contractId}/invoice`)}
  />
)}
```

#### Task 4.2: Update `app/(client)/contracts/[id]/invoice.tsx`
- Pass `preferredMethod={contract.paymentMethod}` to PaymentSimulation
- This highlights the freelancer's preferred method

---

### Phase 5: Notification Verification

#### Task 5.1: Verify notification flow in `convex/invoices.ts`
- Ensure `simulatePayment` mutation calls `sendPaymentReceivedNotification`
- Currently it does call this at line 351

```typescript
await ctx.scheduler.runAfter(0, internalAny.actions.push.sendPaymentReceivedNotification, {
  invoiceId: args.invoiceId,
  contractId: invoice.contractId,
});
```

Note: The action uses `contract.freelancerId` internally to send to the freelancer. This needs verification in `convex/actions/push.ts`.

#### Task 5.2: Verify/fix `sendPaymentReceivedNotification` implementation
- The action currently doesn't have access to freelancerId
- Need to look up the contract to get freelancerId or pass userId directly

Looking at current implementation in `convex/actions/push.ts`:
```typescript
export const sendPaymentReceivedNotification = action({
  args: {
    userId: v.id("users"),  // This is the freelancer's userId
    invoiceId: v.id("invoices"),
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internalAny.pushInternal._sendPushToUser, {
      userId: args.userId,  // Correctly sends to freelancer
      title: "Payment Received! 💰",
      body: "Your client has completed payment. Please share the deliverable link.",
      contractId: args.contractId,
      invoiceId: args.invoiceId,
    });
  },
});
```

Issue: The mutation passes `invoiceId` and `contractId` but not `userId`. Need to look up freelancerId from contract in the mutation.

#### Task 5.3: Fix notification userId in `simulatePayment` mutation

Current code at line 351:
```typescript
await ctx.scheduler.runAfter(0, internalAny.actions.push.sendPaymentReceivedNotification, {
  invoiceId: args.invoiceId,
  contractId: invoice.contractId,
});
```

Should be:
```typescript
await ctx.scheduler.runAfter(0, internalAny.actions.push.sendPaymentReceivedNotification, {
  userId: contract.freelancerId,  // ADD THIS - send to freelancer
  invoiceId: args.invoiceId,
  contractId: invoice.contractId,
});
```

---

## Implementation Order

1. **Backend**: Add `getFreelancerEarnings` query
2. **Hooks**: Add `useFreelancerEarnings` hook
3. **PaymentSimulation**: Add preferred method highlighting
4. **Client Invoice Page**: Pass preferred method to PaymentSimulation
5. **Client Contract View**: Add invoice link/pay button
6. **Freelancer Dashboard**: Add earnings display
7. **Fix notification**: Add userId to sendPaymentReceivedNotification call

---

## Files to Modify

### Convex Backend
- `convex/invoices.ts` - Add earnings query, fix notification call

### Frontend
- `hooks/useInvoice.ts` - Add `useFreelancerEarnings` hook
- `src/components/invoice/PaymentSimulation.tsx` - Add preferred method prop
- `app/(client)/contracts/[id]/invoice.tsx` - Pass preferred method
- `app/(client)/contracts/[id]/index.tsx` - Add invoice link button
- `app/(freelancer)/dashboard/index.tsx` - Add earnings card

---

## Testing Checklist

- [ ] Freelancer creates contract with payment method
- [ ] Client sees the contract with payment method highlighted
- [ ] Freelancer generates invoice and sends it
- [ ] Client receives notification about invoice
- [ ] Client views invoice with preferred method highlighted
- [ ] Client simulates payment
- [ ] Freelancer receives payment notification
- [ ] Freelancer sees updated earnings on dashboard
- [ ] Invoice shows as "paid" on both sides