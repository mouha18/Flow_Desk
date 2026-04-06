import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";

export default function Index() {
  const { isLoading, isAuthenticated, userRole } = useAuth();

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Not authenticated, go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated — redirect based on role
  if (userRole === "freelancer") {
    return <Redirect href="/(freelancer)/dashboard" />;
  }
  if (userRole === "client") {
    return <Redirect href="/(client)/dashboard" />;
  }

  // Authenticated but no role yet — must select one
  return <Redirect href="/(auth)/role-select" />;
}
