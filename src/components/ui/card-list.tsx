import React from "react";
import { View, StyleSheet, ViewStyle, Pressable } from "react-native";
import { Typography } from "./typography";
import { colors } from "../../constants/colors";
import { spacing, borderRadius } from "../../constants/spacing";

interface CardListProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardList({ children, style }: CardListProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

interface CardListItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CardListItem({ children, onPress, style }: CardListItemProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.item, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.item, style]}>{children}</View>;
}

interface CardListItemContentProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  showDivider?: boolean;
}

export function CardListItemContent({
  label,
  value,
  children,
  showDivider = true,
}: CardListItemContentProps) {
  return (
    <View style={styles.itemContent}>
      <View style={styles.itemRow}>
        <Typography variant="label" color={colors.gray500}>
          {label}
        </Typography>
        {value && (
          <Typography variant="body" color={colors.gray900}>
            {value}
          </Typography>
        )}
        {children}
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  item: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  pressed: {
    backgroundColor: colors.gray50,
  },
  itemContent: {},
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: spacing[6],
  },
  divider: {
    position: "absolute",
    bottom: 0,
    left: spacing[4],
    right: 0,
    height: 1,
    backgroundColor: colors.gray100,
  },
});
