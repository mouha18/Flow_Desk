import { StyleSheet, View, ScrollView, Alert } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Typography, Screen, Card, Button } from "@/components/ui";
import { InvoiceLineItems, InvoiceSummary, PaymentSimulation } from "@/components/invoice";
import { DeliverableLinks } from "@/components/contracts";
import { useContractById } from "@/hooks/useContracts";
import { useInvoice, useSimulatePayment, useSimulatePaymentNow } from "@/hooks/useInvoice";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Id } from "@/convex/_generated/dataModel";
import type { PaymentMethod } from "@/types";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ClientInvoiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = id as Id<"contracts"> | undefined;
  const { contract, isLoading: contractLoading } = useContractById(contractId);
  const { invoice, isLoading: invoiceLoading } = useInvoice(contractId);
  const { simulatePayment } = useSimulatePayment();
  const { simulatePaymentNow, isProcessing } = useSimulatePaymentNow();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const simulatePaymentNowMutation = useMutation(api.invoices.simulatePaymentNow);

  // Check if payment was already processed
  useEffect(() => {
    if (invoice?.status === "paid") {
      setPaymentSuccess(true);
    }
  }, [invoice]);

  const handlePayment = async (method: PaymentMethod) => {
    if (isPayNow && !hasInvoice) {
      // For Pay Now contracts (upfront payment), simulate payment directly on contract
      if (!contractId) return;
      try {
        await simulatePaymentNowMutation({ contractId });
        setPaymentSuccess(true);
      } catch (error) {
        Alert.alert(
          "Payment Failed",
          error instanceof Error ? error.message : "Failed to process payment"
        );
        throw error;
      }
    } else if (invoice) {
      try {
        await simulatePayment(invoice._id);
        setPaymentSuccess(true);
      } catch (error) {
        Alert.alert(
          "Payment Failed",
          error instanceof Error ? error.message : "Failed to process payment"
        );
        throw error;
      }
    }
  };

  if (contractLoading || invoiceLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Invoice" }} />
        <Screen style={styles.container}>
          <Card style={styles.loadingCard}>
            <Typography variant="bodySmall" color={colors.gray500}>
              Loading...
            </Typography>
          </Card>
        </Screen>
      </>
    );
  }

  if (!contract) {
    return (
      <>
        <Stack.Screen options={{ title: "Invoice" }} />
        <Screen style={styles.container}>
          <Card style={styles.errorCard}>
            <Typography variant="bodySmall" color={colors.error}>
              Contract not found
            </Typography>
          </Card>
        </Screen>
      </>
    );
  }

  const invoiceStatus = invoice?.status;
  const hasInvoice = !!invoice;
  const isSent = invoiceStatus === "sent";
  const isPaid = invoiceStatus === "paid";
  const isPayNow = contract.paymentTiming === "now";
  const isComplete = contract && contract.completionPercent >= 100;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Invoice",
          headerLargeTitle: false,
        }}
      />
      <Screen style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Contract Info */}
          <Card style={styles.contractCard}>
            <Typography variant="body" color={colors.gray900} style={styles.contractTitleBold}>
              {contract.title}
            </Typography>
            <Typography variant="bodySmall" color={colors.gray500}>
              From: {contract.clientName || "Freelancer"}
            </Typography>
          </Card>

          {/* No Invoice State */}
          {!hasInvoice && !isPayNow && (
            <Card style={styles.noInvoiceCard}>
              <Typography variant="body" color={colors.gray500} style={styles.noInvoiceText}>
                No invoice received yet. The freelancer will send an invoice once the work is complete.
              </Typography>
            </Card>
          )}

          {/* Pay Now - Show Payment Form (upfront payment) */}
          {isPayNow && !hasInvoice && contract.status === "active" && contract.escrowStatus !== "held" && contract.escrowStatus !== "released" && !paymentSuccess && (
            <PaymentSimulation
              total={contract.fixedPrice ?? 0}
              onPayment={handlePayment}
              isProcessing={isProcessing}
              preferredMethod={contract.paymentMethod}
              style={styles.paymentSection}
            />
          )}

          {/* Pay Now - Payment Already Made (escrow held or released) */}
          {isPayNow && !hasInvoice && (contract.escrowStatus === "held" || contract.escrowStatus === "released") && (
            <Card style={styles.payNowCard}>
              <Typography variant="body" style={styles.payNowTitle}>
                Payment Received!
              </Typography>
              <Typography variant="bodySmall" color={colors.gray500} style={styles.payNowSubtitle}>
                Your upfront payment has been processed. The freelancer will start working soon.
              </Typography>
              <Typography variant="bodySmall" color={colors.success} style={styles.hint}>
                Amount paid: ${contract.fixedPrice?.toFixed(2) || "0.00"}
              </Typography>
            </Card>
          )}

          {/* Invoice Exists - Show Details */}
          {hasInvoice && (
            <>
              {/* Invoice Status */}
              <Card style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <Typography variant="label" color={colors.gray500}>
                    Status
                  </Typography>
                  <View
                    style={[
                      styles.statusBadge,
                      isPaid ? styles.statusPaid : isSent ? styles.statusSent : styles.statusDraft,
                    ]}
                  >
                    <Typography
                      variant="bodySmall"
                      color={isPaid ? colors.success : isSent ? colors.warning : colors.gray600}
                    >
                      {invoiceStatus?.charAt(0).toUpperCase() + invoiceStatus?.slice(1)}
                    </Typography>
                  </View>
                </View>
              </Card>

              {/* Line Items (Read-only) */}
              <Card style={styles.lineItemsCard}>
                <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                  Line Items
                </Typography>
                <InvoiceLineItems
                  lineItems={invoice.lineItems as any[]}
                  editable={false}
                />
              </Card>

              {/* Invoice Summary */}
              <InvoiceSummary
                subtotal={invoice.subtotal}
                tax={invoice.tax}
                total={invoice.total}
                taxRate={invoice.subtotal > 0 ? (invoice.tax / invoice.subtotal) * 100 : 0}
                editable={false}
                style={styles.summary}
              />

              {/* Notes */}
              {invoice.notes && (
                <Card style={styles.notesCard}>
                  <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                    Notes
                  </Typography>
                  <Typography variant="bodySmall">{invoice.notes}</Typography>
                </Card>
              )}

              {/* Sent State - Show Payment Simulation */}
              {isSent && !paymentSuccess && (
                <PaymentSimulation
                  total={invoice.total}
                  onPayment={handlePayment}
                  isProcessing={isProcessing}
                  preferredMethod={contract.paymentMethod}
                  style={styles.paymentSection}
                />
              )}

              {/* Paid State - Show Success + Deliverable */}
              {(isPaid || paymentSuccess) && (
                <>
                  <Card style={styles.successCard}>
                    <View style={styles.successIcon}>
                      <Typography variant="body" style={styles.successIconText}>✓</Typography>
                    </View>
                    <Typography variant="body" color={colors.gray900} style={styles.successTitle}>
                      Payment Successful!
                    </Typography>
                    <Typography variant="bodySmall" color={colors.gray600} style={styles.successSubtitle}>
                      Your payment has been processed. The deliverable is now available.
                    </Typography>
                  </Card>

                  {/* Deliverable Links */}
                  {contract.deliverables && contract.deliverables.length > 0 && (
                    <Card style={styles.deliverableCard}>
                      <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                        Your Deliverables
                      </Typography>
                      <DeliverableLinks
                        contractId={contract._id}
                        deliverables={contract.deliverables ?? []}
                        editable={false}
                      />
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  loadingCard: {
    alignItems: "center",
    padding: spacing[8],
    margin: spacing[4],
  },
  errorCard: {
    alignItems: "center",
    padding: spacing[8],
    margin: spacing[4],
  },
  contractCard: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  contractTitleBold: {
    fontWeight: "700",
    marginBottom: spacing[1],
  },
  noInvoiceCard: {
    margin: spacing[4],
    alignItems: "center",
  },
  noInvoiceText: {
    textAlign: "center",
  },
  hint: {
    marginTop: spacing[3],
  },
  payNowCard: {
    margin: spacing[4],
    padding: spacing[4],
    alignItems: "center",
    backgroundColor: colors.success + "08",
  },
  payNowTitle: {
    fontWeight: "600",
    fontSize: 18,
    marginBottom: spacing[2],
    color: colors.success,
  },
  payNowSubtitle: {
    textAlign: "center",
    marginBottom: spacing[4],
  },
  deliverablesPreview: {
    width: "100%",
    marginBottom: spacing[4],
  },
  deliverableItem: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  payNowButton: {
    width: "100%",
  },
  statusCard: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },
  statusDraft: {
    backgroundColor: colors.gray100,
  },
  statusSent: {
    backgroundColor: colors.warning + "20",
  },
  statusPaid: {
    backgroundColor: colors.success + "20",
  },
  lineItemsCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  sectionLabel: {
    marginBottom: spacing[3],
  },
  summary: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  notesCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  paymentSection: {
    margin: spacing[4],
    marginTop: spacing[2],
  },
  successCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
    alignItems: "center",
    backgroundColor: colors.success + "10",
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  successIconText: {
    fontSize: 32,
  },
  successTitle: {
    fontWeight: "600",
    fontSize: 18,
    marginBottom: spacing[2],
  },
  successSubtitle: {
    textAlign: "center",
  },
  deliverableCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
    backgroundColor: colors.primary + "08",
  },
  deliverableLinkContainer: {
    marginTop: spacing[2],
  },
  deliverableLink: {
    marginBottom: spacing[1],
  },
});
