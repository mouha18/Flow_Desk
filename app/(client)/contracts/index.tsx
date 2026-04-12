import { View, StyleSheet, FlatList } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Heading, Typography, Screen, Card } from "@/components/ui";
import { ContractCard } from "@/components/contracts/ContractCard";
import { useContracts } from "@/hooks/useContracts";
import { useTasks } from "@/hooks/useTasks";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Contract } from "@/types";

export default function ClientContractsScreen() {
  const router = useRouter();
  const { contracts, isLoading } = useContracts();

  const handleContractPress = (contract: Contract) => {
    router.push(`/(client)/contracts/${contract._id}`);
  };

  // Helper to calculate completion for a contract
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

  const renderEmptyState = () => (
    <Card style={styles.emptyState}>
      <Heading level="h3">No contracts yet</Heading>
      <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
        You'll see your project contracts here
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
        ) : (contracts as Contract[]).length === 0 ? (
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
});
