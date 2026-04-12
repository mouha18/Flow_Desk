import React from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import { Notification, NotificationType } from "../../types/index";

interface NotificationItemProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  style?: ViewStyle;
}

const notificationIcons: Record<NotificationType, string> = {
  contract_invite: "📋",
  contract_accepted: "✅",
  contract_declined: "❌",
  task_complete: "🎯",
  invoice_received: "📄",
  payment_received: "💰",
  new_message: "💬",
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? "Yesterday" : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }
  return "Just now";
}

export function NotificationItem({
  notification,
  onPress,
  style,
}: NotificationItemProps) {
  const icon = notificationIcons[notification.type] || "🔔";
  const timeAgo = formatRelativeTime(notification._creationTime);

  return (
    <Pressable
      style={[
        styles.container,
        !notification.read && styles.containerUnread,
        style,
      ]}
      onPress={() => onPress?.(notification)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.message,
              !notification.read && styles.messageUnread,
            ]}
            numberOfLines={2}
          >
            {notification.message}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.timestamp}>{timeAgo}</Text>
      </View>

      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  containerUnread: {
    backgroundColor: colors.primaryLight + "10",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  icon: {
    fontSize: fontSizes.xl,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[1],
  },
  message: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.gray700,
    lineHeight: fontSizes.base * 1.4,
  },
  messageUnread: {
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginLeft: spacing[2],
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
  },
  chevron: {
    marginLeft: spacing[2],
  },
  chevronText: {
    fontSize: fontSizes["2xl"],
    color: colors.gray300,
  },
});