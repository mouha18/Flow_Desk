import React from "react";
import { View, Text, TextInput as RNTextInput, StyleSheet, ViewStyle, TextInputProps as RNTextInputProps } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";

interface InputProps extends Omit<RNTextInputProps, "style"> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { fontWeight: "500" }]}>{label}</Text>
      )}
      <RNTextInput
        style={[
          styles.input,
          error && styles.inputError,
        ]}
        placeholderTextColor={colors.gray400}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { fontWeight: "500" }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: fontSizes.sm,
    color: colors.gray700,
    marginBottom: spacing[1],
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    fontSize: fontSizes.base,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: fontSizes.sm,
    color: colors.error,
    marginTop: spacing[1],
  },
});
