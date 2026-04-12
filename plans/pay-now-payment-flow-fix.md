# Pay Now Payment Flow Fix Plan

## Current Issues

1. **Wrong mutation called**: `app/(client)/contracts/[id]/invoice.tsx` line 24 uses `api.invoices.simulatePayment` which expects `invoiceId`, but it's passing `contractId`

2. **Wrong UI for new Pay Now contracts**: When a Pay Now contract is just accepted (0% complete), the invoice page shows "Work is in progress" instead of showing the payment form

3. **Payment before work**: For Pay Now upfront payment, the client pays BEFORE work starts, not after. The current code expects work to be 100% complete.

## Correct Flow for Pay Now Upfront Payment

```
1. Client views pending Pay Now contract
2. Client clicks "Accept & Pay Now"
3. Contract becomes "active" (status set by acceptContract)
4. Redirect to invoice page
5. Invoice page shows:
   - Contract details + fixed price amount
   - Payment methods (Stripe, Orange Money, Wave)
   - "Pay Now" button
6. Client selects payment method + enters details
7. Client clicks "Pay Now"
8. simulatePaymentNow is called
9. escrowStatus = "held", invoice marked as paid
10. Success message shown
11. Freelancer is notified to start work
```

## Fixes Required

### 1. Client Invoice Screen (`app/(client)/contracts/[id]/invoice.tsx`)

**Change the mutation from `simulatePayment` to `simulatePaymentNow`:**
```typescript
// Before (line 24):
const simulatePaymentMutation = useMutation(api.invoices.simulatePayment);

// After:
const simulatePaymentMutation = useMutation(api.invoices.simulatePaymentNow);
```

**For Pay Now contracts with NO invoice:**
- If contract is active and escrowStatus is NOT "held" yet → Show payment form
- Remove the `!isComplete` condition for Pay Now

The condition should be:
```typescript
{/* Pay Now - Show Payment Form */}
{isPayNow && !hasInvoice && contract.status === "active" && contract.escrowStatus !== "held" && (
  <Card style={styles.payNowCard}>
    <Typography variant="body" style={styles.payNowTitle}>
      Upfront Payment Required
    </Typography>
    <Typography variant="bodySmall" color={colors.gray500} style={styles.payNowSubtitle}>
      Please complete your payment to activate the contract.
    </Typography>
    
    {/* Show contract price */}
    <View style={styles.priceSection}>
      <Typography variant="label" color={colors.gray500}>
        Total Amount
      </Typography>
      <Typography variant="h2" style={styles.priceAmount}>
        ${contract.fixedPrice?.toFixed(2) || "0.00"}
      </Typography>
    </View>
    
    {/* Payment Methods */}
    <PaymentSimulation
      total={contract.fixedPrice ?? 0}
      onPayment={handlePayment}
      isProcessing={isProcessing}
      preferredMethod={contract.paymentMethod}
      style={styles.paymentSection}
    />
  </Card>
)}
```

**Remove or modify the "Work Complete" section** (lines 139-167) - this should NOT apply to newly accepted contracts where payment hasn't been made yet.

### 2. PaymentSimulation Component Update

The `PaymentSimulation` component already handles showing:
- Total amount
- Payment method selection
- Card/phone input
- Pay Now button

We just need to ensure it's used for the Pay Now case.

## Files to Modify

1. `app/(client)/contracts/[id]/invoice.tsx`:
   - Change `simulatePayment` to `simulatePaymentNow`
   - Update Pay Now UI logic to show payment form immediately after accept
   - Pass fixedPrice to PaymentSimulation

## Implementation Steps

1. Import `useSimulatePaymentNow` hook (already done)
2. Change `simulatePaymentMutation` to use `api.invoices.simulatePaymentNow`
3. Update the Pay Now section condition to show payment form when `!hasInvoice` and `status === "active"` and `escrowStatus !== "held"`
4. Pass `contract.fixedPrice` to `PaymentSimulation` as `total`
