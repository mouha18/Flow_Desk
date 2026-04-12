import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import type { LineItem } from "../../types/index";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface InvoiceLineItemsProps {
  lineItems: LineItem[];
  onChange?: (lineItems: LineItem[]) => void;
  editable?: boolean;
  style?: ViewStyle;
}

function calculateAmount(hours: number | null, rate: number | null): number {
  if (hours !== null && rate !== null) {
    return hours * rate;
  }
  return 0;
}

export function InvoiceLineItems({
  lineItems,
  onChange,
  editable = false,
  style,
}: InvoiceLineItemsProps) {
  const handleDescriptionChange = (index: number, description: string) => {
    if (!onChange) return;
    const updated = [...lineItems];
    updated[index] = { ...updated[index], description };
    onChange(updated);
  };

  const handleHoursChange = (index: number, hoursStr: string) => {
    if (!onChange) return;
    const updated = [...lineItems];
    const hours = hoursStr ? parseFloat(hoursStr) : null;
    updated[index] = { ...updated[index], hours };
    // Recalculate amount
    updated[index] = {
      ...updated[index],
      amount: calculateAmount(hours, updated[index].rate),
    };
    onChange(updated);
  };

  const handleRateChange = (index: number, rateStr: string) => {
    if (!onChange) return;
    const updated = [...lineItems];
    const rate = rateStr ? parseFloat(rateStr) : null;
    updated[index] = { ...updated[index], rate };
    // Recalculate amount
    updated[index] = {
      ...updated[index],
      amount: calculateAmount(updated[index].hours, rate),
    };
    onChange(updated);
  };

  const handleAmountChange = (index: number, amountStr: string) => {
    if (!onChange) return;
    const updated = [...lineItems];
    const amount = amountStr ? parseFloat(amountStr) : 0;
    updated[index] = { ...updated[index], amount };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    if (!onChange) return;
    const updated = lineItems.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAdd = () => {
    if (!onChange) return;
    const updated = [
      ...lineItems,
      { description: "", hours: null, rate: null, amount: 0 },
    ];
    onChange(updated);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerText, styles.descriptionHeader]}>Description</Text>
        <Text style={[styles.headerText, styles.hoursHeader]}>Hours</Text>
        <Text style={[styles.headerText, styles.rateHeader]}>Rate</Text>
        <Text style={[styles.headerText, styles.amountHeader]}>Amount</Text>
        {editable && <View style={styles.actionHeader} />}
      </View>

      {/* Line Items */}
      {lineItems.map((item, index) => (
        <View key={index} style={styles.row}>
          {editable ? (
            <>
              <View style={styles.descriptionCell}>
                <Input
                  value={item.description}
                  onChangeText={(text) => handleDescriptionChange(index, text)}
                  placeholder="Task description"
                  containerStyle={styles.noMargin}
                />
              </View>
              <View style={styles.hoursCell}>
                <Input
                  value={item.hours !== null ? String(item.hours) : ""}
                  onChangeText={(text) => handleHoursChange(index, text)}
                  placeholder="0"
                  keyboardType="numeric"
                  containerStyle={styles.noMargin}
                />
              </View>
              <View style={styles.rateCell}>
                <Input
                  value={item.rate !== null ? String(item.rate) : ""}
                  onChangeText={(text) => handleRateChange(index, text)}
                  placeholder="0"
                  keyboardType="numeric"
                  containerStyle={styles.noMargin}
                />
              </View>
              <View style={styles.amountCell}>
                <Input
                  value={String((item.amount ?? 0).toFixed(2))}
                  onChangeText={(text) => handleAmountChange(index, text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  containerStyle={styles.noMargin}
                />
              </View>
              <View style={styles.actionCell}>
                <Pressable onPress={() => handleRemove(index)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>×</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.cellText, styles.descriptionCell]} numberOfLines={2}>
                {item.description || "-"}
              </Text>
              <Text style={[styles.cellText, styles.hoursCell]}>
                {item.hours != null ? item.hours.toFixed(2) : "-"}
              </Text>
              <Text style={[styles.cellText, styles.rateCell]}>
                {item.rate != null ? `${item.rate.toFixed(2)}` : "-"}
              </Text>
              <Text style={[styles.cellText, styles.amountCell]}>
                ${(item.amount ?? 0).toFixed(2)}
              </Text>
              <View style={styles.actionCell} />
            </>
          )}
        </View>
      ))}

      {/* Add Line Item Button */}
      {editable && (
        <View style={styles.addButtonContainer}>
          <Button
            title="+ Add Line Item"
            onPress={handleAdd}
            variant="outline"
            size="sm"
          />
        </View>
      )}

      {/* Empty State */}
      {lineItems.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No line items</Text>
          {editable && (
            <Button
              title="+ Add First Item"
              onPress={handleAdd}
              variant="outline"
              size="sm"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  cellText: {
    fontSize: fontSizes.sm,
    color: colors.gray800,
  },
  descriptionHeader: {
    flex: 2,
  },
  hoursHeader: {
    flex: 0.75,
    textAlign: "right",
  },
  rateHeader: {
    flex: 0.75,
    textAlign: "right",
  },
  amountHeader: {
    flex: 0.75,
    textAlign: "right",
  },
  actionHeader: {
    width: 32,
  },
  descriptionCell: {
    flex: 2,
    marginRight: spacing[2],
  },
  hoursCell: {
    flex: 0.75,
    marginRight: spacing[2],
  },
  rateCell: {
    flex: 0.75,
    marginRight: spacing[2],
  },
  amountCell: {
    flex: 0.75,
    marginRight: spacing[2],
  },
  actionCell: {
    width: 32,
    alignItems: "center",
  },
  noMargin: {
    marginBottom: 0,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.error,
    lineHeight: 20,
  },
  addButtonContainer: {
    padding: spacing[3],
  },
  emptyState: {
    padding: spacing[6],
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: fontSizes.sm,
    color: colors.gray500,
    marginBottom: spacing[3],
  },
});
