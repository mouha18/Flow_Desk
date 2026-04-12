import React from "react";
import { ScrollView, View, ViewStyle, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
}

export function Screen({
  children,
  style,
  contentContainerStyle,
  scrollable = true,
}: ScreenProps) {
  if (scrollable) {
    return (
      <ScrollView
        style={[styles.container, style]}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  contentContainer: {
    flexGrow: 1,
    padding: spacing[4],
  },
});
