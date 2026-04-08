import { Platform, type TextStyle, type ViewStyle } from "react-native";

/* ── COLOR PALETTE ──────────────────────────────────────────────────────── */
export const colors = {
  bg: "#ffffff",
  bgSoft: "#f7f7f7",
  card: "#ffffff",
  cardAlt: "#fafafa",

  textPrimary: "#0d1b12",
  textSecondary: "#52665a",
  textMuted: "#94a39a",
  textOnAccent: "#0d1b12",
  textOnDark: "#ffffff",

  primary: "#163326",
  primaryLight: "#1e4a35",

  accent: "#c3d63e",
  accentSoft: "#eef4cc",
  accentBold: "#a8bc2a",

  white: "#ffffff",
  dark: "#163326",
  darkCard: "#1e3a2c",
  overlay: "rgba(13, 27, 18, 0.03)",

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

  border: "rgba(13, 27, 18, 0.08)",
  borderLight: "rgba(13, 27, 18, 0.04)",
  separator: "rgba(13, 27, 18, 0.06)",
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
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
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
    1: { y: 1, blur: 3, opacity: 0.04 },
    2: { y: 2, blur: 8, opacity: 0.06 },
    3: { y: 4, blur: 16, opacity: 0.08 },
    4: { y: 8, blur: 24, opacity: 0.1 },
  }[elevation];
  return {
    shadowColor: "#0d1b12",
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
