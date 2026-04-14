import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "accent" | "freelancer" | "client";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: { color: string } }> = {
  default: {
    container: {
      backgroundColor: colors.gray100,
    },
    text: {
      color: colors.gray700,
    },
  },
  success: {
    container: {
      backgroundColor: colors.successLight,
    },
    text: {
      color: colors.success,
    },
  },
  warning: {
    container: {
      backgroundColor: colors.warningLight,
    },
    text: {
      color: colors.warning,
    },
  },
  error: {
    container: {
      backgroundColor: colors.errorLight,
    },
    text: {
      color: colors.error,
    },
  },
  accent: {
    container: {
      backgroundColor: colors.accentLight,
    },
    text: {
      color: colors.accent,
    },
  },
  freelancer: {
    container: {
      backgroundColor: colors.freelancerLight,
    },
    text: {
      color: colors.freelancer,
    },
  },
  client: {
    container: {
      backgroundColor: colors.clientLight,
    },
    text: {
      color: colors.client,
    },
  },
};

export function Badge({ label, variant = "default", style }: BadgeProps) {
  const variantConfig = variantStyles[variant];

  return (
    <View style={[styles.container, variantConfig.container, style]}>
      <Text style={[styles.text, { fontWeight: "500" }, variantConfig.text]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fontSizes.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
