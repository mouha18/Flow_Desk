import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import * as SecureStore from "expo-secure-store";
import { ErrorBoundary } from "../src/components/ui";
import { usePushNotifications } from "../hooks/use-push-notifications";
import { initSQLite } from "../lib/sqlite";
import { colors } from "../src/constants/colors";

// Create Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL as string);

// Secure storage adapter for React Native
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <ErrorBoundary>
        <RootLayoutNav />
      </ErrorBoundary>
    </ConvexAuthProvider>
  );
}

function RootLayoutNav() {
  // Initialize push notifications
  usePushNotifications();

  // Initialize SQLite on app start
  useEffect(() => {
    initSQLite().catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.gray50 },
        }}
      >
        {/* Onboarding Stack */}
        <Stack.Screen
          name="(onboarding)"
          options={{
            headerShown: false,
          }}
        />

        {/* Auth Stack */}
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />

        {/* Freelancer Stack */}
        <Stack.Screen
          name="(freelancer)"
          options={{
            headerShown: false,
          }}
        />

        {/* Client Stack */}
        <Stack.Screen
          name="(client)"
          options={{
            headerShown: false,
          }}
        />

        {/* Index - redirect based on auth state */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
