import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { Bell } from "lucide-react-native";
import { Typography, Screen, Button } from "@/components/ui";
import { NotificationList } from "./NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Notification } from "@/types";
import type { Id } from "@/convex/_generated/dataModel";

interface NotificationScreenProps {
  userRole?: "freelancer" | "client";
  style?: StyleProp<ViewStyle>;
}

export function NotificationScreen({ userRole, style }: NotificationScreenProps) {
  const { notifications, isLoading, unreadCount, markRead, markAllRead, refreshing, refetch } = useNotifications();

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markRead({ notificationId: notification._id as Id<"notifications"> });
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Bell size={32} color={colors.gray400} strokeWidth={1.5} />
      </View>
      <Typography variant="body" color={colors.gray900} style={styles.emptyTitle}>
        No notifications
      </Typography>
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
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontWeight: "600",
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
});