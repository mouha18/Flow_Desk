import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { formatCurrency } from "../../../lib/formatting";

interface InvoiceSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  taxRate?: number;
  onTaxRateChange?: (rate: number) => void;
  editable?: boolean;
  style?: ViewStyle;
}

export function InvoiceSummary({
  subtotal,
  tax,
  total,
  taxRate,
  onTaxRateChange,
  editable = false,
  style,
}: InvoiceSummaryProps) {
  const handleTaxRateChange = (rateStr: string) => {
    if (!onTaxRateChange) return;
    const rate = rateStr ? parseFloat(rateStr) : 0;
    onTaxRateChange(rate);
  };

  return (
    <Card style={[styles.container, style]} variant="outlined">
      {/* Subtotal Row */}
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>{formatCurrency(subtotal, "USD")}</Text>
      </View>

      {/* Tax Row */}
      <View style={styles.row}>
        <View style={styles.taxLabel}>
          <Text style={styles.label}>Tax</Text>
          {editable && taxRate !== undefined && (
            <View style={styles.taxInputContainer}>
              <Input
                value={String(taxRate)}
                onChangeText={handleTaxRateChange}
                placeholder="0"
                keyboardType="numeric"
                containerStyle={styles.taxInput}
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          )}
          {!editable && taxRate !== undefined && taxRate > 0 && (
            <Text style={styles.taxRateText}>({taxRate}%)</Text>
          )}
        </View>
        <Text style={styles.value}>{formatCurrency(tax, "USD")}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Total Row */}
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total, "USD")}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  label: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
  },
  value: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray800,
  },
  taxLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  taxRateText: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginLeft: spacing[1],
  },
  taxInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing[2],
  },
  taxInput: {
    width: 60,
    marginBottom: 0,
  },
  percentSign: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
    marginLeft: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[2],
  },
  totalLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
  },
  totalValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
});
