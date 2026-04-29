import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { RiskBadge } from "../../components/RiskBadge";
import { usingExternalApi } from "../../lib/api";
import { sampleContracts } from "../../lib/demo-engine";
import { useJobsStore } from "../../lib/store";
import { colors, fonts, fontWeights, radii, shadow, spacing } from "../../lib/theme";

const marketLabels: Record<string, string> = {
  south_africa: "South Africa",
  kenya: "Kenya",
};

function StatPill({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.statPill, highlight && styles.statPillHighlight]}>
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={22} color={colors.textPrimary} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </AnimatedPressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const jobs = useJobsStore((state) => state.jobs);
  const recentJobs = jobs.slice(0, 4);
  const isConnected = usingExternalApi();

  const completedCount = jobs.filter((job) => job.status === "completed").length;
  const processingCount = jobs.filter(
    (job) =>
      job.status === "processing" ||
      job.status === "pending" ||
      job.status === "payment_pending",
  ).length;
  const highRiskCount = jobs.filter(
    (job) => job.analysis?.risk_level === "high",
  ).length;
  const totalReviewed = jobs.filter((job) => job.analysis).length;

  return (
    <View style={styles.wrapper}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: Math.max(insets.bottom, spacing.lg) + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {new Date().getHours() < 12
                ? "Good morning"
                : new Date().getHours() < 18
                  ? "Good afternoon"
                  : "Good evening"}
            </Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? colors.success : colors.warning },
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? "Live" : "Demo"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatPill label="Reviewed" value={String(totalReviewed)} highlight />
          <StatPill label="Completed" value={String(completedCount)} />
          <StatPill label="In progress" value={String(processingCount)} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Start a review</Text>
          </View>
          <View style={styles.actionsList}>
            <QuickAction
              icon="document-attach-outline"
              title="Upload file"
              description="PDF, DOCX, or images"
              onPress={() => router.push({ pathname: "/submit", params: { mode: "pdf" } })}
            />
            <QuickAction
              icon="link-outline"
              title="Import URL"
              description="Fetch a public contract link"
              onPress={() => router.push({ pathname: "/submit", params: { mode: "url" } })}
            />
            <QuickAction
              icon="create-outline"
              title="Paste text"
              description="Drop in contract text directly"
              onPress={() => router.push("/submit")}
            />
            <QuickAction
              icon="sparkles-outline"
              title="Try sample"
              description="Use a demo contract"
              onPress={() =>
                router.push({
                  pathname: "/submit",
                  params: { sampleId: sampleContracts[0]?.id ?? "" },
                })
              }
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent reviews</Text>
            <Text style={styles.cardSubtitle}>{jobs.length} total</Text>
          </View>

          {recentJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={32}
                  color={colors.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptyBody}>
                Start by uploading a contract
              </Text>
            </View>
          ) : (
            <View style={styles.listGroup}>
              {recentJobs.map((job, index) => {
                const isComplete = job.status === "completed";
                const isFailed = job.status === "failed";
                const iconName = isComplete
                  ? "checkmark-circle"
                  : isFailed
                    ? "close-circle"
                    : "hourglass-outline";
                const iconColor = isComplete
                  ? colors.success
                  : isFailed
                    ? colors.riskHigh
                    : colors.textMuted;
                const iconBg = isComplete
                  ? colors.accentSoft
                  : isFailed
                    ? colors.riskHighBg
                    : colors.bgSoft;

                return (
                  <AnimatedPressable
                    key={job.job_id}
                    style={[
                      styles.listRow,
                      index < recentJobs.length - 1 && styles.listRowBorder,
                    ]}
                    onPress={() => router.push(`/job/${job.job_id}`)}
                  >
                    <View style={[styles.listIcon, { backgroundColor: iconBg }]}>
                      <Ionicons name={iconName} size={18} color={iconColor} />
                    </View>
                    <View style={styles.listContent}>
                      <Text style={styles.listTitle} numberOfLines={1}>
                        {job.source_name ?? "Unnamed contract"}
                      </Text>
                      <Text style={styles.listSub}>
                        {`${marketLabels[job.market] ?? job.market} - ${job.status.replace("_", " ")}`}
                      </Text>
                    </View>
                    {job.analysis ? (
                      <RiskBadge
                        score={job.analysis.risk_score}
                        level={job.analysis.risk_level}
                        compact
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textMuted}
                      />
                    )}
                  </AnimatedPressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bgGlowTop: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
  },
  bgGlowBottom: {
    position: "absolute",
    left: -60,
    bottom: 100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(28, 25, 23, 0.04)",
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  greeting: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(2),
  },
  statPillHighlight: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  statPillLabel: {
    fontSize: fonts.caption,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statPillValue: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(2),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fonts.title2,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: fonts.caption,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  actionsList: {
    gap: spacing.md,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionContent: {
    flex: 1,
    gap: 2,
  },
  quickActionTitle: {
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  quickActionDesc: {
    fontSize: fonts.label,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: fonts.body,
    color: colors.textMuted,
  },
  listGroup: {
    overflow: "hidden",
    borderRadius: radii.lg,
    backgroundColor: colors.bgSoft,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    backgroundColor: colors.card,
  },
  listRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  listSub: {
    fontSize: fonts.caption,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
});
