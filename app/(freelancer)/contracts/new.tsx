import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Screen, Card } from "@/components/ui";
import { CreateContractForm, type CreateContractFormData } from "@/components/contracts/CreateContractForm";
import { useContracts } from "@/hooks/useContracts";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function FreelancerNewContractScreen() {
  const router = useRouter();
  const { createContract } = useContracts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateContractFormData) => {
    try {
      setIsSubmitting(true);
      await createContract({
        title: data.title,
        clientEmail: data.clientEmail,
        pricingType: data.pricingType,
        fixedPrice: data.pricingType === "fixed" ? parseFloat(data.fixedPrice) : 0,
        hourlyRate: data.pricingType === "hourly" ? parseFloat(data.hourlyRate) : 0,
        paymentTiming: data.paymentTiming,
        paymentMethod: data.paymentMethod,
        aiEmailTone: data.aiEmailTone,
      });
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create contract. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "New Contract",
          headerLargeTitle: true,
          presentation: "modal",
        }}
      />
      <Screen style={styles.container}>
        <Card style={styles.card}>
          <CreateContractForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={isSubmitting}
          />
        </Card>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  card: {
    margin: spacing[4],
    padding: spacing[4],
  },
});
