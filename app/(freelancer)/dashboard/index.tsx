import { View, StyleSheet, FlatList } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Heading, Typography, Screen, Card } from "@/components/ui";
import { ContractCard } from "@/components/contracts/ContractCard";
import { useContracts } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { useFreelancerEarnings } from "@/hooks/useInvoice";
import { formatCurrency } from "@/lib/formatting";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Contract } from "@/types";

export default function FreelancerDashboardScreen() {
  const router = useRouter();
  const { contracts, isLoading } = useContracts();
  const { totalEarnings, paidInvoicesCount, isLoading: earningsLoading } = useFreelancerEarnings();

  const pendingContracts = (contracts as Contract[]).filter(c => c.status === "pending");
  const activeContracts = (contracts as Contract[]).filter(c => c.status === "active");

  const handleContractPress = (contract: Contract) => {
    router.push(`/(freelancer)/contracts/${contract._id}`);
  };

  // Helper component to calculate completion per contract
  const ContractCardWithCompletion = ({ contract }: { contract: Contract }) => {
    const { tasks } = useTasks(contract._id as any);
    const taskList = (tasks ?? []) as any[];
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter((t: any) => t.status === "completed").length;
    const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return (
      <ContractCard
        contract={contract}
        onPress={handleContractPress}
        style={styles.card}
        completionPercent={completionPercent}
      />
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerLargeTitle: true,
        }}
      />
      <Screen style={styles.container} scrollable={false}>
        <View style={styles.content}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Typography variant="caption" color={colors.gray500}>
                Active Contracts
              </Typography>
              <Heading level="h2" color={colors.freelancer}>
                {activeContracts.length}
              </Heading>
            </Card>
            <Card style={styles.statCard}>
              <Typography variant="caption" color={colors.gray500}>
                Pending
              </Typography>
              <Heading level="h2" color={colors.warning}>
                {pendingContracts.length}
              </Heading>
            </Card>
            <Card style={styles.earningsCard}>
              <Typography variant="caption" color={colors.gray500}>
                Total Earnings
              </Typography>
              <Heading level="h2" color={colors.success}>
                {formatCurrency(totalEarnings, "USD")}
              </Heading>
              <Typography variant="bodySmall" color={colors.gray500}>
                {paidInvoicesCount} paid invoice{paidInvoicesCount !== 1 ? "s" : ""}
              </Typography>
            </Card>
          </View>

          {pendingContracts.length > 0 && (
            <View style={styles.section}>
              <Heading level="h4" style={styles.sectionTitle}>
                Pending Contracts
              </Heading>
              <FlatList
                data={pendingContracts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <ContractCardWithCompletion contract={item} />
                )}
                scrollEnabled={false}
              />
            </View>
          )}

          {contracts.length === 0 ? (
            <Card style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Typography style={styles.emptyIconText}>+</Typography>
              </View>
              <Heading level="h3">No contracts yet</Heading>
              <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
                Create your first contract to start working with clients
              </Typography>
            </Card>
          ) : activeContracts.length > 0 ? (
            <View style={styles.section}>
              <Heading level="h4" style={styles.sectionTitle}>
                Active Projects
              </Heading>
              <FlatList
                data={activeContracts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <ContractCardWithCompletion contract={item} />
                )}
                scrollEnabled={false}
              />
            </View>
          ) : null}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  content: {
    flex: 1,
    gap: spacing[4],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  earningsCard: {
    flex: 1,
    alignItems: "center",
  },
  section: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    marginBottom: spacing[3],
    marginLeft: spacing[1],
  },
  card: {
    marginBottom: spacing[3],
  },
  emptyState: {
    alignItems: "center",
    padding: spacing[8],
    marginTop: spacing[4],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  emptyIconText: {
    fontSize: 32,
    color: colors.gray400,
  },
  emptyText: {
    marginTop: spacing[2],
    textAlign: "center",
  },
});
