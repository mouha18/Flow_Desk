import { Stack } from "expo-router";
import { colors } from "@/constants/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.white },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="register" options={{ title: "Create Account" }} />
      <Stack.Screen name="role-select" options={{ title: "Select Your Role" }} />
    </Stack>
  );
}
