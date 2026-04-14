import React from "react";
import {
  FlatList,
  StyleSheet,
  View,
  ViewStyle,
  ListRenderItem,
  RefreshControl,
} from "react-native";
import { Bell } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { fontWeights } from "../../constants/typography";
import { spacing } from "../../constants/spacing";
import { Notification } from "../../types/index";
import { Typography } from "../ui/typography";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  notifications: Notification[];
  onNotificationPress?: (notification: Notification) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
}

export function NotificationList({
  notifications,
  onNotificationPress,
  onRefresh,
  refreshing = false,
  style,
}: NotificationListProps) {
  const renderItem: ListRenderItem<Notification> = ({ item }) => (
    <NotificationItem
      notification={item}
      onPress={onNotificationPress}
    />
  );

  const keyExtractor = (item: Notification) => item._id;

  if (notifications.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <View style={styles.emptyIconCircle}>
          <Bell size={32} color={colors.gray400} strokeWidth={1.5} />
        </View>
        <Typography variant="body" color={colors.gray700} style={styles.emptyTitle}>
          No notifications
        </Typography>
        <Typography variant="bodySmall" color={colors.gray500} style={styles.emptySubtitle}>
          You're all caught up! New notifications will appear here.
        </Typography>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh ?? (() => {})}
          tintColor={colors.accent}
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    flexGrow: 1,
  },
  separator: {
    height: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
    backgroundColor: colors.white,
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
    fontWeight: fontWeights.semibold as any,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    textAlign: "center",
  },
});