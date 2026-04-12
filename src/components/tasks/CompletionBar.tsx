import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";

interface CompletionBarProps {
  percent: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

export function CompletionBar({
  percent,
  showLabel = true,
  style,
}: CompletionBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>Completion</Text>
          <Text style={styles.value}>{clampedPercent}%</Text>
        </View>
      )}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${clampedPercent}%` },
            clampedPercent === 100 && styles.progressFillComplete,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray700,
  },
  value: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressFillComplete: {
    backgroundColor: colors.success,
  },
});