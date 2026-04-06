import { Drawer } from "expo-router/drawer";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "expo-router";

export default function ClientLayout() {
  const { isLoading, isAuthenticated, userRole, user } = useAuth();

  // Show loading while auth state is being determined
  if (isLoading || user === undefined) {
    return null;
  }

  // Redirect if not authenticated or not a client
  if (!isAuthenticated || userRole !== "client") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Drawer>
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
          title: "Contracts",
          drawerLabel: "Contracts",
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
