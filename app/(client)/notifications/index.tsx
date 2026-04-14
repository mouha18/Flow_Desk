import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Typography, Screen, Button, Icon } from "@/components/ui";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Notification } from "@/types";
import type { Id } from "@/convex/_generated/dataModel";

export default function ClientNotificationsScreen() {
  const { notifications, isLoading, unreadCount, markRead, markAllRead, refreshing, refetch } = useNotifications();

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markRead({ notificationId: notification._id as Id<"notifications"> });
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="bell" size="xl" color={colors.gray300} style={styles.emptyIcon} />
      <Typography variant="body" style={styles.emptyTitle}>No notifications</Typography>
      <Typography variant="bodySmall" color={colors.gray500} style={styles.emptySubtitle}>
        You're all caught up
      </Typography>
    </View>
  );


  const renderContent = () => {
    if (isLoading) {
      return null;
    }
    if (notifications.length === 0) {
      return renderEmptyState();
    }
    return (
      <NotificationList
        notifications={notifications as Notification[]}
        onNotificationPress={handleNotificationPress}
        refreshing={refreshing}
        onRefresh={refetch}
        style={styles.list}
      />
    );
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
        {renderContent()}
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[10],
    flex: 1,
  },
  emptyIcon: {
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontWeight: "600" as const,
    color: colors.gray600,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    textAlign: "center" as const,
  },
  list: {
    flex: 1,
  },
});
