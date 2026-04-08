import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, fontWeights, lineHeights, radii, spacing } from "../lib/theme";
import type { PreviewAnalysisResponse } from "../lib/types";

import { RiskBadge } from "./RiskBadge";

interface Props {
  analysis: PreviewAnalysisResponse;
  escalationRecommended: boolean;
}

function SectionBlock({
  icon,
  title,
  items,
  fallback,
  variant = "default",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  items: string[];
  fallback: string;
  variant?: "default" | "danger";
}) {
  const isDanger = variant === "danger";
  return (
    <View
      style={[
        styles.sectionBlock,
        isDanger && styles.sectionDanger,
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons
          name={icon}
          size={16}
          color={isDanger ? colors.riskHigh : colors.textMuted}
        />
        <Text
          style={[
            styles.sectionTitle,
            isDanger && { color: colors.riskHigh },
          ]}
        >
          {title}
        </Text>
      </View>
      {(items.length > 0 ? items : [fallback]).map((item, i) => (
        <View key={`${title}-${i}`} style={styles.sectionItemRow}>
          <View
            style={[
              styles.sectionDot,
              {
                backgroundColor: isDanger
                  ? colors.riskHigh
                  : colors.textMuted,
              },
            ]}
          />
          <Text
            style={[
              styles.sectionItem,
              isDanger && { color: "#7f1d1d" },
            ]}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function AnalysisCard({ analysis, escalationRecommended }: Props) {
  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Analysis Result</Text>
          <Text style={styles.contractType}>{analysis.contract_type}</Text>
        </View>
        <RiskBadge score={analysis.risk_score} level={analysis.risk_level} />
      </View>

      {escalationRecommended && (
        <View style={styles.escalation}>
          <Ionicons name="warning" size={14} color={colors.riskHigh} />
          <Text style={styles.escalationText}>Escalation recommended</Text>
        </View>
      )}

      {/* ── Summary ── */}
      <Text style={styles.summary}>{analysis.summary}</Text>

      {/* ── Sections ── */}
      <SectionBlock
        icon="key-outline"
        title="Key Points"
        items={analysis.key_points}
        fallback=""
      />

      <SectionBlock
        icon="flag-outline"
        title="Red Flags"
        items={analysis.red_flags}
        fallback="No red flags were isolated in the preview."
        variant="danger"
      />

      <SectionBlock
        icon="checkmark-circle-outline"
        title="Recommended Actions"
        items={analysis.recommended_actions}
        fallback=""
      />

      <SectionBlock
        icon="cash-outline"
        title="Financial Obligations"
        items={analysis.financial_obligations}
        fallback="No explicit payment sentence was isolated."
      />

      <SectionBlock
        icon="calendar-outline"
        title="Duration Terms"
        items={analysis.duration_terms}
        fallback="No obvious duration term was isolated."
      />

      <SectionBlock
        icon="close-circle-outline"
        title="Cancellation Terms"
        items={analysis.cancellation_terms}
        fallback="No obvious cancellation term was isolated."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: fonts.caption,
    fontWeight: fontWeights.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contractType: {
    color: colors.textPrimary,
    fontSize: fonts.title2,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  escalation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.riskHighBg,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  escalationText: {
    color: colors.riskHigh,
    fontSize: 12,
    fontWeight: fontWeights.semibold,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: fonts.body,
    lineHeight: lineHeights.bodyLarge,
  },
  sectionBlock: {
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    gap: 6,
    padding: spacing.md,
  },
  sectionDanger: {
    backgroundColor: colors.riskHighBg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fonts.label,
    fontWeight: fontWeights.semibold,
  },
  sectionItemRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  sectionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
  },
  sectionItem: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fonts.body,
    lineHeight: lineHeights.body,
  },
});
