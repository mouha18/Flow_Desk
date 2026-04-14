import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Heading, Typography, Screen, Card, SkeletonLoader } from "@/components/ui";
import { ContractCard } from "@/components/contracts/ContractCard";
import { useContracts } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { Bell, FileText as FileTextIcon, Clock, CheckCircle } from "lucide-react-native";
import type { Contract } from "@/types";

export default function ClientDashboardScreen() {
  const router = useRouter();
  const { contracts, isLoading } = useContracts();
  const notificationUnreadCount = useQuery(api.notifications.unreadCount) ?? 0;

  const pendingContracts = (contracts as Contract[]).filter(c => c.status === "pending");
  const activeContracts = (contracts as Contract[]).filter(c => c.status === "active");
  const finishedContracts = (contracts as Contract[]).filter(c => c.status === "finished");

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
        freelancerName={contract.freelancerDisplayName || undefined}
      />
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/(client)/notifications" as any)}
              style={{ marginRight: 16, padding: 4, position: "relative" }}
            >
              <Bell size={22} color={colors.gray700} strokeWidth={2} />
              {notificationUnreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Typography variant="caption" color={colors.white} style={styles.bellBadgeText}>
                    {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          ),
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
              <TouchableOpacity
                style={styles.statCardTouchable}
                onPress={() => router.push("/(client)/contracts" as any)}
              >
                <Card style={styles.statCard}>
                  <View style={styles.statCardContent}>
                    <View style={[styles.statIconCircle, { backgroundColor: colors.clientLight }]}>
                      <FileTextIcon size={18} color={colors.client} strokeWidth={2} />
                    </View>
                    <View style={styles.statCardText}>
                      <Typography variant="caption" color={colors.gray500}>
                        Active Contracts
                      </Typography>
                      <Heading level="h3" color={colors.client}>
                        {activeContracts.length}
                      </Heading>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCardTouchable}
                onPress={() => router.push("/(client)/contracts" as any)}
              >
                <Card style={styles.statCard}>
                  <View style={styles.statCardContent}>
                    <View style={[styles.statIconCircle, { backgroundColor: colors.warningLight }]}>
                      <Clock size={18} color={colors.warning} strokeWidth={2} />
                    </View>
                    <View style={styles.statCardText}>
                      <Typography variant="caption" color={colors.gray500}>
                        Pending
                      </Typography>
                      <Heading level="h3" color={colors.warning}>
                        {pendingContracts.length}
                      </Heading>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCardTouchable}
                onPress={() => router.push("/(client)/invoices" as any)}
              >
                <Card style={styles.statCard}>
                  <View style={styles.statCardContent}>
                    <View style={[styles.statIconCircle, { backgroundColor: colors.successLight }]}>
                      <CheckCircle size={18} color={colors.success} strokeWidth={2} />
                    </View>
                    <View style={styles.statCardText}>
                      <Typography variant="caption" color={colors.gray500}>
                        Finished
                      </Typography>
                      <Heading level="h3" color={colors.success}>
                        {finishedContracts.length}
                      </Heading>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>

            {activeContracts.length > 0 && (
              <View style={styles.progressSection}>
                <Heading level="h4" style={styles.sectionTitle}>Active Contracts</Heading>
                {activeContracts.slice(0, 3).map((contract) => (
                  <TouchableOpacity
                    key={contract._id}
                    style={styles.progressCard}
                    onPress={() => router.push(`/(client)/contracts/${contract._id}`)}
                  >
                    <View style={styles.progressHeader}>
                      <Typography variant="bodySmall" color={colors.gray700} style={styles.progressTitle} numberOfLines={1}>
                        {contract.title}
                      </Typography>
                      <Typography variant="bodySmall" color={colors.primary} style={styles.progressPercent}>
                        {contract.completionPercent}%
                      </Typography>
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
                    <Typography variant="caption" color={colors.gray500}>
                      {contract.freelancerDisplayName ?? "Freelancer"}
                    </Typography>
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
                  <FileTextIcon size={32} color={colors.gray400} strokeWidth={2} />
                </View>
                <Heading level="h3">No contracts yet</Heading>
                <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
                  You'll see contract invitations from freelancers here
                </Typography>
              </Card>
            ) : activeContracts.length > 0 ? (
              <View style={styles.section}>
                <Heading level="h4" style={styles.sectionTitle}>
                  Active Contracts
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
    flexDirection: "column",
    gap: spacing[3],
  },
  statCardTouchable: {
    width: "100%",
  },
  statCard: {
    width: "100%",
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  statCardText: {
    flex: 1,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "700",
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
  emptyText: {
    marginTop: spacing[2],
    textAlign: "center",
  },
  // Progress section styles
  progressSection: {
    marginTop: spacing[4],
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: spacing[3],
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  progressTitle: {
    fontWeight: "600",
    flex: 1,
    marginRight: spacing[2],
  },
  progressPercent: {
    fontWeight: "700",
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing[1],
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
