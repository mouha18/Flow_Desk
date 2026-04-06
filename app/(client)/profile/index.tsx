import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button, Heading, Typography, Screen, Card, Input } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";

export default function ClientProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const signOut = useAuthActions().signOut;
  const updateProfile = useMutation(api.users.updateProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      setIsEditing(false);
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogOut = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          await storage.clearAll();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Profile",
          headerLargeTitle: true,
        }}
      />
      <Screen style={styles.container}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Heading level="h2" color={colors.white}>
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </Heading>
          </View>
          <Heading level="h3">{user?.name || "User"}</Heading>
          <Typography variant="bodySmall" color={colors.gray500} style={styles.email}>
            {user?.email || "email@example.com"}
          </Typography>
        </Card>

        <View style={styles.section}>
          <Typography variant="bodySmall" color={colors.gray500} style={styles.sectionLabel}>
            PROFILE
          </Typography>
          <Card>
            {isEditing ? (
              <View style={styles.editForm}>
                <Input
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                />
                <View style={styles.editActions}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    onPress={() => {
                      setName(user?.name || "");
                      setIsEditing(false);
                    }}
                  />
                  <Button
                    title="Save"
                    variant="primary"
                    onPress={handleSaveProfile}
                    loading={isSaving}
                  />
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.fieldRow}>
                  <Typography variant="bodySmall" color={colors.gray500}>
                    Name
                  </Typography>
                  <Typography variant="body">{user?.name || "—"}</Typography>
                </View>
                <View style={styles.fieldRow}>
                  <Typography variant="bodySmall" color={colors.gray500}>
                    Email
                  </Typography>
                  <Typography variant="body">{user?.email || "—"}</Typography>
                </View>
                <View style={[styles.fieldRow, styles.fieldRowLast]}>
                  <Typography variant="bodySmall" color={colors.gray500}>
                    Role
                  </Typography>
                  <Typography variant="body" color={colors.client}>
                    Client
                  </Typography>
                </View>
                <Button
                  title="Edit Profile"
                  variant="outline"
                  onPress={() => setIsEditing(true)}
                  fullWidth
                />
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Button
            title="Log Out"
            variant="ghost"
            onPress={handleLogOut}
            fullWidth
          />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  profileCard: {
    alignItems: "center",
    padding: spacing[8],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.client,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  email: {
    marginTop: spacing[1],
  },
  section: {
    padding: spacing[4],
  },
  sectionLabel: {
    marginBottom: spacing[2],
    fontWeight: "600",
  },
  fieldRow: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
    marginBottom: spacing[4],
  },
  editForm: {
    gap: spacing[4],
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing[2],
  },
});
