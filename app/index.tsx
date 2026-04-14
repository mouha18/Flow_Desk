import { useState, useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";

export default function Index() {
  const { isLoading, isAuthenticated, userRole } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    storage.getHasSeenOnboarding().then(setHasSeenOnboarding);
  }, []);

  // Show nothing while loading
  if (isLoading || hasSeenOnboarding === null) {
    return null;
  }

  // First time user — show onboarding
  if (!hasSeenOnboarding && !isAuthenticated) {
    return <Redirect href="/(onboarding)/welcome" />;
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
