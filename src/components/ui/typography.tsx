import React from "react";
import { Text as RNText, StyleSheet, TextStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights, lineHeights } from "../../constants/typography";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

interface HeadingProps {
  children: React.ReactNode;
  level?: HeadingLevel;
  color?: string;
  style?: TextStyle;
}

const headingStyles: Record<HeadingLevel, TextStyle> = {
  h1: {
    fontSize: fontSizes["3xl"],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes["3xl"] * lineHeights.tight,
  },
  h2: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes["2xl"] * lineHeights.tight,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },
  h4: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.tight,
  },
};

export function Heading({ children, level = "h2", color = colors.gray900, style }: HeadingProps) {
  return (
    <RNText style={[headingStyles[level], { color }, style]}>
      {children}
    </RNText>
  );
}

type TextVariant = "body" | "bodySmall" | "caption" | "label";

interface TypographyProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: TextStyle;
  selectable?: boolean;
}

const textStyles: Record<TextVariant, TextStyle> = {
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
};

export function Typography({
  children,
  variant = "body",
  color = colors.gray700,
  style,
  selectable = false,
}: TypographyProps) {
  return (
    <RNText
      style={[textStyles[variant], { color }, style]}
      selectable={selectable}
    >
      {children}
    </RNText>
  );
}
