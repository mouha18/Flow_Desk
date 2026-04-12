import { View, StyleSheet, FlatList, TouchableOpacity, Text } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Heading, Typography, Screen, Card, SkeletonLoader } from "@/components/ui";
import { ContractCard } from "@/components/contracts/ContractCard";
import { useContracts } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Contract } from "@/types";

export default function ClientDashboardScreen() {
  const router = useRouter();
  const { contracts, isLoading } = useContracts();

  const pendingContracts = (contracts as Contract[]).filter(c => c.status === "pending");
  const activeContracts = (contracts as Contract[]).filter(c => c.status === "active");

  const handleContractPress = (contract: Contract) => {
    router.push(`/(client)/contracts/${contract._id}`);
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
        viewerRole="client"
        freelancerName={contract.freelancerName || undefined}
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
        {isLoading ? (
          <View style={styles.skeletonContent}>
            <View style={styles.statsRow}>
              <SkeletonLoader height={80} borderRadius={12} style={styles.statCardSkeleton} />
              <SkeletonLoader height={80} borderRadius={12} style={styles.statCardSkeleton} />
            </View>
            <SkeletonLoader height={100} borderRadius={12} style={styles.listSkeleton} />
            <SkeletonLoader height={100} borderRadius={12} style={styles.listSkeleton} />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Typography variant="caption" color={colors.gray500}>
                  Active Projects
                </Typography>
                <Heading level="h2" color={colors.client}>
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
            </View>

            {activeContracts.length > 0 && (
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Active Contracts</Text>
                {activeContracts.slice(0, 3).map((contract) => (
                  <TouchableOpacity
                    key={contract._id}
                    style={styles.progressCard}
                    onPress={() => router.push(`/(client)/contracts/${contract._id}`)}
                  >
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTitle} numberOfLines={1}>{contract.title}</Text>
                      <Text style={styles.progressPercent}>{contract.completionPercent}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${contract.completionPercent}%` },
                          contract.completionPercent === 100
                            ? { backgroundColor: colors.success }
                            : { backgroundColor: colors.client }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressClient}>{contract.freelancerName ?? contract.clientEmail}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
                  <Typography style={styles.emptyIconText}>?</Typography>
                </View>
                <Heading level="h3">No projects yet</Heading>
                <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
                  You'll see project invitations from freelancers here
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
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  skeletonContent: {
    flex: 1,
    gap: spacing[4],
  },
  content: {
    flex: 1,
    gap: spacing[4],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[4],
  },
  statCardSkeleton: {
    flex: 1,
  },
  listSkeleton: {
    marginTop: spacing[2],
  },
  statCard: {
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
  // Progress section styles
  progressSection: {
    marginTop: spacing[6],
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressClient: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
