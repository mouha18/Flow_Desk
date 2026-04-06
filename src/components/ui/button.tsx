import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes } from "../../constants/typography";
import { spacing, borderRadius } from "../../constants/spacing";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
    },
    text: {
      color: colors.white,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.secondary,
    },
    text: {
      color: colors.white,
    },
  },
  outline: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    text: {
      color: colors.primary,
    },
  },
  ghost: {
    container: {
      backgroundColor: colors.transparent,
    },
    text: {
      color: colors.primary,
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
    },
    text: {
      fontSize: fontSizes.sm,
    },
  },
  md: {
    container: {
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[5],
    },
    text: {
      fontSize: fontSizes.base,
    },
  },
  lg: {
    container: {
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[8],
    },
    text: {
      fontSize: fontSizes.lg,
    },
  },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const variantConfig = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        variantConfig.container,
        sizeConfig.container,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantConfig.text.color}
          size={size === "sm" ? "small" : "small"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantConfig.text,
            sizeConfig.text,
            { fontWeight: "500" },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
  },
});
