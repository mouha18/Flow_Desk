import { View, StyleSheet, FlatList, Text } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Typography, Card, Heading } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function ClientInvoicesScreen() {
  const invoices = useQuery(api.invoices.listByClient);

  const totalPaid = (invoices ?? [])
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  return (
    <>
      <Stack.Screen options={{ title: "My Services", headerLargeTitle: true }} />
      <View style={styles.container}>
        <Card style={styles.summaryCard}>
          <Typography variant="caption" color={colors.gray500}>
            Total Paid
          </Typography>
          <Heading level="h1" color={colors.client}>
            ${totalPaid.toFixed(2)}
          </Heading>
          <Typography variant="bodySmall" color={colors.gray500}>
            {(invoices ?? []).length} service{invoices && invoices.length !== 1 ? "s" : ""} paid
          </Typography>
        </Card>


        <FlatList
          data={invoices}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <Typography variant="body" style={styles.contractTitle}>
                  {item.contractId.slice(0, 8)}...
                </Typography>
                <View style={[styles.statusBadge, { backgroundColor: colors.success + "20" }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>Paid</Text>
                </View>
              </View>
              <Heading level="h3" color={colors.gray900}>
                ${item.total?.toFixed(2) || "0.00"}
              </Heading>
              <Typography variant="bodySmall" color={colors.gray500}>
                {item.status === "paid" && item.paymentSimulated ? "Payment simulated" : ""}
              </Typography>
            </Card>
          )}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Typography variant="body" color={colors.gray500}>
                No paid services yet
              </Typography>
            </Card>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  summaryCard: {
    margin: spacing[4],
    alignItems: "center",
    paddingVertical: spacing[6],
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  invoiceCard: {
    marginBottom: spacing[2],
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  contractTitle: {
    color: colors.gray500,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    padding: spacing[8],
  },
});
