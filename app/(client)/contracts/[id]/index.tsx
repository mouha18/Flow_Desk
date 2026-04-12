import { StyleSheet, View, ScrollView, Alert, Pressable, Text, Linking } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Typography, Screen, Card, Button, Input, Heading } from "@/components/ui";
import { CompletionBar } from "@/components/tasks/CompletionBar";
import { useContractById, useContracts } from "@/hooks/useContracts";
import { useInvoice } from "@/hooks/useInvoice";
import { useTasks } from "@/hooks/useTasks";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Id } from "@/convex/_generated/dataModel";

export default function ClientContractDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = id as Id<"contracts"> | undefined;
  const { contract, isLoading } = useContractById(contractId);
  const { acceptContract, declineContract } = useContracts();
  const { tasks } = useTasks(contractId);
  const { invoice } = useInvoice(contractId);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [complaint, setComplaint] = useState("");
  const disputeDelivery = useMutation(api.contracts.disputeDelivery);
  const approveDelivery = useMutation(api.contracts.approveDelivery);

  const handleApprove = async () => {
    if (!contractId) return;
    try {
      await approveDelivery({ contractId });
    } catch (error) {
      Alert.alert("Error", "Failed to approve delivery");
    }
  };

  // Fetch freelancer info using the freelancerId from contract
  const freelancer = useQuery(
    api.users.getUserById,
    contract?.freelancerId ? { userId: contract.freelancerId as Id<"users"> } : "skip"
  );

  // Calculate completion percentage from tasks
  const taskList = (tasks ?? []) as any[];
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t: any) => t.status === "completed").length;
  const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAccept = async () => {
    if (!contractId) return;
    try {
      await acceptContract({ contractId });
      
      // Redirect to invoice page for payment
      router.push(`/(client)/contracts/${contractId}/invoice`);
    } catch (error) {
      Alert.alert("Error", "Failed to accept contract");
    }
  };

  const handleDecline = async () => {
    if (!contractId) return;
    Alert.alert(
      "Decline Contract",
      "Are you sure you want to decline this contract?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await declineContract({ contractId });
            } catch (error) {
              Alert.alert("Error", "Failed to decline contract");
            }
          },
        },
      ]
    );
  };

  const handleDispute = async () => {
    if (!contractId) return;
    if (!complaint.trim()) {
      Alert.alert("Error", "Please describe your issue");
      return;
    }
    try {
      await disputeDelivery({ contractId, complaint });
      setShowDisputeForm(false);
      setComplaint("");
    } catch (error) {
      Alert.alert("Error", "Failed to submit dispute");
    }
  };

  const handleChatPress = () => {
    if (contractId) {
      router.push(`/(client)/chat/${contractId}`);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Contract" }} />
        <Screen style={styles.container}>
          <Card style={styles.loadingCard}>
            <Typography variant="bodySmall" color={colors.gray500}>
              Loading contract...
            </Typography>
          </Card>
        </Screen>
      </>
    );
  }

  if (!contract) {
    return (
      <>
        <Stack.Screen options={{ title: "Contract" }} />
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

  return (
    <>
      <Stack.Screen
        options={{
          title: contract.title,
          headerLargeTitle: false,
        }}
      />
      <Screen style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Typography variant="label" color={colors.gray500}>
                Status
              </Typography>
              <Typography
                variant="body"
                color={
                  contract.status === "active"
                    ? colors.success
                    : contract.status === "pending"
                    ? colors.warning
                    : contract.status === "declined"
                    ? colors.error
                    : colors.gray500
                }
              >
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Typography>
            </View>
          </Card>

          <Card style={styles.detailsCard}>
            <Typography variant="label" color={colors.gray500}>
              Freelancer
            </Typography>
            <Typography variant="body" style={styles.detailValue}>
              {freelancer?.name || "Loading..."}
            </Typography>

            <Typography variant="label" color={colors.gray500} style={styles.detailLabel}>
              Pricing
            </Typography>
            <Typography variant="body" style={styles.detailValue}>
              {contract.pricingType === "fixed"
                ? `Fixed Price: ${contract.fixedPrice?.toFixed(2) || "0.00"}`
                : `Hourly Rate: ${contract.hourlyRate != null ? contract.hourlyRate.toFixed(2) : "0.00"}/hr`}
            </Typography>

            <Typography variant="label" color={colors.gray500} style={styles.detailLabel}>
              Payment Method
            </Typography>
            <Typography variant="body" style={styles.detailValue}>
              {contract.paymentMethod === "stripe"
                ? "Stripe"
                : contract.paymentMethod === "naboo_orange"
                ? "Naboo Orange"
                : "Naboo Wave"}
            </Typography>
          </Card>

          <Card style={styles.progressCard}>
            <Typography variant="label" color={colors.gray500}>
              Progress
            </Typography>
            <CompletionBar percent={completionPercent} style={styles.completionBar} />
          </Card>

          {contract.status === "pending" && (
            <View style={styles.actions}>
              <Button
                title="Decline"
                variant="outline"
                onPress={handleDecline}
                style={styles.actionButton}
              />
              <Button
                title="Accept & Pay"
                variant="primary"
                onPress={handleAccept}
                style={styles.actionButton}
              />
            </View>
          )}

          {contract.status === "active" && (
            <View style={styles.actions}>
              <Button
                title="Open Chat"
                variant="primary"
                onPress={handleChatPress}
                style={styles.fullButton}
              />
              {invoice?.status === "sent" && (
                <Button
                  title="Pay Invoice"
                  variant="primary"
                  onPress={() => router.push(`/(client)/contracts/${contractId}/invoice`)}
                  style={styles.fullButton}
                />
              )}
            </View>
          )}

          {contract.escrowStatus === "delivered" && (
            <Card style={styles.deliveryCard}>
              <Heading level="h3">Work Delivered! 🎉</Heading>
              <Typography variant="body" color={colors.gray500}>
                Your freelancer has submitted the work.
              </Typography>

              {contract.deliverables && contract.deliverables.length > 0 && (
                <View style={styles.deliverablesSection}>
                  <Typography variant="label" style={styles.deliverablesLabel}>
                    Deliverables:
                  </Typography>
                  {contract.deliverables.map((d: any, i: number) => (
                    <Pressable key={i} onPress={() => Linking.openURL(d.url)}>
                      <Text style={styles.deliverableLink}>{d.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {!showDisputeForm ? (
                <View style={styles.approvalButtons}>
                  <Button
                    title="Pas satisfait du service"
                    variant="outline"
                    onPress={() => setShowDisputeForm(true)}
                    style={styles.halfButton}
                  />
                  <Button
                    title="Satisfait du service"
                    variant="primary"
                    onPress={() => handleApprove()}
                    style={styles.halfButton}
                  />
                </View>
              ) : (
                <View style={styles.disputeForm}>
                  <Input
                    label="Describe your issue"
                    value={complaint}
                    onChangeText={setComplaint}
                    multiline
                  />
                  <View style={styles.disputeButtons}>
                    <Button
                      title="Cancel"
                      variant="outline"
                      onPress={() => {
                        setShowDisputeForm(false);
                        setComplaint("");
                      }}
                    />
                    <Button
                      title="Submit Complaint"
                      variant="primary"
                      onPress={handleDispute}
                    />
                  </View>
                </View>
              )}
            </Card>
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
  statusCard: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  detailLabel: {
    marginTop: spacing[4],
  },
  detailValue: {
    marginTop: spacing[1],
  },
  progressCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  completionBar: {
    marginTop: spacing[3],
  },
  actions: {
    flexDirection: "row",
    padding: spacing[4],
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
  fullButton: {
    flex: 1,
  },
  deliveryCard: {
    margin: spacing[4],
    padding: spacing[4],
  },
  deliverablesSection: {
    marginTop: spacing[4],
  },
  deliverablesLabel: {
    marginBottom: spacing[2],
  },
  deliverableLink: {
    color: colors.primary,
    textDecorationLine: "underline",
    marginTop: spacing[1],
  },
  approvalButtons: {
    flexDirection: "row",
    marginTop: spacing[4],
    gap: spacing[3],
  },
  halfButton: {
    flex: 1,
  },
  disputeForm: {
    marginTop: spacing[4],
  },
  disputeButtons: {
    flexDirection: "row",
    marginTop: spacing[3],
    gap: spacing[3],
  },
});
