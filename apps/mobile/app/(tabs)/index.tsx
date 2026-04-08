import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { RiskBadge } from "../../components/RiskBadge";
import { usingExternalApi } from "../../lib/api";
import { sampleContracts } from "../../lib/demo-engine";
import { useJobsStore } from "../../lib/store";
import { colors, fonts, fontWeights, radii, spacing } from "../../lib/theme";

const marketLabels: Record<string, string> = {
  south_africa: "South Africa",
  kenya: "Kenya",
};

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable style={styles.actionBtn} onPress={onPress}>
      <View style={styles.actionBtnCircle}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.actionBtnLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const jobs = useJobsStore((s) => s.jobs);
  const recentJobs = jobs.slice(0, 5);
  const isConnected = usingExternalApi();

  const totalReviewed = jobs.filter((j) => j.analysis).length;

  return (
    <View style={styles.wrapper}>
      {/* Soft glassmorphic glow in background */}
      <View style={styles.bgGlow} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
            </Text>
            <Text style={styles.headerTitle}>Cheka</Text>
          </View>
          <AnimatedPressable style={styles.avatarBtn}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </AnimatedPressable>
        </View>

        {/* ── Hero card ── */}
        <AnimatedPressable
          style={styles.heroCardWrapper}
          onPress={() => router.push("/submit")}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroLabel}>Contracts reviewed</Text>
                <Text style={styles.heroNumber}>{totalReviewed}</Text>
              </View>
              <View style={styles.heroRight}>
                <View style={styles.heroBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isConnected ? colors.success : colors.warning },
                    ]}
                  />
                  <Text style={styles.heroBadgeText}>
                    {isConnected ? "Live" : "Demo"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.heroFooter}>
              <Text style={styles.heroFooterText}>New review</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.textOnDark} />
            </View>
          </View>
        </AnimatedPressable>

        {/* ── Quick actions ── */}
        <View style={styles.actionsRow}>
          <ActionButton icon="add" label="New" onPress={() => router.push("/submit")} />
          <ActionButton icon="time-outline" label="History" onPress={() => router.push("/(tabs)/history")} />
          <ActionButton
            icon="document-text-outline"
            label="Sample"
            onPress={() =>
              router.push({ pathname: "/submit", params: { sampleId: sampleContracts[0]?.id ?? "" } })
            }
          />
          <ActionButton
            icon="information-outline"
            label="About"
            onPress={() => {}}
          />
        </View>

        {/* ── Recent ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {jobs.length > 5 && (
              <Pressable hitSlop={16} onPress={() => router.push("/(tabs)/history")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )}
          </View>

          {recentJobs.length === 0 ? (
            <View style={styles.emptyBlock}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="documents-outline" size={28} color={colors.textMuted} />
              </View>
              <View style={styles.emptyTextBlock}>
                <Text style={styles.emptyTitle}>No contracts yet</Text>
                <Text style={styles.emptyBody}>
                  Upload or paste a contract to get started
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.listGroup}>
              {recentJobs.map((job, idx) => (
                <AnimatedPressable
                  key={job.job_id}
                  style={[
                    styles.listRow,
                    idx < recentJobs.length - 1 && styles.listRowBorder,
                  ]}
                  onPress={() => router.push(`/job/${job.job_id}`)}
                >
                  <View
                    style={[
                      styles.listIcon,
                      {
                        backgroundColor: job.analysis ? colors.accentSoft : colors.bgSoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name={job.analysis ? "checkmark-circle" : "hourglass-outline"}
                      size={18}
                      color={job.analysis ? colors.success : colors.textMuted}
                    />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {job.source_name ?? "Unnamed contract"}
                    </Text>
                    <Text style={styles.listSub}>
                      {marketLabels[job.market] ?? job.market}
                      {" · "}
                      {job.status.replace("_", " ")}
                    </Text>
                  </View>
                  {job.analysis ? (
                    <RiskBadge score={job.analysis.risk_score} level={job.analysis.risk_level} compact />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  )}
                </AnimatedPressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.bg },
  bgGlow: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.accent,
    opacity: 0.12,
    transform: [{ scale: 1.5 }],
  },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: fonts.body,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  heroCardWrapper: {
    width: "100%",
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xl,
    overflow: "hidden",
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: { gap: 8 },
  heroRight: { alignItems: "flex-end" },
  heroLabel: {
    fontSize: fonts.body,
    fontWeight: fontWeights.medium,
    color: "rgba(255,255,255,0.6)",
  },
  heroNumber: {
    fontSize: 48,
    fontWeight: fontWeights.bold,
    color: colors.textOnDark,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroBadgeText: {
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
    color: "rgba(255,255,255,0.8)",
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: spacing.lg,
  },
  heroFooterText: {
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.textOnDark,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  actionBtn: {
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  actionBtnCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.bgSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnLabel: {
    color: colors.textSecondary,
    fontSize: fonts.label,
    fontWeight: fontWeights.medium,
  },

  section: { gap: spacing.lg },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: fonts.title2,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: fonts.body,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },

  emptyBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    padding: spacing.xl,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTextBlock: { flex: 1, gap: 4 },
  emptyTitle: {
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: fonts.body,
    color: colors.textMuted,
    lineHeight: 22,
  },

  listGroup: {
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
    gap: 14,
    backgroundColor: colors.bg,
  },
  listRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { flex: 1, gap: 4 },
  listTitle: {
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  listSub: {
    fontSize: fonts.label,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
});
