import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { Heading, Typography, Screen, Card } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function ClientDashboardScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerLargeTitle: true,
        }}
      />
      <Screen style={styles.container}>
        <View style={styles.content}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Typography variant="caption" color={colors.gray500}>
                Active Projects
              </Typography>
              <Heading level="h2" color={colors.client}>
                0
              </Heading>
            </Card>
            <Card style={styles.statCard}>
              <Typography variant="caption" color={colors.gray500}>
                Pending
              </Typography>
              <Heading level="h2" color={colors.warning}>
                0
              </Heading>
            </Card>
          </View>

          <Card style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Typography style={styles.emptyIconText}>?</Typography>
            </View>
            <Heading level="h3">No projects yet</Heading>
            <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
              You'll see project invitations from freelancers here
            </Typography>
          </Card>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  content: {
    flex: 1,
    gap: spacing[4],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: "center",
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
  emptyIconText: {
    fontSize: 32,
    color: colors.gray400,
  },
  emptyText: {
    marginTop: spacing[2],
    textAlign: "center",
  },
});
