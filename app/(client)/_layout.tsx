import { Drawer } from "expo-router/drawer";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "expo-router";
import { useContracts } from "@/hooks/useContracts";
import { useUnreadCountsByContract } from "@/hooks/useUnreadCounts";
import { DrawerContent } from "@/components/drawer/DrawerContent";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

export default function ClientLayout() {
  const { isLoading, isAuthenticated, userRole, user } = useAuth();
  const { contracts } = useContracts();
  const unreadCounts = useUnreadCountsByContract();
  const notificationUnreadCount = useQuery(api.notifications.unreadCount) ?? 0;
  const { signOut } = useAuthActions();

  // Show loading while auth state is being determined
  if (isLoading || user === undefined) {
    return null;
  }

  // Redirect if not authenticated or not a client
  if (!isAuthenticated || userRole !== "client") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Drawer
      drawerContent={() => <DrawerContent contracts={contracts} userRole="client" unreadCounts={unreadCounts} notificationUnreadCount={notificationUnreadCount} onSignOut={() => signOut()} />}
    >
      <Drawer.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          drawerLabel: "Dashboard",
        }}
      />
      <Drawer.Screen
        name="contracts/index"
        options={{
          title: "All Contracts",
          drawerLabel: "All Contracts",
        }}
      />
      <Drawer.Screen
        name="contracts/[id]/index"
        options={{
          title: "Contract Details",
          drawerLabel: "Contract Details",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="contracts/[id]/invoice"
        options={{
          title: "Invoice",
          drawerLabel: "Invoice",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="chat/[contractId]"
        options={{
          title: "Chat",
          drawerLabel: "Chat",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="notifications/index"
        options={{
          title: "Notifications",
          drawerLabel: "Notifications",
        }}
      />
      <Drawer.Screen
        name="profile/index"
        options={{
          title: "Profile",
          drawerLabel: "Profile",
        }}
      />
    </Drawer>
  );
}
