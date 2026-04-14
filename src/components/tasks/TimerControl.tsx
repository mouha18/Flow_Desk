import React from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import { Play, Square } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import { Typography } from "../ui/typography";

interface TimerControlProps {
  isRunning: boolean;
  onStart?: () => void;
  onStop?: () => void;
  style?: ViewStyle;
}

export function TimerControl({
  isRunning,
  onStart,
  onStop,
  style,
}: TimerControlProps) {
  const handlePress = () => {
    if (isRunning) {
      onStop?.();
    } else {
      onStart?.();
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        isRunning ? styles.containerActive : styles.containerInactive,
        style,
      ]}
      onPress={handlePress}
    >
      <View style={[styles.icon, isRunning && styles.iconActive]}>
        {isRunning ? (
          <Square size={16} color={colors.error} strokeWidth={2} />
        ) : (
          <Play size={16} color={colors.accent} strokeWidth={2} />
        )}
      </View>
      <Typography
        variant="body"
        color={isRunning ? colors.error : colors.accent}
        style={styles.label}
      >
        {isRunning ? "Stop Timer" : "Start Timer"}
      </Typography>
      {isRunning && (
        <View style={styles.pulseIndicator}>
          <View style={styles.pulseDot} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  containerInactive: {
    backgroundColor: colors.white,
    borderColor: colors.accent,
  },
  containerActive: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  iconActive: {
    backgroundColor: colors.errorLight,
  },
  label: {
    fontWeight: fontWeights.semibold as any,
  },
  pulseIndicator: {
    marginLeft: spacing[3],
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
  },
});
