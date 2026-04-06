export const colors = {
  // Primary
  primary: "#007AFF",
  primaryLight: "#4DA3FF",
  primaryDark: "#0055CC",

  // Secondary
  secondary: "#5856D6",

  // Semantic
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",

  // Neutrals
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Role colors
  freelancer: "#10B981",
  client: "#8B5CF6",

  // Transparent
  transparent: "transparent",

  // Border
  border: "#E5E7EB",
  borderDark: "#374151",
} as const;

export type ColorKey = keyof typeof colors;
