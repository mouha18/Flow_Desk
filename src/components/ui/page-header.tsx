import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Heading, Typography } from "./typography";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  style?: ViewStyle;
}

export function PageHeader({ title, subtitle, actions, style }: PageHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Heading level="h2">{title}</Heading>
        {subtitle && (
          <Typography variant="bodySmall" color={colors.gray500} style={styles.subtitle}>
            {subtitle}
          </Typography>
        )}
      </View>
      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing[1],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
});
