import { useState } from "react";
import { StyleSheet, View, Pressable, Linking, Alert } from "react-native";
import { Typography, Card, Button, Input } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Deliverable {
  name: string;
  url: string;
}

interface DeliverableLinksProps {
  contractId: Id<"contracts">;
  deliverables: Deliverable[];
  editable?: boolean;
}

export function DeliverableLinks({ contractId, deliverables, editable = true }: DeliverableLinksProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addDeliverable = useMutation(api.contracts.addDeliverable);
  const removeDeliverable = useMutation(api.contracts.removeDeliverable);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) {
      Alert.alert("Error", "Please enter both name and URL");
      return;
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url.trim())) {
      Alert.alert("Error", "Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    setIsAdding(true);
    try {
      await addDeliverable({
        contractId,
        name: name.trim(),
        url: url.trim(),
      });
      setName("");
      setUrl("");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add deliverable"
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (index: number) => {
    try {
      await removeDeliverable({
        contractId,
        index,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to remove deliverable"
      );
    }
  };

  const handleLinkPress = (linkUrl: string) => {
    Linking.openURL(linkUrl).catch(() => {
      Alert.alert("Error", "Could not open deliverable link");
    });
  };

  if (deliverables.length === 0 && !editable) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="bodySmall" color={colors.gray400}>
          No deliverables added yet
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Deliverables List */}
      {deliverables.map((deliverable, index) => (
        <View key={index} style={styles.deliverableItem}>
          <View style={styles.deliverableContent}>
            <Typography variant="bodySmall" color={colors.gray700} style={styles.deliverableName}>
              {deliverable.name}
            </Typography>
            <Pressable onPress={() => handleLinkPress(deliverable.url)}>
              <Typography variant="bodySmall" color={colors.primary} style={styles.deliverableUrl}>
                {deliverable.url}
              </Typography>
            </Pressable>
          </View>
          {editable && (
            <Pressable onPress={() => handleRemove(index)} style={styles.removeButton}>
              <Typography variant="bodySmall" color={colors.error}>×</Typography>
            </Pressable>
          )}
        </View>
      ))}

      {/* Add New Deliverable Form */}
      {editable && (
        <View style={styles.addForm}>
          <Typography variant="label" color={colors.gray500} style={styles.addFormLabel}>
            Add Deliverable
          </Typography>
          <Input
            placeholder="Name (e.g., GitHub Repository)"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <Input
            placeholder="URL (e.g., https://github.com/...)"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
            style={styles.input}
          />
          <Button
            title={isAdding ? "Adding..." : "Add Deliverable"}
            onPress={handleAdd}
            loading={isAdding}
            disabled={isAdding || !name.trim() || !url.trim()}
            variant="secondary"
            style={styles.addButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  emptyContainer: {
    padding: spacing[4],
    alignItems: "center",
  },
  deliverableItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  deliverableContent: {
    flex: 1,
  },
  deliverableName: {
    fontWeight: "500",
    marginBottom: spacing[1],
  },
  deliverableUrl: {
    textDecorationLine: "underline",
  },
  removeButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
  },
  addForm: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  addFormLabel: {
    marginBottom: spacing[3],
  },
  input: {
    marginBottom: spacing[3],
  },
  addButton: {
    marginTop: spacing[2],
  },
});
