# Payment Flow Bug Fixes Plan

## Issues Identified:

1. **"Pay Now" contracts**: Client not prompted to pay when accepting contract
2. **Fixed price "Pay Later"**: Shows hourly-style UI (line items) instead of simple fixed price invoice
3. **No deliverable links in "Pay Later" invoice email**: Client doesn't receive deliverables via email
4. **Hourly "Pay Later"**: Freelancer can't add deliverable links when generating invoice
5. **Timer shows for non-hourly contracts**: Timer should be hidden for fixed-price

## Fixes Required

### Issue 1: "Pay Now" - Client Not Prompted to Pay on Accept

**Current Behavior:**
- Client accepts contract → status becomes "active" → nothing else happens
- Payment only happens later via invoice

**Expected Behavior:**
- Client accepts "Pay Now" contract → Payment flow triggers immediately
- Money held in escrow → contract becomes "active" with `escrowStatus: "held"`

**File**: `app/(client)/contracts/[id]/index.tsx`

When client accepts a "Pay Now" contract, they should be redirected to payment:

```typescript
const handleAccept = async () => {
  if (!contractId) return;
  try {
    await acceptContract({ contractId });
    
    // If Pay Now, redirect to payment
    if (contract.paymentTiming === "now") {
      router.push(`/contracts/${contractId}/invoice`);
    }
  } catch (error) {
    Alert.alert("Error", "Failed to accept contract");
  }
};
```

### Issue 2: Fixed Price "Pay Later" Shows Hourly UI

**Current Behavior:**
- Fixed price "Pay Later" shows line items, AI generation, etc.
- Should be simpler: just fixed price + deliverables

**Expected Behavior:**
- Fixed price "Pay Later": Show fixed price amount + deliverables input
- Invoice is automatically created with fixed price when freelancer submits

**File**: `app/(freelancer)/contracts/[id]/invoice.tsx`

Simplify the "Pay Later" fixed price flow:

```typescript
// For fixed price "Pay Later" - show simple invoice
const isFixedPayLater = contract.pricingType === "fixed" && contract.paymentTiming === "later";

// No invoice exists for fixed pay later - show simple create form
{!hasInvoice && !isPayNow && isFixedPayLater && (
  <Card style={styles.simpleInvoiceCard}>
    <Typography variant="h3">Fixed Price Invoice</Typography>
    <Typography variant="body">
      Total: ${contract.fixedPrice?.toFixed(2) || "0.00"}
    </Typography>
    
    {/* Deliverables section */}
    <DeliverableLinks
      contractId={contract._id}
      deliverables={contract.deliverables ?? []}
      editable={true}
    />
    
    <Button
      title="Create & Send Invoice"
      onPress={handleCreateFixedInvoice}
    />
  </Card>
)}
```

### Issue 3: Deliverable Links Not in Invoice Email

**Current Behavior:**
- `sendPaymentReceivedEmail` doesn't include deliverable links
- Invoice `deliverables` field exists but isn't populated for "Pay Later"

**Fix Required in**: `convex/email.ts` - Update `sendPaymentReceivedEmail` to include deliverable links

### Issue 4: Hourly "Pay Later" - Can't Add Deliverable Links

**Current Behavior:**
- Invoice has `deliverables` field but UI doesn't show deliverables input
- Deliverables only appear in "Pay Now" flow

**Fix Required in**: `app/(freelancer)/contracts/[id]/invoice.tsx`

Add deliverables input for "Pay Later" invoices (hourly and fixed):

```typescript
{/* For Pay Later - always show deliverables section */}
{(!isPayNow && hasInvoice) && (
  <Card style={styles.deliverablesCard}>
    <Typography variant="label">Deliverables</Typography>
    <DeliverableLinks
      contractId={contract._id}
      deliverables={invoice.deliverables ?? contract.deliverables ?? []}
      editable={isDraft}
      onChange={(newDeliverables) => {
        // Update invoice with deliverables
        updateInvoice(invoice._id, { deliverables: newDeliverables });
      }}
    />
  </Card>
)}
```

### Issue 5: Timer Shows for Non-Hourly Contracts

**Current Behavior:**
- Timer component shown for all task items

**Fix Required in**: Task item component or task list

Hide timer when contract is `pricingType === "fixed"`:

```typescript
{/* Only show timer for hourly contracts */}
{contract.pricingType === "hourly" && (
  <TimerControl ... />
)}
```

## Additional: Update sendPaymentReceivedEmail

**File**: `convex/email.ts`

Update to include deliverable links when they exist:

```typescript
// Include deliverables in email
let deliverablesHtml = "";
if (invoice.deliverables && invoice.deliverables.length > 0) {
  deliverablesHtml = invoice.deliverables.map(d =>
    `<li><a href="${d.url}">${d.name}</a></li>`
  ).join("");
}

const content = emailTemplate({
  title: "Payment Confirmed! 💰",
  content: `
    <p>Your payment of <strong>$${invoice.total.toFixed(2)}</strong> has been received.</p>
    ${deliverablesHtml ? `
      <p><strong>Your Deliverables:</strong></p>
      <ul>${deliverablesHtml}</ul>
    ` : ""}
  `,
});
```

## Summary of Files to Modify

| File | Fix |
|------|-----|
| `app/(client)/contracts/[id]/index.tsx` | Redirect to payment on accept for "Pay Now" |
| `app/(freelancer)/contracts/[id]/invoice.tsx` | Add deliverables input for "Pay Later", simplify fixed price UI |
| `app/(freelancer)/contracts/[id]/tasks.tsx` | Hide timer for non-hourly |
| `convex/email.ts` | Include deliverables in payment email |