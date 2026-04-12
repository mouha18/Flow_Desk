import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import type { PaymentMethod } from "../../types/index";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface PaymentSimulationProps {
  total: number;
  onPayment: (method: PaymentMethod) => Promise<void>;
  isProcessing?: boolean;
  deliverableLink?: string | null;
  preferredMethod?: PaymentMethod;
  style?: ViewStyle;
}

type PaymentMethodInfo = {
  id: PaymentMethod;
  label: string;
  icon: string;
  description: string;
};

const paymentMethods: PaymentMethodInfo[] = [
  {
    id: "stripe",
    label: "Stripe",
    icon: "💳",
    description: "Pay with credit/debit card",
  },
  {
    id: "naboo_orange",
    label: "Orange Money",
    icon: "🍊",
    description: "Pay via Orange Money",
  },
  {
    id: "naboo_wave",
    label: "Wave",
    icon: "🌊",
    description: "Pay via Wave",
  },
];

export function PaymentSimulation({
  total,
  onPayment,
  isProcessing = false,
  deliverableLink,
  preferredMethod,
  style,
}: PaymentSimulationProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(preferredMethod ?? null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setError(null);
  };

  const validateInputs = (): boolean => {
    if (!selectedMethod) {
      setError("Please select a payment method");
      return false;
    }

    if (selectedMethod === "stripe") {
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
        setError("Please enter a valid card number");
        return false;
      }
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setError("Please enter expiry as MM/YY");
        return false;
      }
      if (!cardCvc || cardCvc.length < 3) {
        setError("Please enter a valid CVC");
        return false;
      }
    }

    if (selectedMethod === "naboo_orange" || selectedMethod === "naboo_wave") {
      if (!phoneNumber || phoneNumber.length < 8) {
        setError("Please enter a valid phone number");
        return false;
      }
    }

    return true;
  };

  const handlePayNow = async () => {
    if (!validateInputs()) return;

    setError(null);
    try {
      await onPayment(selectedMethod!);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  if (success) {
    return (
      <Card style={[styles.container, style]} variant="outlined">
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your payment of ${total.toFixed(2)} has been processed.
          </Text>
          {deliverableLink && (
            <View style={styles.deliverableContainer}>
              <Text style={styles.deliverableLabel}>Your deliverable:</Text>
              <Pressable>
                <Text style={styles.deliverableLink} numberOfLines={1}>
                  {deliverableLink}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.container, style]} variant="outlined">
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>

      {/* Payment Method Selection */}
      <Text style={styles.sectionLabel}>Select Payment Method</Text>
      <View style={styles.methodsContainer}>
        {paymentMethods.map((method) => (
          <Pressable
            key={method.id}
            onPress={() => handleMethodSelect(method.id)}
            style={[
              styles.methodButton,
              selectedMethod === method.id && styles.methodButtonSelected,
              method.id === preferredMethod && styles.methodButtonPreferred,
            ]}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <View style={styles.methodInfo}>
              <View style={styles.methodLabelRow}>
                <Text
                  style={[
                    styles.methodLabel,
                    selectedMethod === method.id && styles.methodLabelSelected,
                  ]}
                >
                  {method.label}
                </Text>
                {method.id === preferredMethod && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>Recommended</Text>
                  </View>
                )}
              </View>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
            <View
              style={[
                styles.radio,
                selectedMethod === method.id && styles.radioSelected,
              ]}
            >
              {selectedMethod === method.id && (
                <View style={styles.radioInner} />
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {/* Stripe Card Inputs */}
      {selectedMethod === "stripe" && (
        <View style={styles.cardInputs}>
          <Input
            label="Card Number"
            value={cardNumber}
            onChangeText={(text) => setCardNumber(formatCardNumber(text))}
            placeholder="1234 5678 9012 3456"
            keyboardType="numeric"
          />
          <View style={styles.cardRow}>
            <View style={styles.cardHalf}>
              <Input
                label="Expiry (MM/YY)"
                value={cardExpiry}
                onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                placeholder="MM/YY"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.cardHalf}>
              <Input
                label="CVC"
                value={cardCvc}
                onChangeText={(text) => setCardCvc(text.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
          </View>
        </View>
      )}

      {/* Orange Money / Wave Phone Input */}
      {(selectedMethod === "naboo_orange" || selectedMethod === "naboo_wave") && (
        <View style={styles.phoneInput}>
          <Input
            label="Phone Number"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, "").slice(0, 9))}
            placeholder="77 123 4567"
            keyboardType="phone-pad"
          />
          <Text style={styles.phoneHint}>
            You will receive a payment request on your phone.
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Pay Now Button */}
      <Button
        title={isProcessing ? "Processing..." : "Pay Now"}
        onPress={handlePayNow}
        loading={isProcessing}
        disabled={!selectedMethod || isProcessing}
        fullWidth
        size="lg"
      />

      {/* Security Note */}
      <Text style={styles.securityNote}>
        🔒 This is a simulated payment for testing purposes.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
    marginBottom: spacing[2],
  },
  totalAmount: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.bold,
    color: colors.primary,
    marginBottom: spacing[6],
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray700,
    marginBottom: spacing[3],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  methodsContainer: {
    marginBottom: spacing[4],
  },
  methodButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
    backgroundColor: colors.white,
  },
  methodButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "08",
  },
  methodButtonPreferred: {
    borderColor: colors.success,
    backgroundColor: colors.success + "08",
  },
  methodLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  recommendedBadge: {
    backgroundColor: colors.success + "20",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  recommendedBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.success,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: spacing[3],
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.gray800,
  },
  methodLabelSelected: {
    color: colors.primary,
  },
  methodDescription: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: spacing[1],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  cardInputs: {
    marginBottom: spacing[4],
  },
  cardRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  cardHalf: {
    flex: 1,
  },
  phoneInput: {
    marginBottom: spacing[4],
  },
  phoneHint: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: -spacing[2],
  },
  errorContainer: {
    backgroundColor: colors.error + "15",
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: colors.error,
    textAlign: "center",
  },
  securityNote: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    textAlign: "center",
    marginTop: spacing[4],
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  successIconText: {
    fontSize: 32,
    color: colors.success,
  },
  successTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
    marginBottom: spacing[2],
  },
  successSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
    textAlign: "center",
    marginBottom: spacing[4],
  },
  deliverableContainer: {
    width: "100%",
    backgroundColor: colors.gray50,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginTop: spacing[2],
  },
  deliverableLabel: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginBottom: spacing[1],
    textTransform: "uppercase",
  },
  deliverableLink: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
});
