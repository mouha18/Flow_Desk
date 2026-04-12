import React from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  ViewStyle,
  ListRenderItem,
  RefreshControl,
} from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { spacing } from "../../constants/spacing";
import { Notification } from "../../types/index";
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
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptySubtitle}>
          You're all caught up! New notifications will appear here.
        </Text>
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
          tintColor={colors.primary}
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.gray700,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: fontSizes.base,
    color: colors.gray500,
    textAlign: "center",
    lineHeight: fontSizes.base * 1.5,
  },
});