import { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Typography, Heading, Screen, Card, Button } from "@/components/ui";
import { CompletionBar } from "@/components/tasks/CompletionBar";
import { InvoiceLineItems, InvoiceSummary } from "@/components/invoice";
import { DeliverableLinks } from "@/components/contracts";
import { useContractById } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { useInvoice, useCreateInvoice, useUpdateInvoice, useSendInvoice } from "@/hooks/useInvoice";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { formatCurrency } from "@/lib/formatting";
import type { Id } from "@/convex/_generated/dataModel";
import type { LineItem } from "@/types";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function FreelancerInvoiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = id as Id<"contracts"> | undefined;
  const { contract, isLoading: contractLoading } = useContractById(contractId);
  const { tasks } = useTasks(contractId);
  const { invoice, isLoading: invoiceLoading } = useInvoice(contractId);
  const { updateInvoice, isUpdating } = useUpdateInvoice();
  const { sendInvoice, isSending } = useSendInvoice();
  const { createInvoice, isCreating } = useCreateInvoice();
  const generateWithAI = useMutation(api.invoices.generateWithAI);

  // Local state for editable invoice
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate completion percentage from tasks
  const taskList = (tasks ?? []) as any[];
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t: any) => t.status === "completed").length;
  const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  // Sync local state with invoice when it loads
  useEffect(() => {
    if (invoice) {
      setLineItems(invoice.lineItems as LineItem[]);
      setTaxRate(invoice.tax > 0 && invoice.subtotal > 0 ? (invoice.tax / invoice.subtotal) * 100 : 0);
      setNotes(invoice.notes ?? "");
    }
  }, [invoice]);

  const handleGenerateWithAI = async () => {
    if (!contractId) return;
    
    setIsGenerating(true);
    try {
      await generateWithAI({ contractId });
      // Invoice will be fetched automatically via the useInvoice hook
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to generate invoice"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateFixedInvoice = async () => {
    if (!contractId || !contract) return;
    
    try {
      const fixedPrice = contract.fixedPrice ?? 0;
      // Create invoice with fixed price as single line item
      const lineItems = [{
        description: contract.title,
        hours: null,
        rate: null,
        amount: fixedPrice,
      }];
      await createInvoice({
        contractId,
        lineItems,
        subtotal: fixedPrice,
        tax: 0,
        total: fixedPrice,
        aiGenerated: false,
        notes: undefined,
      });
      Alert.alert("Success", "Invoice created. You can now edit and send it to the client.");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create invoice"
      );
    }
  };

  const handleSaveChanges = async () => {
    if (!invoice) return;
    
    try {
      await updateInvoice(invoice._id, {
        lineItems,
        subtotal,
        tax,
        total,
        notes: notes || undefined,
      });
      Alert.alert("Success", "Invoice saved successfully");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save invoice"
      );
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;
    
    Alert.alert(
      "Send Invoice",
      "Are you sure you want to send this invoice to the client?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            try {
              await sendInvoice(invoice._id);
              Alert.alert("Success", "Invoice sent to client");
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to send invoice"
              );
            }
          },
        },
      ]
    );
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
  const isDraft = invoiceStatus === "draft";
  const isSent = invoiceStatus === "sent";
  const isPaid = invoiceStatus === "paid";
  const isPayNow = contract.paymentTiming === "now";

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
              Client: {contract.clientDisplayName || contract.clientName || contract.clientPseudo || contract.clientEmail}
            </Typography>
          </Card>

          {/* Progress */}
          <Card style={styles.progressCard}>
            <Typography variant="label" color={colors.gray500}>
              Completion
            </Typography>
            <CompletionBar percent={completionPercent} style={styles.completionBar} />
          </Card>

          {/* Fixed price Pay Later - simpler form */}
          {!hasInvoice && !isPayNow && contract.pricingType === "fixed" && (
            <Card style={styles.simpleInvoiceCard}>
              <Heading level="h3">Fixed Price Invoice</Heading>
              <Typography variant="body" style={styles.totalAmount}>
                Total: ${contract.fixedPrice?.toFixed(2) || "0.00"}
              </Typography>
              
              <Typography variant="label" style={styles.sectionLabel}>
                Deliverables
              </Typography>
              <DeliverableLinks
                contractId={contract._id}
                deliverables={contract.deliverables ?? []}
                editable={true}
              />
              
              <Button
                title="Create Invoice"
                onPress={handleCreateFixedInvoice}
                disabled={!contract.deliverables?.length}
                variant="primary"
                style={styles.createInvoiceButton}
              />
            </Card>
          )}

          {/* Hourly Pay Later - Generate with AI */}
          {!hasInvoice && !isPayNow && contract.pricingType !== "fixed" && (
            <Card style={styles.noInvoiceCard}>
              <Typography variant="body" style={styles.noInvoiceText}>
                No invoice yet. Generate an AI-powered invoice based on your completed tasks.
              </Typography>
              <Button
                title={isGenerating ? "Generating..." : "Generate with AI"}
                onPress={handleGenerateWithAI}
                loading={isGenerating}
                disabled={isGenerating || completionPercent < 100}
                variant="primary"
              />
              {completionPercent < 100 && (
                <Typography variant="bodySmall" color={colors.warning} style={styles.hint}>
                  Complete all tasks to generate invoice
                </Typography>
              )}
            </Card>
          )}


          {/* Pay Now - No Invoice Needed, Add Deliverables */}
          {!hasInvoice && isPayNow && (completionPercent < 100 || !contract.deliverables?.length) && (
            <Card style={styles.noInvoiceCard}>
              <Typography variant="body" style={styles.noInvoiceText}>
                {completionPercent >= 100 
                  ? "Add deliverable links before submitting work."
                  : "Complete all tasks to add deliverables for payment."}
              </Typography>
              {completionPercent < 100 ? (
                <Typography variant="bodySmall" color={colors.warning} style={styles.hint}>
                  {Math.round(completionPercent)}% complete
                </Typography>
              ) : (
                <Typography variant="bodySmall" color={colors.warning} style={styles.hint}>
                  Add at least one deliverable
                </Typography>
              )}
            </Card>
          )}

          {/* Pay Now - At 100% with deliverables, show Submit Work button */}
          {!hasInvoice && isPayNow && completionPercent >= 100 && contract.deliverables && contract.deliverables.length > 0 && (
            <Card style={styles.submitWorkCard}>
              <Typography variant="label" style={styles.sectionLabel}>
                Deliverables
              </Typography>
              <Typography variant="bodySmall" color={colors.gray500} style={styles.deliverablesHint}>
                Your deliverables are ready to submit.
              </Typography>
              <DeliverableLinks
                contractId={contract._id}
                deliverables={contract.deliverables ?? []}
                editable={true}
              />
              <Button
                title="Submit Work for Payment"
                onPress={() => router.push(`/contracts/${contractId}/complete`)}
                variant="primary"
                style={styles.submitWorkButton}
              />
            </Card>
          )}

          {/* Invoice Exists - Show Line Items */}
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
                      style={isPaid || isSent ? styles.statusTextBold : undefined}
                    >
                      {(invoiceStatus ?? "draft").charAt(0).toUpperCase() + (invoiceStatus ?? "draft").slice(1)}
                    </Typography>
                  </View>
                </View>
                {invoice.aiGenerated && (
                  <Typography variant="bodySmall" color={colors.gray400} style={styles.aiBadge}>
                    AI Generated
                  </Typography>
                )}
              </Card>

              {/* Line Items */}
              <Card style={styles.lineItemsCard}>
                <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                  Line Items
                </Typography>
                {/* For fixed price, line items are not editable - price is fixed */}
                <InvoiceLineItems
                  lineItems={lineItems}
                  onChange={isDraft && contract.pricingType !== "fixed" ? setLineItems : undefined}
                  editable={isDraft && contract.pricingType !== "fixed"}
                />
              </Card>

              {/* Invoice Summary - For fixed price, show read-only since price is fixed */}
              <InvoiceSummary
                subtotal={subtotal}
                tax={tax}
                total={total}
                taxRate={taxRate}
                onTaxRateChange={isDraft && contract.pricingType !== "fixed" ? setTaxRate : undefined}
                editable={isDraft && contract.pricingType !== "fixed"}
                style={styles.summary}
              />

              {/* Notes */}
              {(isDraft || notes) && (
                <Card style={styles.notesCard}>
                  <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                    Notes
                  </Typography>
                  {isDraft ? (
                    <View style={styles.notesInput}>
                      <Typography variant="bodySmall" color={colors.gray400}>
                        Notes are AI-generated and editable
                      </Typography>
                    </View>
                  ) : (
                    <Typography variant="bodySmall">{notes}</Typography>
                  )}
                </Card>
              )}

              {/* Deliverables section for Pay Later - only show for hourly (fixed price deliverables set at creation) */}
              {!isPayNow && hasInvoice && contract.pricingType !== "fixed" && (
                <Card style={styles.deliverablesCard}>
                  <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                    Deliverables
                  </Typography>
                  <Typography variant="bodySmall" color={colors.gray500} style={styles.hint}>
                    Add deliverable links to send with your invoice
                  </Typography>
                  <DeliverableLinks
                    contractId={contract._id}
                    deliverables={invoice.deliverables ?? []}
                    editable={isDraft}
                  />
                </Card>
              )}

              {/* Paid State - Show Deliverable Links */}
              {(isPaid || contract.completionPercent >= 100) && contract.deliverables && contract.deliverables.length > 0 && (
                <Card style={styles.deliverableCard}>
                  <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                    Deliverables
                  </Typography>
                  {contract.deliverables?.map((d, i) => (
                    <View key={i} style={styles.deliverableItem}>
                      <Typography variant="bodySmall" color={colors.gray600}>
                        {d.name}
                      </Typography>
                      <Typography variant="bodySmall" color={colors.accent}>
                        {d.url}
                      </Typography>
                    </View>
                  ))}
                </Card>
              )}

              {/* Sent State - Awaiting Payment */}
              {isSent && (
                <Card style={styles.awaitingCard}>
                  <Typography variant="body" color={colors.warning}>
                    Awaiting payment from client
                  </Typography>
                </Card>
              )}

              {/* Draft Actions - For fixed price, only Send Invoice (no Save since nothing editable) */}
              {isDraft && (
                <View style={styles.actions}>
                  {contract.pricingType !== "fixed" && (
                    <Button
                      title="Save Changes"
                      onPress={handleSaveChanges}
                      loading={isUpdating}
                      variant="secondary"
                      style={styles.actionButton}
                    />
                  )}
                  <Button
                    title="Send Invoice"
                    onPress={handleSendInvoice}
                    loading={isSending}
                    variant="primary"
                    style={styles.actionButton}
                  />
                </View>
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
  statusTextBold: {
    fontWeight: "600",
  },
  progressCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  completionBar: {
    marginTop: spacing[3],
  },
  noInvoiceCard: {
    margin: spacing[4],
    alignItems: "center",
  },
  noInvoiceText: {
    textAlign: "center",
    marginBottom: spacing[4],
    color: colors.gray600,
  },
  hint: {
    marginTop: spacing[3],
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
  aiBadge: {
    marginTop: spacing[2],
  },
  lineItemsCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  deliverablesCard: {
    margin: spacing[4],
    padding: spacing[4],
  },
  simpleInvoiceCard: {
    margin: spacing[4],
    padding: spacing[4],
  },
  totalAmount: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
    fontWeight: "600",
  },
  sectionLabel: {
    marginBottom: spacing[3],
  },
  deliverablesHint: {
    marginBottom: spacing[4],
  },
  deliverableItem: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
  notesInput: {
    padding: spacing[3],
    backgroundColor: colors.gray50,
    borderRadius: 8,
  },
  deliverableCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
    backgroundColor: colors.accentLight,
  },
  deliverableLink: {
    marginTop: spacing[2],
  },
  awaitingCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    padding: spacing[4],
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
  submitWorkCard: {
    margin: spacing[4],
    padding: spacing[4],
  },
  submitWorkButton: {
    marginTop: spacing[4],
  },
  createInvoiceButton: {
    marginTop: spacing[4],
  },
});
