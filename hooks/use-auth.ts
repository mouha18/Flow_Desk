import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { storage } from "../lib/storage";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const user = useQuery(api.users.me);

  // Determine role from Convex user object
  const userRole = user?.role ?? null;

  useEffect(() => {
    if (user === undefined) return;

    if (user) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [user]);

  const redirectBasedOnRole = async () => {
    if (userRole === "freelancer") {
      router.replace("/(freelancer)/dashboard");
    } else if (userRole === "client") {
      router.replace("/(client)/dashboard");
    } else {
      router.replace("/(auth)/role-select");
    }
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    userRole,
    redirectBasedOnRole,
  };
}
