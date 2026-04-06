import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Heading, Typography, Screen, Card, Badge } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useContracts } from "@/hooks/use-contracts";

export default function FreelancerContractsScreen() {
  const router = useRouter();
  const { contracts, isLoading } = useContracts();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return colors.success;
      case "pending": return colors.warning;
      case "completed": return colors.primary;
      case "declined": return colors.error;
      default: return colors.gray500;
    }
  };

  const renderContract = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/contracts/${item._id}`)}
      style={styles.contractCard}
    >
      <Card>
        <View style={styles.contractHeader}>
          <Heading level="h3" style={styles.contractTitle}>{item.title}</Heading>
          <Badge 
            label={item.status} 
            color={getStatusColor(item.status)} 
          />
        </View>
        <Typography variant="bodySmall" color={colors.gray600}>
          Client: {item.clientName}
        </Typography>
        <View style={styles.contractDetails}>
          <Typography variant="bodySmall" color={colors.gray500}>
            {item.pricingType === "fixed" ? `$${item.fixedPrice}` : "Hourly"}
          </Typography>
          <Typography variant="bodySmall" color={colors.gray500}>
            {item.completionPercent}% complete
          </Typography>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Contracts",
            headerLargeTitle: true,
          }}
        />
        <Screen style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Contracts",
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push("/contracts/new")}
              style={styles.addButton}
            >
              <Typography variant="body" color={colors.primary}>+ New</Typography>
            </TouchableOpacity>
          ),
        }}
      />
      <Screen style={styles.container}>
        {contracts && contracts.length > 0 ? (
          <FlatList
            data={contracts}
            renderItem={renderContract}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
          />
        ) : (
          <Card style={styles.emptyState}>
            <Heading level="h3">No contracts yet</Heading>
            <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
              Create your first contract to start working
            </Typography>
            <TouchableOpacity 
              onPress={() => router.push("/contracts/new")}
              style={styles.createButton}
            >
              <Typography variant="body" color={colors.white}>Create Contract</Typography>
            </TouchableOpacity>
          </Card>
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
  contractCard: {
    marginBottom: spacing[4],
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  contractTitle: {
    flex: 1,
    marginRight: spacing[2],
  },
  contractDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing[2],
  },
  emptyState: {
    alignItems: "center",
    padding: spacing[8],
    marginTop: spacing[4],
  },
  emptyText: {
    marginTop: spacing[2],
    textAlign: "center",
  },
  addButton: {
    padding: spacing[2],
  },
  createButton: {
    marginTop: spacing[4],
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 8,
  },
});
