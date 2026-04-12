import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Notification } from "../src/types";

export function useNotifications() {
  // Always call hooks unconditionally (Rules of Hooks).
  // Server-side notifications.list returns [] when not authenticated.
  const notifications = useQuery(api.notifications.list);
  const isLoading = notifications === undefined;

  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  // Compute unread count
  const notificationList = (notifications ?? []) as Notification[];
  const unreadCount = notificationList.filter((n) => !n.read).length;

  return {
    notifications: notificationList,
    isLoading,
    unreadCount,
    markRead,
    markAllRead,
  };
}
