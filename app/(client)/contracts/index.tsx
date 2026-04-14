import React from "react";
import { View, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Typography, SkeletonLoader, Icon } from "@/components/ui";
import { ContractCard } from "@/components/contracts/ContractCard";
import { useContracts } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { Bell, Search as SearchIcon } from "lucide-react-native";
import type { Contract, ContractStatus } from "@/types";

type SortOption = "newest" | "oldest" | "price_high" | "price_low" | "status";

export default function ClientContractsScreen() {
  const router = useRouter();
  const { contracts, isLoading, refreshing, refetch } = useContracts();
  const notificationUnreadCount = useQuery(api.notifications.unreadCount) ?? 0;
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ContractStatus | "all">("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");

  // Filter contracts based on search and status
  const filteredContracts = (contracts as Contract[]).filter((contract) => {
    const matchesSearch =
      searchQuery === "" ||
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((contract as any).freelancerDisplayName ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedContracts = [...filteredContracts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b._creationTime - a._creationTime;
      case "oldest":
        return a._creationTime - b._creationTime;
      case "price_high":
        return (b.fixedPrice ?? b.hourlyRate ?? 0) - (a.fixedPrice ?? a.hourlyRate ?? 0);
      case "price_low":
        return (a.fixedPrice ?? a.hourlyRate ?? 0) - (b.fixedPrice ?? b.hourlyRate ?? 0);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // Helper to calculate completion for a contract
  const handleContractPress = (contract: Contract) => {
    router.push(`/(client)/contracts/${contract._id}` as any);
  };

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
        freelancerName={(contract as any).freelancerDisplayName || undefined}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="handshake" size="xl" color={colors.gray300} />
      </View>
      <Typography variant="body" style={styles.emptyTitle}>No contracts yet</Typography>
      <Typography variant="bodySmall" color={colors.gray500} style={styles.emptySubtitle}>
        Contracts you accept will appear here
      </Typography>
    </View>
  );

  const renderSkeletonList = () => (
    <View style={styles.skeletonList}>
      <SkeletonLoader height={100} borderRadius={12} style={styles.skeletonCard} />
      <SkeletonLoader height={100} borderRadius={12} style={styles.skeletonCard} />
      <SkeletonLoader height={100} borderRadius={12} style={styles.skeletonCard} />
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Contracts",
          headerLargeTitle: true,
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
      <View style={styles.container}>
        {isLoading ? (
          renderSkeletonList()
        ) : (contracts as Contract[]).length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.searchContainer}>
              <SearchIcon size={18} color={colors.gray400} strokeWidth={2} style={{ marginRight: 8 } as any} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contracts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.gray500}
              />
            </View>
            <View style={styles.filterRow}>
              {(["all", "active", "pending", "finished", "declined", "disputed"] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                  onPress={() => setStatusFilter(status as ContractStatus | "all")}
                >
                  <Typography
                    variant="bodySmall"
                    color={statusFilter === status ? colors.white : colors.gray600}
                    style={statusFilter === status ? styles.filterChipTextActive : undefined}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sortRow}>
              <Typography variant="bodySmall" color={colors.gray500} style={styles.sortLabel}>Sort:</Typography>
              {(["newest", "oldest", "price"] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[styles.sortChip, sortBy === sort && styles.sortChipActive]}
                  onPress={() => setSortBy(sort as any)}
                >
                  <Typography
                    variant="caption"
                    color={sortBy === sort ? colors.white : colors.gray500}
                    style={sortBy === sort ? styles.sortChipTextActive : undefined}
                  >
                    {sort === "newest" ? "Newest" : sort === "oldest" ? "Oldest" : "Price"}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
            <FlatList
              data={sortedContracts}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <ContractCardWithCompletion contract={item} />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refetch}
                  tintColor={colors.accent}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Icon name="search" size="xl" color={colors.gray300} />
                  </View>
                  <Typography variant="body" style={styles.emptyTitle}>No contracts found</Typography>
                  <Typography variant="bodySmall" color={colors.gray500} style={styles.emptySubtitle}>
                    Try adjusting your search or filter
                  </Typography>
                </View>
              }
            />
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  searchContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    fontSize: 16,
    color: colors.gray700,
    flex: 1,
  },
  filterRow: {
    flexDirection: "row",
    marginHorizontal: spacing[4],
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipTextActive: {
    fontWeight: "600",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sortLabel: {
    marginRight: 4,
    marginLeft: spacing[4],
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sortChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sortChipTextActive: {
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: 100,
  },
  card: {
    marginBottom: spacing[3],
  },
  emptyState: {
    alignItems: "center",
    padding: spacing[10],
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    textAlign: "center",
  },
  skeletonList: {
    padding: spacing[4],
  },
  skeletonCard: {
    marginBottom: spacing[3],
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
});
