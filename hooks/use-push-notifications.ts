import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

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
  const registerToken = useMutation(api.users.registerPushToken);
  const user = useQuery(api.users.me);

  useEffect(() => {
    let notificationListener: Notifications.Subscription | null = null;
    let responseListener: Notifications.Subscription | null = null;

    async function registerForPushNotifications() {
      // Don't register if not authenticated
      if (!user) {
        console.log("Push notifications: user not authenticated, skipping");
        return;
      }

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
  }, [registerToken, user]);
}
