import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Screen, Button } from "@/components/ui";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Notification } from "@/types";
import type { Id } from "@/convex/_generated/dataModel";

export default function ClientNotificationsScreen() {
  const { notifications, isLoading, unreadCount, markRead, markAllRead } = useNotifications();

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markRead({ notificationId: notification._id as Id<"notifications"> });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerLargeTitle: true,
        }}
      />
      <Screen scrollable={false} style={styles.container}>
        {unreadCount > 0 && (
          <View style={styles.header}>
            <Button
              title="Mark all as read"
              variant="ghost"
              onPress={() => markAllRead()}
              style={styles.markAllButton}
            />
          </View>
        )}
        <NotificationList
          notifications={notifications as Notification[]}
          onNotificationPress={handleNotificationPress}
          style={styles.list}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  markAllButton: {
    paddingHorizontal: 0,
  },
  list: {
    flex: 1,
  },
});
