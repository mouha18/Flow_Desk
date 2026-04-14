import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Heading } from "./typography";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Section({ title, children, style, contentStyle }: SectionProps) {
  return (
    <View style={[styles.container, style]}>
      {title && (
        <Heading level="h4" style={styles.title}>
          {title}
        </Heading>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  title: {
    color: colors.gray700,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[4],
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: spacing[4],
  },
});
