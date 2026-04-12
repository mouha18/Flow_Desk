import { useState, useEffect } from "react";
import { StyleSheet, View, Text, Switch, TouchableOpacity, Alert } from "react-native";
import { Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Typography, Screen, Card } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

// Notification type definitions
const NOTIFICATION_TYPES = [
  { key: "contract_invite", label: "Contract Invites", description: "When a client sends you a contract request" },
  { key: "contract_accepted", label: "Contract Accepted", description: "When a client accepts your contract" },
  { key: "contract_declined", label: "Contract Declined", description: "When a client declines your contract" },
  { key: "task_complete", label: "Task Completed", description: "When a task is marked as complete" },
  { key: "invoice_received", label: "Invoice Received", description: "When you receive a new invoice" },
  { key: "payment_received", label: "Payment Received", description: "When a payment is successfully processed" },
  { key: "new_message", label: "New Messages", description: "When you receive a new chat message" },
  { key: "time_tracked", label: "Time Tracking", description: "Daily summary of time tracked on tasks" },
  { key: "project_complete", label: "Project Complete", description: "When a contract is marked as complete" },
  { key: "deliverable_released", label: "Deliverable Released", description: "When escrow funds are released" },
] as const;

type NotificationKey = typeof NOTIFICATION_TYPES[number]["key"];

export default function FreelancerNotificationPreferencesScreen() {
  // Local state for toggles (initialized with defaults)
  const [preferences, setPreferences] = useState<Record<string, boolean>>(
    NOTIFICATION_TYPES.reduce((acc, { key }) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Query current preferences from Convex
  const storedPreferences = useQuery(
    api.notifications.listUserNotificationPreferences
  );

  // Mutation to update a single preference
  const updatePreference = useMutation(
    api.notifications.updateNotificationPreference
  );

  // Sync with stored preferences when they load
  useEffect(() => {
    if (storedPreferences) {
      setPreferences(storedPreferences);
      setIsLoading(false);
    }
  }, [storedPreferences]);

  const handleToggle = async (key: string, value: boolean) => {
    // Optimistic update
    setPreferences((prev) => ({ ...prev, [key]: value }));
    
    setIsSaving(true);
    try {
      await updatePreference({ key, enabled: value });
    } catch (err) {
      // Revert on error
      setPreferences((prev) => ({ ...prev, [key]: !value }));
      Alert.alert("Error", "Failed to update preference");
    } finally {
      setIsSaving(false);
    }
  };

  const renderToggleRow = ({ key, label, description }: typeof NOTIFICATION_TYPES[number]) => (
    <View key={key} style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Typography variant="bodyMedium" style={styles.toggleLabel}>
          {label}
        </Typography>
        <Typography variant="bodySmall" color={colors.gray500}>
          {description}
        </Typography>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: colors.gray300, true: colors.freelancer }}
        thumbColor={colors.white}
        disabled={isSaving}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notification Settings",
          headerLargeTitle: true,
        }}
      />
      <Screen style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Typography variant="bodySmall" color={colors.gray500} style={styles.sectionLabel}>
              NOTIFICATIONS
            </Typography>
            <TouchableOpacity
              onPress={() => {
                // Enable all
                NOTIFICATION_TYPES.forEach(({ key }) => {
                  if (!preferences[key]) {
                    handleToggle(key, true);
                  }
                });
              }}
            >
              <Typography variant="bodySmall" color={colors.freelancer}>
                Enable All
              </Typography>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            NOTIFICATION_TYPES.map(renderToggleRow)
          )}
        </Card>

        <View style={styles.footer}>
          <Typography variant="bodySmall" color={colors.gray500} style={styles.footerText}>
            Toggle off any notification type to mute it. Your preferences are saved automatically.
          </Typography>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionLabel: {
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontWeight: "500",
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    color: colors.gray500,
  },
  footer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  footerText: {
    textAlign: "center",
  },
});