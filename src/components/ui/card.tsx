import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors } from "../../constants/colors";
import { borderRadius, shadows, spacing } from "../../constants/spacing";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "outlined";
}

export function Card({ children, style, variant = "default" }: CardProps) {
  return (
    <View
      style={[
        styles.container,
        variant === "default" && styles.default,
        variant === "outlined" && styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  default: {
    backgroundColor: colors.white,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
