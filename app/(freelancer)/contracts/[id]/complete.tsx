import { StyleSheet, View, ScrollView, Alert } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Typography, Heading, Screen, Card, Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Id } from "@/convex/_generated/dataModel";

interface Deliverable {
  name: string;
  url: string;
}

export default function CompleteContractScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = id as Id<"contracts">;

  const submitCompletion = useMutation(api.contracts.submitCompletion);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDeliverable = () => {
    if (!newName.trim() || !newUrl.trim()) {
      Alert.alert("Error", "Please enter both name and URL");
      return;
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(newUrl.trim())) {
      Alert.alert("Error", "Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    setDeliverables([
      ...deliverables,
      { name: newName.trim(), url: newUrl.trim() },
    ]);
    setNewName("");
    setNewUrl("");
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (deliverables.length === 0) {
      Alert.alert("Error", "Please add at least one deliverable");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCompletion({
        contractId,
        deliverables,
        notes: notes || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Complete & Deliver" }} />
      <Screen style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <Heading level="h3" style={styles.title}>
              Submit Completion
            </Heading>
            <Typography variant="bodySmall" color={colors.gray500} style={styles.subtitle}>
              Add the deliverable links and notes for your client to review.
            </Typography>

            {/* Deliverables List */}
            {deliverables.length > 0 && (
              <View style={styles.deliverablesList}>
                <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                  Deliverables
                </Typography>
                {deliverables.map((deliverable, index) => (
                  <View key={index} style={styles.deliverableItem}>
                    <View style={styles.deliverableContent}>
                      <Typography variant="bodySmall" style={styles.deliverableName}>
                        {deliverable.name}
                      </Typography>
                      <Typography variant="bodySmall" color={colors.accent}>
                        {deliverable.url}
                      </Typography>
                    </View>
                    <Button
                      title="×"
                      onPress={() => handleRemoveDeliverable(index)}
                      variant="ghost"
                      style={styles.removeButton}
                      textStyle={styles.removeButtonText}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Add Deliverable Form */}
            <View style={styles.addForm}>
              <Typography variant="label" color={colors.gray500} style={styles.sectionLabel}>
                Add Deliverable
              </Typography>
              <Input
                placeholder="Name (e.g., GitHub Repository)"
                value={newName}
                onChangeText={setNewName}
                containerStyle={styles.input}
              />
              <Input
                placeholder="URL (e.g., https://github.com/...)"
                value={newUrl}
                onChangeText={setNewUrl}
                keyboardType="url"
                autoCapitalize="none"
                containerStyle={styles.input}
              />
              <Button
                title="Add Deliverable"
                onPress={handleAddDeliverable}
                variant="secondary"
                disabled={!newName.trim() || !newUrl.trim()}
                style={styles.addButton}
              />
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Input
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes for your client..."
                multiline
              />
            </View>

            <Button
              title={isSubmitting ? "Submitting..." : "Submit Completion"}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || deliverables.length === 0}
              fullWidth
            />
          </Card>
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.gray50 },
  card: { margin: spacing[4], padding: spacing[6] },
  title: { marginBottom: spacing[2] },
  subtitle: { marginBottom: spacing[6] },
  deliverablesList: {
    marginBottom: spacing[4],
  },
  sectionLabel: {
    marginBottom: spacing[3],
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
  removeButton: {
    paddingHorizontal: spacing[2],
    minWidth: 32,
  },
  removeButtonText: {
    fontSize: 20,
    color: colors.error,
  },
  addForm: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  input: {
    marginBottom: spacing[3],
  },
  addButton: {
    marginTop: spacing[2],
  },
  notesSection: {
    marginTop: spacing[6],
  },
});
