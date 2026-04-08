import { StyleSheet, Text, View } from "react-native";

import { colors, fontWeights, radii, shadow } from "../lib/theme";
import type { RiskClassification } from "../lib/types";

const riskStyles: Record<
  RiskClassification,
  { bg: string; text: string; dot: string }
> = {
  low: {
    bg: colors.riskLowBg,
    text: colors.riskLow,
    dot: colors.riskLow,
  },
  medium: {
    bg: colors.riskMediumBg,
    text: colors.riskMedium,
    dot: colors.riskMedium,
  },
  high: {
    bg: colors.riskHighBg,
    text: colors.riskHigh,
    dot: colors.riskHigh,
  },
};

interface Props {
  score: number;
  level: RiskClassification;
  compact?: boolean;
}

export function RiskBadge({ score, level, compact }: Props) {
  const rs = riskStyles[level];

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: rs.bg }]}>
        <View style={[styles.dot, { backgroundColor: rs.dot }]} />
        <Text style={[styles.compactLabel, { color: rs.text }]}>{score}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: rs.bg }, shadow(1)]}>
      <View style={[styles.dot, { backgroundColor: rs.dot }]} />
      <Text style={[styles.label, { color: rs.text }]}>
        {score} — {level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  compactBadge: {
    borderRadius: radii.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
});
