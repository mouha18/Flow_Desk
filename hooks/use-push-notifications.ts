import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "./use-auth";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const user = useQuery(api.users.me);
  const registerToken = useMutation(api.users.registerPushToken);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const hasRegisteredRef = useRef(false);

  useEffect(() => {
    let notificationListener: Notifications.Subscription | null = null;
    let responseListener: Notifications.Subscription | null = null;

    async function registerForPushNotifications() {
      // Don't register if not authenticated or still loading auth
      if (!isAuthenticated || authLoading) {
        console.log("Push notifications: user not authenticated or still loading, skipping");
        return;
      }

      // Also check user query is loaded
      if (user === undefined) {
        console.log("Push notifications: user query still loading, skipping");
        return;
      }

      // Prevent double registration
      if (hasRegisteredRef.current) {
        return;
      }
      hasRegisteredRef.current = true;

      if (!Device.isDevice) {
        console.log("Push notifications require a physical device");
        return;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Still not granted?
      if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return;
      }

      try {
        // Get Expo push token - use projectId from Constants
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        
        const pushToken = tokenData.data;

        // Register token with Convex
        await registerToken({ pushToken });
        
        console.log("Push token registered:", pushToken);
      } catch (error) {
        console.error("Failed to register push token:", error);
        // Reset flag on error so we can retry
        hasRegisteredRef.current = false;
      }
    }

    registerForPushNotifications();

    // Listen for incoming notifications
    notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Listen for notification responses (user tapped)
    responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const contractId = response.notification.request.content.data?.contractId;
      if (contractId) {
        // Handle deep link to contract
        console.log("User tapped notification for contract:", contractId);
      }
    });

    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, [isAuthenticated, authLoading, user, registerToken]);
}
