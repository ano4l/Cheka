import { Platform, type TextStyle, type ViewStyle } from "react-native";

/* ── COLOR PALETTE ──────────────────────────────────────────────────────── */
export const colors = {
  bg: "#f2f0eb",
  bgSoft: "#e8e6e1",
  card: "#ffffff",
  cardAlt: "#fafaf8",

  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textOnAccent: "#1c1917",
  textOnDark: "#ffffff",

  primary: "#1c1917",
  primaryLight: "#292524",

  accent: "#facc15",
  accentSoft: "#fef9c3",
  accentBold: "#eab308",

  white: "#ffffff",
  dark: "#1c1917",
  darkCard: "#292524",
  overlay: "rgba(28, 25, 23, 0.03)",

  riskLow: "#10b981",
  riskLowBg: "#ecfdf5",
  riskLowBorder: "rgba(16, 185, 129, 0.12)",
  riskMedium: "#f59e0b",
  riskMediumBg: "#fffbeb",
  riskMediumBorder: "rgba(245, 158, 11, 0.12)",
  riskHigh: "#ef4444",
  riskHighBg: "#fef2f2",
  riskHighBorder: "rgba(239, 68, 68, 0.12)",

  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",

  border: "rgba(28, 25, 23, 0.06)",
  borderLight: "rgba(28, 25, 23, 0.04)",
  separator: "rgba(28, 25, 23, 0.05)",
};

/* ── SPACING ────────────────────────────────────────────────────────────── */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
};

/* ── RADII ──────────────────────────────────────────────────────────────── */
export const radii = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  full: 999,
};

/* ── TYPOGRAPHY ─────────────────────────────────────────────────────────── */
export const fonts = {
  caption2: 11,
  caption: 12,
  footnote: 13,
  label: 13,
  subhead: 15,
  body: 15,
  bodyLarge: 17,
  title3: 20,
  title: 20,
  title2: 22,
  title1: 28,
  heading: 28,
  headingLarge: 34,
  hero: 44,
};

export const fontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  heavy: "800" as const,
};

export const lineHeights = {
  caption: 16,
  body: 22,
  bodyLarge: 26,
  title: 28,
  heading: 34,
};

/* ── SHADOWS ────────────────────────────────────────────────────────────── */
export function shadow(elevation: 1 | 2 | 3 | 4): ViewStyle {
  if (Platform.OS === "android") {
    return { elevation: elevation * 1.5 };
  }
  const config = {
    1: { y: 2, blur: 8, opacity: 0.04 },
    2: { y: 4, blur: 16, opacity: 0.05 },
    3: { y: 8, blur: 32, opacity: 0.06 },
    4: { y: 12, blur: 48, opacity: 0.08 },
  }[elevation];
  return {
    shadowColor: "#1c1917",
    shadowOffset: { width: 0, height: config.y },
    shadowOpacity: config.opacity,
    shadowRadius: config.blur,
  };
}

/* ── PRESETS ─────────────────────────────────────────────────────────────── */
export const cardStyle: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radii.lg,
  ...shadow(2),
};

export const screenStyle: ViewStyle = {
  flex: 1,
  backgroundColor: colors.bg,
};

export const iosCardStyle: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radii.md,
  padding: spacing.md,
  ...shadow(1),
};

export const sectionHeader: TextStyle = {
  color: colors.textMuted,
  fontSize: fonts.footnote,
  fontWeight: fontWeights.medium,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: spacing.sm,
  paddingHorizontal: spacing.xs,
};
