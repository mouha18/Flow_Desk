import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { Screen, Icon } from "@/components/ui";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function FreelancerNotificationPreferencesScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Notification Settings",
          headerLargeTitle: true,
          headerRight: () => (
            <Icon name="settings" size="sm" color={colors.gray400} />
          ),
        }}
      />
      <Screen style={styles.container}>
        <NotificationPreferencesForm userRole="freelancer" />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
    padding: spacing[4],
  },
});
