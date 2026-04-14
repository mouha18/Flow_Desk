import React from "react";
import { View, StyleSheet, FlatList, Text, RefreshControl, TextInput, TouchableOpacity, StyleProp, ViewStyle, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Typography, Card, SkeletonLoader } from "@/components/ui";
import { ContractCard } from "./ContractCard";
import { useContracts } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Contract, ContractStatus } from "@/types";

type SortOption = "newest" | "oldest" | "price_high" | "price_low" | "status";

interface ContractsListProps {
  style?: StyleProp<ViewStyle>;
  onContractPress?: (contract: Contract) => void;
  viewerRole?: "freelancer" | "client";
  showSearch?: boolean;
  showFilters?: boolean;
  showFab?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export function ContractsList({
  style,
  onContractPress: onContractPressProp,
  viewerRole,
  showSearch = true,
  showFilters = true,
  showFab = false,
  emptyIcon = "📝",
  emptyTitle = "No contracts yet",
  emptySubtitle = "Create your first contract to get started",
}: ContractsListProps) {
  const router = useRouter();
  const { contracts, isLoading, refreshing, refetch } = useContracts();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ContractStatus | "all">("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");

  // Filter contracts based on search and status
  const filteredContracts = (contracts as Contract[]).filter((contract: Contract) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      contract.title.toLowerCase().includes(searchLower) ||
      (contract.clientName ?? contract.clientEmail).toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedContracts = [...filteredContracts].sort((a: Contract, b: Contract) => {
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

  const handleContractPress = (contract: Contract) => {
    if (onContractPressProp) {
      onContractPressProp(contract);
    } else {
      if (viewerRole === "client") {
        router.push(`/(client)/contracts/${contract._id}`);
      } else {
        router.push(`/(freelancer)/contracts/${contract._id}`);
      }
    }
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
        viewerRole={viewerRole}
        freelancerName={viewerRole === "client" ? (contract as any).freelancerName : undefined}
      />
    );
  };

  const handleCreatePress = () => {
    router.push("/(freelancer)/contracts/new");
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{emptyIcon}</Text>
      <Text style={styles.emptyTitle}>{emptyTitle}</Text>
      <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
    </View>
  );

  const renderSkeletonList = () => (
    <View style={styles.skeletonList}>
      <SkeletonLoader height={100} borderRadius={12} style={styles.skeletonCard} />
      <SkeletonLoader height={100} borderRadius={12} style={styles.skeletonCard} />
      <SkeletonLoader height={100} borderRadius={12} style={styles.skeletonCard} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        {renderSkeletonList()}
      </View>
    );
  }

  if ((contracts as Contract[]).length === 0) {
    return (
      <View style={[styles.container, style]}>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contracts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray500}
          />
        </View>
      )}

      {showFilters && (
        <>
          <View style={styles.filterRow}>
            {(["all", "active", "pending", "finished"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                onPress={() => setStatusFilter(status as ContractStatus | "all")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sort:</Text>
            {(["newest", "oldest", "price"] as const).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[styles.sortChip, sortBy === sort && styles.sortChipActive]}
                onPress={() => setSortBy(sort as any)}
              >
                <Text style={[styles.sortChipText, sortBy === sort && styles.sortChipTextActive]}>
                  {sort === "newest" ? "Newest" : sort === "oldest" ? "Oldest" : "Price"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

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
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No contracts found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
          </View>
        }
      />

      {showFab && (
        <Pressable style={styles.fab} onPress={handleCreatePress}>
          <Typography style={styles.fabText}>+</Typography>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  searchContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 16,
    color: colors.gray700,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.gray500,
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: colors.gray500,
    marginRight: 4,
    marginLeft: spacing[4],
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sortChipActive: {
    backgroundColor: colors.freelancer,
    borderColor: colors.freelancer,
  },
  sortChipText: {
    fontSize: 12,
    color: colors.gray500,
  },
  sortChipTextActive: {
    color: "#fff",
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: "center",
  },
  skeletonList: {
    padding: spacing[4],
  },
  skeletonCard: {
    marginBottom: spacing[3],
  },
  fab: {
    position: "absolute",
    right: spacing[6],
    bottom: spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.freelancer,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: "400",
  },
});