import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Heading, Typography, Screen, Card } from "@/components/ui";
import { ContractCard } from "@/components/contracts/ContractCard";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useContracts } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import type { Contract } from "@/types";

export default function FreelancerContractsScreen() {
  const router = useRouter();
  const { contracts, isLoading } = useContracts();

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

  const handleCreatePress = () => {
    router.push("/(freelancer)/contracts/new");
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyState}>
      <Heading level="h3">No contracts yet</Heading>
      <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
        Create your first contract to start working
      </Typography>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Contracts",
          headerLargeTitle: true,
        }}
      />
      <Screen style={styles.container} scrollable={false}>
        {isLoading ? (
          <Card style={styles.loadingState}>
            <Typography variant="bodySmall" color={colors.gray500}>
              Loading contracts...
            </Typography>
          </Card>
        ) : contracts.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={contracts as Contract[]}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ContractCardWithCompletion contract={item} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {/* Floating Action Button */}
        <Pressable style={styles.fab} onPress={handleCreatePress}>
          <Typography style={styles.fabText}>+</Typography>
        </Pressable>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  list: {
    padding: spacing[4],
    paddingBottom: 100,
  },
  card: {
    marginBottom: spacing[3],
  },
  emptyState: {
    alignItems: "center",
    padding: spacing[8],
    marginTop: spacing[4],
  },
  loadingState: {
    alignItems: "center",
    padding: spacing[8],
    marginTop: spacing[4],
  },
  emptyText: {
    marginTop: spacing[2],
    textAlign: "center",
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "400",
    marginTop: -2,
  },
});
