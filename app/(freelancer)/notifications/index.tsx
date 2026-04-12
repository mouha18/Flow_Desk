import { StyleSheet, View, Text, RefreshControl } from "react-native";
import { Stack } from "expo-router";
import { Typography, Screen, Button, Card } from "@/components/ui";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Notification } from "@/types";
import type { Id } from "@/convex/_generated/dataModel";

export default function FreelancerNotificationsScreen() {
  const { notifications, isLoading, unreadCount, markRead, markAllRead, refreshing, refetch } = useNotifications();


  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markRead({ notificationId: notification._id as Id<"notifications"> });
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptySubtitle}>
        You're all caught up
      </Text>
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
    fontSize: 48,
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
});
