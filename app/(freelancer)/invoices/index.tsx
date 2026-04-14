import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Typography, Card, Heading, Screen, Badge, Icon } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function FreelancerInvoicesScreen() {
  const router = useRouter();
  const invoices = useQuery(api.invoices.listByFreelancer);
  const earnings = useQuery(api.invoices.getFreelancerEarnings);

  const totalPaidCount = (invoices ?? []).filter(inv => inv.status === "paid").length;

  const renderHeader = () => (
    <Card style={styles.summaryCard}>
      <Typography variant="caption" color={colors.gray500}>
        Total Earnings
      </Typography>
      <Heading level="h1" color={colors.freelancer}>
        ${earnings?.totalEarnings?.toFixed(2) || "0.00"}
      </Heading>
      <Typography variant="bodySmall" color={colors.gray500}>
        {totalPaidCount} payment{totalPaidCount !== 1 ? "s" : ""} received
      </Typography>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Invoices",
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/(freelancer)/notifications")}>
              <Icon name="bell" size="sm" color={colors.gray600} />
            </TouchableOpacity>
          ),
        }}
      />
      <Screen style={styles.container} scrollable={false}>
        {renderHeader()}
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
                  label={item.status === "paid" ? "Paid" : item.status}
                  variant={item.status === "paid" ? "success" : "warning"}
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
              <Icon name="wallet" size="xl" color={colors.gray300} style={styles.emptyIcon} />
              <Typography variant="body" color={colors.gray500}>
                No earnings yet
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
