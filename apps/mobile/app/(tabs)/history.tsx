import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { useJobsStore } from "../../lib/store";
import { colors, fonts, fontWeights, radii, spacing } from "../../lib/theme";
import { RiskBadge } from "../../components/RiskBadge";

const marketLabels: Record<string, string> = {
  south_africa: "South Africa",
  kenya: "Kenya",
};

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const jobs = useJobsStore((s) => s.jobs);

  if (jobs.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="time-outline" size={32} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No history yet</Text>
        <Text style={styles.emptyBody}>
          Contracts you review will appear here.
        </Text>
        <AnimatedPressable
          style={styles.emptyBtn}
          onPress={() => router.push("/submit")}
        >
          <Text style={styles.emptyBtnText}>New review</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 12 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>History</Text>
        <Text style={styles.count}>{jobs.length} contracts</Text>
      </View>

      <View style={styles.listGroup}>
        {jobs.map((job, idx) => {
          const isComplete = job.status === "complete";
          return (
            <AnimatedPressable
              key={job.job_id}
              style={[
                styles.row,
                idx < jobs.length - 1 && styles.rowBorder,
              ]}
              onPress={() => router.push(`/job/${job.job_id}`)}
            >
              <View
                style={[
                  styles.rowIcon,
                  {
                    backgroundColor: isComplete ? colors.accentSoft : colors.bgSoft,
                  },
                ]}
              >
                <Ionicons
                  name={isComplete ? "checkmark-circle" : "hourglass-outline"}
                  size={18}
                  color={isComplete ? colors.success : colors.textMuted}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {job.source_name ?? "Unnamed contract"}
                </Text>
                <Text style={styles.rowMeta}>
                  {marketLabels[job.market] ?? job.market}
                  {" · "}
                  {job.input_type.toUpperCase()}
                  {" · "}
                  {new Date(job.created_at).toLocaleDateString()}
                </Text>
              </View>
              {job.analysis ? (
                <RiskBadge
                  score={job.analysis.risk_score}
                  level={job.analysis.risk_level}
                  compact
                />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              )}
            </AnimatedPressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },

  header: {
    gap: 4,
  },
  heading: {
    fontSize: fonts.heading,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: fonts.label,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fonts.title,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: fonts.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: spacing.sm,
  },
  emptyBtnText: {
    color: colors.textOnDark,
    fontSize: fonts.body,
    fontWeight: fontWeights.semibold,
  },

  listGroup: {
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: colors.bg,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: fonts.body,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontSize: fonts.caption,
    color: colors.textMuted,
  },
});
