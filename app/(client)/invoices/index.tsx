import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Typography, Card, Heading, Screen, Badge, Icon } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function ClientInvoicesScreen() {
  const router = useRouter();
  const invoices = useQuery(api.invoices.listByClient);

  const totalPaid = (invoices ?? [])
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Invoices",
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/(client)/notifications")}>
              <Icon name="bell" size="sm" color={colors.gray600} />
            </TouchableOpacity>
          ),
        }}
      />
      <Screen style={styles.container} scrollable={false}>
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
                <View style={styles.invoiceLabelRow}>
                  <Icon name="receipt" size="xs" color={colors.gray400} />
                  <Typography variant="bodySmall" color={colors.gray500}>
                    Invoice
                  </Typography>
                </View>
                <Badge
                  label="Paid"
                  variant="success"
                />
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
              <Icon name="credit-card" size="xl" color={colors.gray300} style={styles.emptyIcon} />
              <Typography variant="body" color={colors.gray500}>
                No paid services yet
              </Typography>
            </Card>
          }
        />
      </Screen>
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
  invoiceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  emptyCard: {
    alignItems: "center",
    padding: spacing[8],
  },
  emptyIcon: {
    marginBottom: spacing[3],
  },
});
