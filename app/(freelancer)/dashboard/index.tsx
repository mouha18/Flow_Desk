import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Heading, Typography, Screen, Card, SkeletonLoader } from "@/components/ui";
import { ContractCard } from "@/components/contracts/ContractCard";
import { useContracts } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { useFreelancerEarnings } from "@/hooks/useInvoice";
import { formatCurrency } from "@/lib/formatting";
import { colors } from "@/constants/colors";
import { spacing, borderRadius } from "@/constants/spacing";
import { Bell, Plus, TrendingUp, Clock, FileText as FileTextIcon, CheckCircle } from "lucide-react-native";
import type { Contract } from "@/types";

export default function FreelancerDashboardScreen() {
  const router = useRouter();
  const { contracts, isLoading } = useContracts();
  const { totalEarnings, paidInvoicesCount, isLoading: earningsLoading } = useFreelancerEarnings();
  const notificationUnreadCount = useQuery(api.notifications.unreadCount) ?? 0;

  const pendingContracts = (contracts as Contract[]).filter(c => c.status === "pending");
  const activeContracts = (contracts as Contract[]).filter(c => c.status === "active");
  const finishedContracts = (contracts as Contract[]).filter(c => c.status === "finished");

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

  const isDataLoading = isLoading || earningsLoading;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/(freelancer)/notifications" as any)}
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
        {isDataLoading ? (
          <View style={styles.skeletonContent}>
            <View style={styles.statsRow}>
              <SkeletonLoader height={80} borderRadius={12} style={styles.statCardSkeleton} />
              <SkeletonLoader height={80} borderRadius={12} style={styles.statCardSkeleton} />
              <SkeletonLoader height={80} borderRadius={12} style={styles.earningsCardSkeleton} />
            </View>
            <SkeletonLoader height={100} borderRadius={12} style={styles.listSkeleton} />
            <SkeletonLoader height={100} borderRadius={12} style={styles.listSkeleton} />
          </View>
        ) : (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push("/(freelancer)/contracts/new" as any)}
            >
              <Plus size={18} color={colors.white} strokeWidth={2.5} />
              <Typography variant="bodySmall" color={colors.white} style={{ fontWeight: "600" }}>
                New Contract
              </Typography>
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.statsRowInner}>
                <TouchableOpacity
                  style={styles.statCardTouchableHalf}
                  onPress={() => router.push("/(freelancer)/contracts" as any)}
                >
                  <Card style={styles.statCardHalf}>
                    <View style={styles.statCardContent}>
                      <View style={[styles.statIconCircle, { backgroundColor: colors.freelancerLight }]}>
                        <FileTextIcon size={16} color={colors.freelancer} strokeWidth={2} />
                      </View>
                      <View style={styles.statCardText}>
                        <Typography variant="caption" color={colors.gray500}>Active</Typography>
                        <Heading level="h3" color={colors.freelancer}>{activeContracts.length}</Heading>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statCardTouchableHalf}
                  onPress={() => router.push("/(freelancer)/contracts" as any)}
                >
                  <Card style={styles.statCardHalf}>
                    <View style={styles.statCardContent}>
                      <View style={[styles.statIconCircle, { backgroundColor: colors.warningLight }]}>
                        <Clock size={16} color={colors.warning} strokeWidth={2} />
                      </View>
                      <View style={styles.statCardText}>
                        <Typography variant="caption" color={colors.gray500}>Pending</Typography>
                        <Heading level="h3" color={colors.warning}>{pendingContracts.length}</Heading>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
              <View style={styles.statsRowInner}>
                <TouchableOpacity
                  style={styles.statCardTouchableHalf}
                  onPress={() => router.push("/(freelancer)/contracts" as any)}
                >
                  <Card style={styles.statCardHalf}>
                    <View style={styles.statCardContent}>
                      <View style={[styles.statIconCircle, { backgroundColor: colors.successLight }]}>
                        <CheckCircle size={16} color={colors.success} strokeWidth={2} />
                      </View>
                      <View style={styles.statCardText}>
                        <Typography variant="caption" color={colors.gray500}>Finished</Typography>
                        <Heading level="h3" color={colors.success}>{finishedContracts.length}</Heading>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statCardTouchableHalf}
                  onPress={() => router.push("/(freelancer)/invoices" as any)}
                >
                  <Card style={styles.earningsCardHalf}>
                    <View style={styles.statCardContent}>
                      <View style={[styles.statIconCircle, { backgroundColor: colors.secondaryLightBg }]}>
                        <TrendingUp size={16} color={colors.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.statCardText}>
                        <Typography variant="caption" color={colors.gray500}>Total Earnings</Typography>
                        <Heading level="h3" color={colors.success}>{formatCurrency(totalEarnings, "USD")}</Heading>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
            </View>

            {activeContracts.length > 0 && (
              <View style={styles.progressSection}>
                <Heading level="h4" style={styles.sectionTitle}>Active Contracts</Heading>
                {activeContracts.slice(0, 3).map((contract) => (
                  <TouchableOpacity
                    key={contract._id}
                    style={styles.progressCard}
                    onPress={() => router.push(`/(freelancer)/contracts/${contract._id}`)}
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
                            : { backgroundColor: colors.freelancer }
                        ]}
                      />
                    </View>
                    <Typography variant="caption" color={colors.gray500}>
                      {contract.clientDisplayName ?? contract.clientEmail ?? "Client"}
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
                  <Plus size={32} color={colors.gray400} strokeWidth={2} />
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
  earningsCard: {
    width: "100%",
  },
  statsRowInner: {
    flexDirection: "row",
    gap: spacing[3],
  },
  statCardTouchableHalf: {
    flex: 1,
  },
  statCardHalf: {
    width: "100%",
  },
  earningsCardHalf: {
    flex: 1,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  statCardText: {
    flex: 1,
  },
  statCardSkeleton: {
    width: "100%",
  },
  earningsCardSkeleton: {
    width: "100%",
  },
  listSkeleton: {
    marginTop: spacing[2],
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
    alignSelf: "flex-start",
    marginBottom: spacing[2],
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
