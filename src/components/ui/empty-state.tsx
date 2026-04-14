import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { Typography, Heading } from "./typography";
import { Icon, type IconName } from "./icon";

type EmptyStateVariant = "default" | "chat" | "contracts" | "tasks" | "notifications" | "search";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  variant?: EmptyStateVariant;
  style?: ViewStyle;
}

const variantConfig: Record<EmptyStateVariant, { backgroundColor: string; iconColor: string; iconName: IconName }> = {
  default: {
    backgroundColor: colors.gray100,
    iconColor: colors.gray400,
    iconName: "mail",
  },
  chat: {
    backgroundColor: colors.accentLight,
    iconColor: colors.accent,
    iconName: "message-circle",
  },
  contracts: {
    backgroundColor: colors.successLight,
    iconColor: colors.success,
    iconName: "handshake",
  },
  tasks: {
    backgroundColor: colors.warningLight,
    iconColor: colors.warning,
    iconName: "clipboard-list",
  },
  notifications: {
    backgroundColor: colors.clientLight,
    iconColor: colors.client,
    iconName: "bell",
  },
  search: {
    backgroundColor: colors.gray100,
    iconColor: colors.gray400,
    iconName: "search",
  },
};

export function EmptyState({
  title,
  subtitle,
  variant = "default",
  style,
}: EmptyStateProps) {
  const config = variantConfig[variant];

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: config.backgroundColor },
        ]}
      >
        <Icon name={config.iconName} size="xl" color={config.iconColor} />
      </View>
      <Heading level="h3" color={colors.gray700} style={styles.title}>
        {title}
      </Heading>
      {subtitle && (
        <Typography
          variant="bodySmall"
          color={colors.gray500}
          style={styles.subtitle}
        >
          {subtitle}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[8],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  title: {
    textAlign: "center",
    marginBottom: spacing[2],
  },
  subtitle: {
    textAlign: "center",
  },
});
