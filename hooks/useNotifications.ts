import { useQuery, useMutation } from "convex/react";
import { useState, useCallback } from "react";
import { api } from "../convex/_generated/api";
import type { Notification } from "../src/types";

export function useNotifications() {
  // Always call hooks unconditionally (Rules of Hooks).
  // Server-side notifications.list returns [] when not authenticated.
  const notifications = useQuery(api.notifications.list);
  const isLoading = notifications === undefined;
  const [refreshing, setRefreshing] = useState(false);

  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    // Convex uses subscriptions - the data auto-updates
    // Wait a brief moment to show refresh indicator, then stop
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  // Compute unread count
  const notificationList = (notifications ?? []) as Notification[];
  const unreadCount = notificationList.filter((n) => !n.read).length;

  return {
    notifications: notificationList,
    isLoading,
    refreshing,
    refetch,
    unreadCount,
    markRead,
    markAllRead,
  };
}
