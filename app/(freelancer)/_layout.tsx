import { Tabs } from "expo-router/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUnreadCountsByContract } from "@/hooks/useUnreadCounts";
import { colors } from "@/constants/colors";
import { LayoutDashboard, FileText, MessageCircle, User } from "lucide-react-native";

export default function FreelancerLayout() {
  const { isLoading, isAuthenticated, userRole, user } = useAuth();
  const notificationUnreadCount = useQuery(api.notifications.unreadCount) ?? 0;
  const unreadCounts = useUnreadCountsByContract();
  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Show loading while auth state is being determined
  if (isLoading || user === undefined) {
    return null;
  }

  // Redirect if not authenticated or not a freelancer
  if (!isAuthenticated || userRole !== "freelancer") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray200,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          color: colors.gray900,
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerTintColor: colors.gray900,
      }}
    >
      {/* === VISIBLE TABS === */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="contracts/index"
        options={{
          title: "Contracts",
          tabBarLabel: "Contracts",
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          title: "Messages",
          tabBarLabel: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} strokeWidth={2} />
          ),
          tabBarBadge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.error,
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* === HIDDEN SCREENS (not in tab bar) === */}
      <Tabs.Screen
        name="contracts/new"
        options={{ href: null, title: "New Contract" }}
      />
      <Tabs.Screen
        name="contracts/[id]/index"
        options={{ href: null, title: "Contract Details" }}
      />
      <Tabs.Screen
        name="contracts/[id]/tasks"
        options={{ href: null, title: "Tasks" }}
      />
      <Tabs.Screen
        name="contracts/[id]/invoice"
        options={{ href: null, title: "Invoice" }}
      />
      <Tabs.Screen
        name="contracts/[id]/complete"
        options={{ href: null, title: "Complete Contract" }}
      />
      <Tabs.Screen
        name="chat/[contractId]"
        options={{ href: null, title: "Chat" }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{ href: null, title: "Notifications" }}
      />
      <Tabs.Screen
        name="notifications/preferences"
        options={{ href: null, title: "Notification Settings" }}
      />
      <Tabs.Screen
        name="invoices/index"
        options={{ href: null, title: "Earnings" }}
      />
    </Tabs>
  );
}
