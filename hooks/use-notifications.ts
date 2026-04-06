import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMemo } from "react";

/**
 * Hook to get all notifications for the authenticated user
 */
export function useNotifications() {
  const notifications = useQuery(api.notifications.listByUser);
  return { 
    notifications, 
    isLoading: notifications === undefined 
  };
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount() {
  const { notifications } = useNotifications();

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return unreadCount;
}

/**
 * Hook to mark a notification as read
 */
export function useMarkRead() {
  const markRead = useMutation(api.notifications.markRead);
  
  return {
    markRead: async (notificationId: Id<"notifications">) => {
      return await markRead({ notificationId });
    }
  };
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllRead() {
  const markAllRead = useMutation(api.notifications.markAllRead);
  
  return {
    markAllRead: async () => {
      return await markAllRead({} as any);
    }
  };
}

/**
 * Format notification timestamp to relative time
 */
export function formatNotificationTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  // Format as date
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case "contract_accepted":
      return "✅";
    case "contract_declined":
      return "❌";
    case "contract_invite":
      return "📋";
    case "task_complete":
      return "🎉";
    case "invoice_received":
      return "💰";
    case "payment_received":
      return "💵";
    case "new_message":
      return "💬";
    default:
      return "🔔";
  }
}