import { useState } from "react";
import { View, StyleSheet, Alert, ViewStyle, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button, Heading, Typography, Screen, Card, Input, Avatar, Icon } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";

type UserRole = "freelancer" | "client";

interface ProfileScreenContentProps {
  userRole: UserRole;
  style?: ViewStyle;
}

export function ProfileScreenContent({
  userRole,
  style,
}: ProfileScreenContentProps) {
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
          router.replace("/");
        },
      },
    ]);
  };

  const roleLabel = userRole === "freelancer" ? "Freelancer" : "Client";
  const avatarVariant = userRole;

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
          <Avatar
            name={user?.name}
            size="lg"
            variant={avatarVariant}
            style={styles.avatar}
          />
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
                  <View style={styles.fieldLabelRow}>
                    <Icon name="mail" size="sm" color={colors.gray400} />
                    <Typography variant="bodySmall" color={colors.gray500}>Email</Typography>
                  </View>
                  <Typography variant="body">{user?.email || "—"}</Typography>
                </View>
                <View style={[styles.fieldRow, styles.fieldRowLast]}>
                  <View style={styles.fieldLabelRow}>
                    <Icon name={userRole === "freelancer" ? "briefcase" : "building"} size="sm" color={colors.gray400} />
                    <Typography variant="bodySmall" color={colors.gray500}>Role</Typography>
                  </View>
                  <Typography variant="body" color={colors[userRole]}>
                    {roleLabel}
                  </Typography>
                </View>
                <Button
                  title="Edit Profile"
                  variant="outline"
                  onPress={() => setIsEditing(true)}
                  fullWidth
                  style={styles.editButton}
                  textStyle={styles.editButtonText}
                />
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Typography variant="bodySmall" color={colors.gray500} style={styles.sectionLabel}>
            ACTIVITY
          </Typography>
          <Card>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                const path = userRole === "freelancer"
                  ? "/(freelancer)/invoices"
                  : "/(client)/invoices";
                router.push(path as any);
              }}
            >
              <View style={styles.fieldLabelRow}>
                <Icon name={userRole === "freelancer" ? "wallet" : "credit-card"} size="sm" color={colors.gray400} />
                <Typography variant="body">
                  {userRole === "freelancer" ? "Earnings & Invoices" : "Paid Services"}
                </Typography>
              </View>
              <Icon name="chevron-right" size="sm" color={colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => {
                const path = userRole === "freelancer"
                  ? "/(freelancer)/notifications/preferences"
                  : "/(client)/notifications/preferences";
                router.push(path as any);
              }}
            >
              <View style={styles.fieldLabelRow}>
                <Icon name="settings" size="sm" color={colors.gray400} />
                <Typography variant="body">Notification Settings</Typography>
              </View>
              <Icon name="chevron-right" size="sm" color={colors.gray400} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Typography variant="bodySmall" color={colors.gray500} style={styles.sectionLabel}>
            ACCOUNT
          </Typography>
          <Card>
            <Button
              title="Log Out"
              variant="ghost"
              onPress={handleLogOut}
              fullWidth
              textStyle={styles.logOutText}
            />
          </Card>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: spacing[5],
    marginBottom: spacing[3],
  },
  avatar: {
    marginBottom: spacing[3],
  },
  email: {
    marginTop: spacing[1],
  },
  section: {
    marginBottom: spacing[3],
  },
  sectionLabel: {
    paddingHorizontal: spacing[1],
    marginBottom: spacing[1],
    letterSpacing: 1,
  },
  editForm: {
    gap: spacing[3],
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  editButton: {
    marginTop: spacing[3],
  },
  editButtonText: {
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  logOutText: {
    color: colors.error,
    fontWeight: "600",
  },
});
