import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Heading, Typography, Screen, Card } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { storage } from "@/lib/storage";
import type { UserRole } from "@/types";

export default function RoleSelectScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setUserRole = useMutation(api.users.setUserRole);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      // Save role to Convex (authoritative) AND AsyncStorage (for quick access)
      await setUserRole({ role: selectedRole });
      await storage.setRole(selectedRole);

      if (selectedRole === "freelancer") {
        router.replace("/(freelancer)/dashboard");
      } else {
        router.replace("/(client)/dashboard");
      }
    } catch (error) {
      console.error("Failed to set role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Heading level="h1">How will you use Flowdesk?</Heading>
          <Typography variant="bodySmall" color={colors.gray500} style={styles.subtitle}>
            Choose your primary role. You can always switch later.
          </Typography>
        </View>

        <View style={styles.options}>
          <Pressable
            onPress={() => setSelectedRole("freelancer")}
            style={({ pressed }) => [
              styles.roleCard,
              selectedRole === "freelancer" && styles.roleCardSelected,
              pressed && styles.roleCardPressed,
            ]}
          >
            <Card
              variant={selectedRole === "freelancer" ? "outlined" : "default"}
              style={[
                styles.card,
                selectedRole === "freelancer" && styles.cardSelected,
              ]}
            >
              <View style={styles.iconContainer}>
                <Typography style={styles.iconText}>F</Typography>
              </View>
              <Heading level="h3" color={selectedRole === "freelancer" ? colors.freelancer : colors.gray900}>
                Freelancer
              </Heading>
              <Typography variant="bodySmall" color={colors.gray500} style={styles.description}>
                Create contracts, manage tasks, track time, and get paid
              </Typography>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => setSelectedRole("client")}
            style={({ pressed }) => [
              styles.roleCard,
              selectedRole === "client" && styles.roleCardSelected,
              pressed && styles.roleCardPressed,
            ]}
          >
            <Card
              variant={selectedRole === "client" ? "outlined" : "default"}
              style={[
                styles.card,
                selectedRole === "client" && styles.cardSelected,
              ]}
            >
              <View style={[styles.iconContainer, styles.clientIcon]}>
                <Typography style={styles.iconText}>C</Typography>
              </View>
              <Heading level="h3" color={selectedRole === "client" ? colors.client : colors.gray900}>
                Client
              </Heading>
              <Typography variant="bodySmall" color={colors.gray500} style={styles.description}>
                Review proposals, approve work, pay invoices, and chat
              </Typography>
            </Card>
          </Pressable>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedRole}
          loading={isLoading}
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
  },
  header: {
    marginBottom: spacing[8],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  options: {
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  roleCard: {
    borderRadius: 16,
  },
  roleCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  roleCardPressed: {
    opacity: 0.8,
  },
  card: {
    alignItems: "center",
    padding: spacing[6],
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.freelancer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  clientIcon: {
    backgroundColor: colors.client,
  },
  iconText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
  },
  description: {
    marginTop: spacing[2],
    textAlign: "center",
  },
});
