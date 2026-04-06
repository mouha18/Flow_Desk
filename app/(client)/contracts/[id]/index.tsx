import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Heading, Typography, Screen, Card, Badge, Button } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useContract, useAcceptContract, useDeclineContract } from "@/hooks/use-contracts";
import { useTasks } from "@/hooks/use-tasks";
import { useState } from "react";

export default function ClientContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { contract, isLoading: contractLoading } = useContract(id || null);
  const { tasks } = useTasks(id || null);
  const { acceptContract } = useAcceptContract();
  const { declineContract } = useDeclineContract();
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return colors.success;
      case "pending": return colors.warning;
      case "completed": return colors.primary;
      case "declined": return colors.error;
      default: return colors.gray500;
    }
  };

  const handleAccept = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await acceptContract(id);
      Alert.alert("Success", "Contract accepted!");
    } catch (error) {
      Alert.alert("Error", "Failed to accept contract");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await declineContract(id);
      Alert.alert("Success", "Contract declined");
    } catch (error) {
      Alert.alert("Error", "Failed to decline contract");
    } finally {
      setIsProcessing(false);
    }
  };

  if (contractLoading || !contract) {
    return (
      <>
        <Stack.Screen options={{ title: "Contract Details" }} />
        <Screen style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Screen>
      </>
    );
  }

  const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: contract.title,
        }} 
      />
      <Screen style={styles.container}>
        <ScrollView>
          <Card style={styles.card}>
            <View style={styles.header}>
              <Heading level="h2">{contract.title}</Heading>
              <Badge label={contract.status} color={getStatusColor(contract.status)} />
            </View>
            
            <Typography variant="body" color={colors.gray600} style={styles.description}>
              {contract.description}
            </Typography>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Typography variant="caption" color={colors.gray500}>Freelancer</Typography>
                <Typography variant="body">{contract.freelancerName}</Typography>
              </View>
              
              <View style={styles.detailRow}>
                <Typography variant="caption" color={colors.gray500}>Pricing</Typography>
                <Typography variant="body">
                  {contract.pricingType === "fixed" 
                    ? `$${contract.fixedPrice}` 
                    : "Hourly rate"}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="caption" color={colors.gray500}>Payment</Typography>
                <Typography variant="body">{contract.paymentMethod}</Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="caption" color={colors.gray500}>Deadline</Typography>
                <Typography variant="body">
                  {new Date(contract.deadline).toLocaleDateString()}
                </Typography>
              </View>
            </View>
          </Card>

          {contract.status === "active" && (
            <Card style={styles.card}>
              <Heading level="h3" style={styles.sectionTitle}>Progress</Heading>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${contract.completionPercent}%` }
                    ]} 
                  />
                </View>
                <Typography variant="body" style={styles.progressText}>
                  {contract.completionPercent}% Complete
                </Typography>
              </View>
              <Typography variant="bodySmall" color={colors.gray500}>
                {completedTasks} of {totalTasks} tasks completed
              </Typography>
            </Card>
          )}

          {contract.status === "pending" && (
            <View style={styles.actions}>
              <Button 
                label={isProcessing ? "Processing..." : "Accept Contract"} 
                onPress={handleAccept}
                variant="primary"
                disabled={isProcessing}
              />
              <Button 
                label="Decline" 
                onPress={handleDecline}
                variant="secondary"
                disabled={isProcessing}
              />
            </View>
          )}

          {contract.status === "active" && (
            <View style={styles.actions}>
              <Button 
                label="Open Chat" 
                onPress={() => router.push(`/chat/${id}`)}
                variant="primary"
              />
            </View>
          )}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  card: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  description: {
    marginBottom: spacing[4],
  },
  details: {
    marginTop: spacing[4],
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  progressContainer: {
    marginBottom: spacing[3],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing[2],
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    textAlign: "center",
  },
  actions: {
    gap: spacing[3],
  },
});