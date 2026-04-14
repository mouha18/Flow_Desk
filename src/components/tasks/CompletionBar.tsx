import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { borderRadius, spacing } from "../../constants/spacing";
import { Typography } from "../ui/typography";

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
          <Typography variant="label" color={colors.gray700}>
            Completion
          </Typography>
          <Typography variant="label" color={colors.accent} style={styles.value}>
            {clampedPercent}%
          </Typography>
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
  value: {
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  progressFillComplete: {
    backgroundColor: colors.success,
  },
});
