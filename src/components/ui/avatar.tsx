import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes } from "../../constants/typography";
import { borderRadius } from "../../constants/spacing";
import { Heading } from "./typography";

type AvatarSize = "sm" | "md" | "lg";
type AvatarVariant = "default" | "freelancer" | "client";

interface AvatarProps {
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, { container: number; fontSize: "sm" | "lg" }> = {
  sm: { container: 32, fontSize: "sm" },
  md: { container: 48, fontSize: "lg" },
  lg: { container: 80, fontSize: "lg" },
};

const variantColors: Record<AvatarVariant, string> = {
  default: colors.primary,
  freelancer: colors.freelancer,
  client: colors.client,
};

export function Avatar({
  name,
  size = "md",
  variant = "default",
  style,
}: AvatarProps) {
  const initials = name?.charAt(0).toUpperCase() || "?";
  const backgroundColor = variantColors[variant];
  const { container: containerSize } = sizeMap[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Heading level="h4" color={colors.white}>
        {initials}
      </Heading>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
