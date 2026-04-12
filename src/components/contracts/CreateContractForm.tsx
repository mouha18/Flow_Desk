import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import {
  PricingType,
  PaymentTiming,
  PaymentMethod,
  AiEmailTone,
} from "../../types/index";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface CreateContractFormProps {
  onSubmit: (data: CreateContractFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

export interface CreateContractFormData {
  title: string;
  clientEmail: string;
  pricingType: PricingType;
  fixedPrice: string;
  hourlyRate: string;
  paymentTiming: PaymentTiming;
  paymentMethod: PaymentMethod;
  aiEmailTone: AiEmailTone;
}

const initialFormData: CreateContractFormData = {
  title: "",
  clientEmail: "",
  pricingType: "fixed",
  fixedPrice: "",
  hourlyRate: "",
  paymentTiming: "now",
  paymentMethod: "stripe",
  aiEmailTone: "friendly",
};

export function CreateContractForm({
  onSubmit,
  onCancel,
  loading = false,
  style,
}: CreateContractFormProps) {
  const [formData, setFormData] = useState<CreateContractFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateContractFormData, string>>>({});

  const updateField = <K extends keyof CreateContractFormData>(
    field: K,
    value: CreateContractFormData[K]
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // If switching to hourly, force paymentTiming to "later"
      if (field === "pricingType" && value === "hourly") {
        newData.paymentTiming = "later";
        newData.fixedPrice = "";
      }
      
      // If switching to fixed, clear hourlyRate
      if (field === "pricingType" && value === "fixed") {
        newData.hourlyRate = "";
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateContractFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = "Client email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = "Invalid email format";
    }
    
    // Validation for fixed pricing
    if (formData.pricingType === "fixed") {
      const price = parseFloat(formData.fixedPrice);
      if (!formData.fixedPrice.trim()) {
        newErrors.fixedPrice = "Price is required for fixed pricing";
      } else if (isNaN(price) || price <= 0) {
        newErrors.fixedPrice = "Please enter a valid price";
      }
    }
    
    // Validation for hourly pricing
    if (formData.pricingType === "hourly") {
      const rate = parseFloat(formData.hourlyRate);
      if (!formData.hourlyRate.trim()) {
        newErrors.hourlyRate = "Hourly rate is required for hourly pricing";
      } else if (isNaN(rate) || rate <= 0) {
        newErrors.hourlyRate = "Please enter a valid hourly rate";
      }
    }
    
    // Validation: Pay Now requires fixed pricing
    if (formData.paymentTiming === "now" && formData.pricingType !== "fixed") {
      newErrors.paymentTiming = "Pay Now is only available for fixed price contracts";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Contract Details</Text>

      <Input
        label="Contract Title"
        placeholder="e.g., Website Redesign Project"
        value={formData.title}
        onChangeText={(value) => updateField("title", value)}
        error={errors.title}
      />

      <Text style={styles.sectionTitle}>Client Information</Text>

      <Input
        label="Client Email"
        placeholder="client@example.com"
        value={formData.clientEmail}
        onChangeText={(value) => updateField("clientEmail", value)}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.clientEmail}
      />

      <Text style={styles.sectionTitle}>Pricing</Text>

      <View style={styles.segmentedControl}>
        <SegmentedButton
          label="Fixed Price"
          selected={formData.pricingType === "fixed"}
          onPress={() => updateField("pricingType", "fixed")}
        />
        <SegmentedButton
          label="Hourly"
          selected={formData.pricingType === "hourly"}
          onPress={() => updateField("pricingType", "hourly")}
        />
      </View>

      {formData.pricingType === "fixed" && (
        <Input
          label="Fixed Price ($)"
          placeholder="500.00"
          value={formData.fixedPrice}
          onChangeText={(value) => updateField("fixedPrice", value)}
          keyboardType="decimal-pad"
          error={errors.fixedPrice}
        />
      )}

      {formData.pricingType === "hourly" && (
        <Input
          label="Hourly Rate ($)"
          placeholder="50.00"
          value={formData.hourlyRate}
          onChangeText={(value) => updateField("hourlyRate", value)}
          keyboardType="decimal-pad"
          error={errors.hourlyRate}
        />
      )}

      <Text style={styles.sectionTitle}>Payment</Text>

      <View style={styles.segmentedControl}>
        <SegmentedButton
          label="Pay Now"
          selected={formData.paymentTiming === "now"}
          onPress={() => {
            if (formData.pricingType === "fixed") {
              updateField("paymentTiming", "now");
            }
          }}
          disabled={formData.pricingType === "hourly"}
        />
        <SegmentedButton
          label="Pay Later"
          selected={formData.paymentTiming === "later"}
          onPress={() => updateField("paymentTiming", "later")}
        />
      </View>

      {formData.paymentTiming === "now" && formData.pricingType === "fixed" && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Client will pay immediately at contract completion
          </Text>
        </View>
      )}

      {formData.paymentTiming === "now" && errors.paymentTiming && (
        <Text style={styles.errorText}>{errors.paymentTiming}</Text>
      )}

      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.optionGroup}>
        <OptionButton
          label="Stripe"
          selected={formData.paymentMethod === "stripe"}
          onPress={() => updateField("paymentMethod", "stripe")}
        />
        <OptionButton
          label="Naboo Orange"
          selected={formData.paymentMethod === "naboo_orange"}
          onPress={() => updateField("paymentMethod", "naboo_orange")}
        />
        <OptionButton
          label="Naboo Wave"
          selected={formData.paymentMethod === "naboo_wave"}
          onPress={() => updateField("paymentMethod", "naboo_wave")}
        />
      </View>

      <Text style={styles.sectionTitle}>AI Email Tone</Text>

      <View style={styles.optionGroup}>
        <OptionButton
          label="Formal"
          selected={formData.aiEmailTone === "formal"}
          onPress={() => updateField("aiEmailTone", "formal")}
        />
        <OptionButton
          label="Friendly"
          selected={formData.aiEmailTone === "friendly"}
          onPress={() => updateField("aiEmailTone", "friendly")}
        />
        <OptionButton
          label="Casual"
          selected={formData.aiEmailTone === "casual"}
          onPress={() => updateField("aiEmailTone", "casual")}
        />
      </View>

      <View style={styles.actions}>
        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
          />
        )}
        <Button
          title={loading ? "Creating..." : "Create Contract"}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
}

interface SegmentedButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function SegmentedButton({ label, selected, onPress, disabled }: SegmentedButtonProps) {
  return (
    <View
      style={[
        styles.segmentedButton, 
        selected && styles.segmentedButtonSelected,
        disabled && styles.segmentedButtonDisabled,
      ]}
    >
      <Text
        style={[
          styles.segmentedButtonText,
          selected && styles.segmentedButtonTextSelected,
          disabled && styles.segmentedButtonTextDisabled,
        ]}
        onPress={disabled ? undefined : onPress}
      >
        {label}
      </Text>
    </View>
  );
}

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function OptionButton({ label, selected, onPress }: OptionButtonProps) {
  return (
    <View
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
    >
      <Text
        style={[styles.optionButtonText, selected && styles.optionButtonTextSelected]}
        onPress={onPress}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray700,
    marginBottom: spacing[2],
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    marginBottom: spacing[4],
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: "center",
    borderRadius: borderRadius.md,
  },
  segmentedButtonSelected: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedButtonDisabled: {
    opacity: 0.5,
  },
  segmentedButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray600,
  },
  segmentedButtonTextSelected: {
    color: colors.primary,
  },
  segmentedButtonTextDisabled: {
    color: colors.gray400,
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  optionButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + "20",
  },
  optionButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray600,
  },
  optionButtonTextSelected: {
    color: colors.primary,
  },
  infoBox: {
    backgroundColor: colors.primaryLight + "20",
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
  errorText: {
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: -spacing[2],
    marginBottom: spacing[3],
  },
  actions: {
    flexDirection: "row",
    marginTop: spacing[8],
    marginBottom: spacing[10],
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
