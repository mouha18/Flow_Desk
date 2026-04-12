import React from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";

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
        <Text style={styles.iconText}>{isRunning ? "⏹" : "▶"}</Text>
      </View>
      <Text style={[styles.label, isRunning && styles.labelActive]}>
        {isRunning ? "Stop Timer" : "Start Timer"}
      </Text>
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
    borderColor: colors.primary,
  },
  containerActive: {
    backgroundColor: colors.error + "10",
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
    backgroundColor: colors.error + "20",
  },
  iconText: {
    fontSize: fontSizes.lg,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  labelActive: {
    color: colors.error,
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