import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Typography, Screen, Card, Button } from "@/components/ui";
import { CompletionBar } from "@/components/tasks/CompletionBar";
import { useContractById } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Id } from "@/convex/_generated/dataModel";

export default function FreelancerContractDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = id as Id<"contracts"> | undefined;
  const { contract, isLoading } = useContractById(contractId);
  const { tasks } = useTasks(contractId);

  // Calculate completion percentage from tasks
  const taskList = (tasks ?? []) as any[];
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t: any) => t.status === "completed").length;
  const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  useEffect(() => {
    if (contract) {
      // Contract loaded
    }
  }, [contract]);

  const handleTasksPress = () => {
    if (contractId) {
      router.push(`/(freelancer)/contracts/${contractId}/tasks`);
    }
  };

  const handleChatPress = () => {
    if (contractId) {
      router.push(`/(freelancer)/chat/${contractId}`);
    }
  };

  const handleInvoicePress = () => {
    if (contractId) {
      router.push(`/(freelancer)/contracts/${contractId}/invoice`);
    }
  };

  // Show invoice button when contract is active and 100% complete
  const showInvoiceButton = contract?.status === "active" && completionPercent === 100;

  // Show complete & deliver button when escrow is held and all tasks are complete
  const showCompleteButton = contract?.escrowStatus === "held" && completionPercent === 100;

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
                    : colors.gray500
                }
              >
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Typography>
            </View>
          </Card>

          <Card style={styles.detailsCard}>
            <Typography variant="label" color={colors.gray500}>
              Client
            </Typography>
            <Typography variant="body" style={styles.detailValue}>
              {contract.clientDisplayName || contract.clientName || contract.clientPseudo || contract.clientEmail}
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

          <View style={styles.actions}>
            <Button
              title="View Tasks"
              variant="secondary"
              onPress={handleTasksPress}
              style={styles.actionButton}
            />
            <Button
              title="Open Chat"
              variant="primary"
              onPress={handleChatPress}
              style={styles.actionButton}
            />
            {showInvoiceButton && (
              <Button
                title="Generate / View Invoice"
                variant="primary"
                onPress={handleInvoicePress}
                style={styles.actionButton}
              />
            )}
            {showCompleteButton && (
              <Button
                title="Complete & Deliver"
                variant="primary"
                onPress={() => router.push(`/(freelancer)/contracts/${contractId}/complete`)}
                style={styles.fullButton}
              />
            )}
          </View>
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
    width: '100%',
  },
});
