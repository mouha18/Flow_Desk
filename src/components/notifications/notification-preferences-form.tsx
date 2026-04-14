import { useState, useEffect } from "react";
import { StyleSheet, View, Switch, TouchableOpacity, Alert, StyleProp, ViewStyle } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Typography, Card } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

interface NotificationType {
  key: string;
  label: string;
  description: string;
}

interface NotificationPreferencesFormProps {
  userRole?: "freelancer" | "client";
  style?: StyleProp<ViewStyle>;
}

// Notification types differ based on role
const NOTIFICATION_TYPES: Record<string, NotificationType[]> = {
  freelancer: [
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
  ],
  client: [
    { key: "contract_invite", label: "Contract Invites", description: "When you send a contract request to a freelancer" },
    { key: "contract_accepted", label: "Contract Accepted", description: "When a freelancer accepts your contract" },
    { key: "contract_declined", label: "Contract Declined", description: "When a freelancer declines your contract" },
    { key: "task_complete", label: "Task Completed", description: "When a freelancer marks a task as complete" },
    { key: "invoice_received", label: "Invoice Received", description: "When you receive a new invoice from a freelancer" },
    { key: "payment_received", label: "Payment Received", description: "When a payment is successfully processed" },
    { key: "new_message", label: "New Messages", description: "When you receive a new chat message" },
    { key: "time_tracked", label: "Time Tracking", description: "Daily summary of time tracked on tasks" },
    { key: "project_complete", label: "Project Complete", description: "When a contract is marked as complete" },
    { key: "deliverable_released", label: "Deliverable Released", description: "When escrow funds are released" },
  ],
};

export function NotificationPreferencesForm({ userRole = "freelancer", style }: NotificationPreferencesFormProps) {
  const types = NOTIFICATION_TYPES[userRole] ?? NOTIFICATION_TYPES.freelancer;

  // Local state for toggles (initialized with defaults)
  const [preferences, setPreferences] = useState<Record<string, boolean>>(
    types.reduce((acc, { key }) => {
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

  const handleEnableAll = () => {
    types.forEach(({ key }) => {
      if (!preferences[key]) {
        handleToggle(key, true);
      }
    });
  };

  const renderToggleRow = ({ key, label, description }: NotificationType) => (
    <View key={key} style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Typography variant="label" style={styles.toggleLabel}>
          {label}
        </Typography>
        <Typography variant="bodySmall" color={colors.gray500}>
          {description}
        </Typography>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: colors.gray300, true: colors.accent }}
        thumbColor={colors.white}
        disabled={isSaving}
      />
    </View>
  );

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <Typography variant="bodySmall" color={colors.gray500} style={styles.sectionLabel}>
          NOTIFICATIONS
        </Typography>
        <TouchableOpacity onPress={handleEnableAll}>
          <Typography variant="bodySmall" color={colors.accent}>
            Enable All
          </Typography>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Typography variant="bodySmall" color={colors.gray500}>Loading...</Typography>
        </View>
      ) : (
        types.map(renderToggleRow)
      )}

      <View style={styles.footer}>
        <Typography variant="bodySmall" color={colors.gray500} style={styles.footerText}>
          Toggle off any notification type to mute it. Your preferences are saved automatically.
        </Typography>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sectionLabel: {
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  toggleLabel: {
    fontWeight: "500",
    marginBottom: 2,
  },
  loadingContainer: {
    padding: spacing[4],
    alignItems: "center",
  },
  footer: {
    marginTop: spacing[4],
    paddingTop: spacing[3],
  },
  footerText: {
    textAlign: "center",
  },
});