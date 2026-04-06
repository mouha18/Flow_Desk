import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Heading, Typography, Screen, Card } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useNotifications, useMarkRead, formatNotificationTime, getNotificationIcon } from "@/hooks/use-notifications";

export default function ClientNotificationsScreen() {
  const router = useRouter();
  const { notifications, isLoading } = useNotifications();
  const { markRead } = useMarkRead();

  const handleNotificationPress = async (notification: any) => {
    if (!notification.read) {
      await markRead(notification._id);
    }
    if (notification.contractId) {
      router.push(`/contracts/${notification.contractId}`);
    }
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => handleNotificationPress(item)}
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
    >
      <Card>
        <View style={styles.notificationHeader}>
          <Typography variant="h3" style={styles.icon}>{getNotificationIcon(item.type)}</Typography>
          <Typography variant="caption" color={colors.gray500}>
            {formatNotificationTime(item._creationTime)}
          </Typography>
        </View>
        <Typography variant="body" style={styles.message}>{item.message}</Typography>
        {!item.read && <View style={styles.unreadDot} />}
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Notifications",
            headerLargeTitle: true,
          }}
        />
        <Screen style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerLargeTitle: true,
        }}
      />
      <Screen style={styles.container}>
        {notifications && notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
          />
        ) : (
          <Card style={styles.emptyState}>
            <Heading level="h3">No notifications</Heading>
            <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
              You'll receive notifications about your projects here
            </Typography>
          </Card>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  list: {
    padding: spacing[4],
  },
  notificationCard: {
    marginBottom: spacing[3],
  },
  unreadCard: {
    backgroundColor: colors.primaryLight + "10",
    borderRadius: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  icon: {
    fontSize: 24,
  },
  message: {
    flex: 1,
  },
  unreadDot: {
    position: "absolute",
    top: spacing[2],
    right: spacing[2],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing[8],
    marginTop: spacing[4],
  },
  emptyText: {
    marginTop: spacing[2],
    textAlign: "center",
  },
});
