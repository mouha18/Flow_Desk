import React from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import {
  FileText,
  UserCheck,
  UserX,
  CheckCircle,
  Receipt,
  CreditCard,
  MessageCircle,
  Clock,
  Star,
  Send as SendIcon,
  Bell,
  ChevronRight,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import { Typography } from "../ui/typography";
import { Notification, NotificationType } from "../../types/index";

interface NotificationItemProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  style?: ViewStyle;
}

type IconComponent = React.ComponentType<{ size: number; color: string; strokeWidth: number }>;

const getNotificationIcon = (type: string): { icon: IconComponent; color: string; bg: string } => {
  const iconMap: Record<string, { icon: IconComponent; color: string; bg: string }> = {
    contract_invite: { icon: FileText, color: colors.accent, bg: colors.accentLight },
    contract_accepted: { icon: UserCheck, color: colors.success, bg: colors.successLight },
    contract_declined: { icon: UserX, color: colors.error, bg: colors.errorLight },
    task_complete: { icon: CheckCircle, color: colors.success, bg: colors.successLight },
    invoice_received: { icon: Receipt, color: colors.warning, bg: colors.warningLight },
    payment_received: { icon: CreditCard, color: colors.success, bg: colors.successLight },
    new_message: { icon: MessageCircle, color: colors.accent, bg: colors.accentLight },
    time_tracked: { icon: Clock, color: colors.gray500, bg: colors.gray100 },
    project_complete: { icon: Star, color: colors.warning, bg: colors.warningLight },
    deliverable_released: { icon: SendIcon, color: colors.success, bg: colors.successLight },
  };
  return iconMap[type] || { icon: Bell, color: colors.gray500, bg: colors.gray100 };
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
  const { icon: NotifIcon, color: iconColor, bg: iconBg } = getNotificationIcon(notification.type);
  const timeAgo = formatRelativeTime(notification._creationTime);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(notification);
  };

  return (
    <Pressable
      style={[
        styles.container,
        !notification.read && styles.containerUnread,
        style,
      ]}
      onPress={handlePress}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <NotifIcon size={18} color={iconColor} strokeWidth={2} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Typography
            variant="body"
            color={notification.read ? colors.gray700 : colors.gray900}
            style={!notification.read ? styles.messageUnread : undefined}
            numberOfLines={2}
          >
            {notification.message}
          </Typography>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Typography variant="caption" color={colors.gray500}>
          {timeAgo}
        </Typography>
      </View>

      <View style={styles.chevron}>
        <ChevronRight size={16} color={colors.gray300} strokeWidth={2} />
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
    backgroundColor: colors.accentLight,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[1],
  },
  messageUnread: {
    fontWeight: fontWeights.semibold as any,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    marginLeft: spacing[2],
  },
  chevron: {
    marginLeft: spacing[2],
  },
});
