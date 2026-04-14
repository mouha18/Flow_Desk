export const colors = {
  // Primary (Professional Slate)
  primary: "#1E293B",      // Slate 800 — deep, professional
  primaryLight: "#475569",  // Slate 600
  primaryDark: "#0F172A",   // Slate 900

  // Secondary / Accent (Indigo)
  secondary: "#6366F1",     // Indigo 500
  secondaryLight: "#818CF8", // Indigo 400
  accent: "#6366F1",        // Indigo 500 — for CTAs and highlights
  accentLight: "#EEF2FF",   // Indigo 50 — accent background

  // Semantic colors
  success: "#10B981",       // Emerald 500
  warning: "#F59E0B",       // Amber 500
  error: "#EF4444",         // Red 500

  // Semantic light variants (solid light backgrounds)
  successLight: "#D1FAE5",  // Emerald 100
  warningLight: "#FEF3C7",  // Amber 100
  errorLight: "#FEE2E2",    // Red 100
  primaryLightBg: "#F1F5F9", // Slate 100
  secondaryLightBg: "#EEF2FF", // Indigo 50

  // Neutrals (Slate scale)
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  // Role colors (keep — already good)
  freelancer: "#10B981",    // Emerald 500
  client: "#8B5CF6",        // Violet 500

  // Role light variants (solid light backgrounds)
  freelancerLight: "#D1FAE5", // Emerald 100
  clientLight: "#EDE9FE",     // Violet 100

  // Transparent
  transparent: "transparent",

  // Border
  border: "#E2E8F0",       // Slate 200
  borderDark: "#334155",    // Slate 700
} as const;

export type ColorKey = keyof typeof colors;
