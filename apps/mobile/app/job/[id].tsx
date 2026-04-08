import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { askFollowUp, confirmPayment } from "../../lib/api";
import { useJobsStore } from "../../lib/store";
import { colors, fonts, fontWeights, radii, spacing } from "../../lib/theme";
import { AnalysisCard } from "../../components/AnalysisCard";
import { ConversationThread } from "../../components/ConversationThread";

const marketLabels: Record<string, string> = {
  south_africa: "South Africa",
  kenya: "Kenya",
};

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const job = useJobsStore((s) => s.jobs.find((j) => j.job_id === id));
  const updateJob = useJobsStore((s) => s.updateJob);
  const getText = useJobsStore((s) => s.getText);

  const [isPending, setIsPending] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");

  if (!job) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Job not found.</Text>
      </View>
    );
  }

  async function handleConfirmPayment() {
    if (!job) return;
    setIsPending(true);
    try {
      const updated = await confirmPayment(job, getText(job.job_id));
      updateJob(updated);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Payment confirmation failed.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleFollowUp() {
    if (!job || !followUpQuestion.trim()) return;
    setIsPending(true);
    try {
      const result = await askFollowUp(job, followUpQuestion.trim());
      updateJob(result.job);
      setFollowUpQuestion("");
      if (result.response.upgrade_required) {
        Alert.alert("Limit reached", "You have used all 3 free follow-up questions for this contract.");
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Follow-up request failed.");
    } finally {
      setIsPending(false);
    }
  }

  const isPaid = job.payment.payment_status === "paid";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerBlock}>
          <Text style={styles.contractName}>
            {job.source_name ?? "Unnamed contract"}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusChip, isPaid ? styles.chipPaid : styles.chipPending]}>
              <View style={[styles.statusDot, { backgroundColor: isPaid ? colors.success : colors.warning }]} />
              <Text style={[styles.statusChipText, { color: isPaid ? colors.success : colors.warning }]}>
                {isPaid ? "Paid" : "Pending"}
              </Text>
            </View>
            <Text style={styles.metaText}>
              {marketLabels[job.market] ?? job.market}
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{job.payment.display_amount}</Text>
          </View>
        </View>

        {/* ── Payment CTA ── */}
        {!isPaid && (
          <View style={styles.paymentBlock}>
            <Text style={styles.paymentNote}>{job.payment.note}</Text>
            <AnimatedPressable
              style={[styles.paymentBtn, isPending && styles.disabled]}
              onPress={handleConfirmPayment}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.textOnDark} />
              ) : (
                <Text style={styles.paymentBtnText}>Confirm payment</Text>
              )}
            </AnimatedPressable>
          </View>
        )}

        {/* ── Analysis ── */}
        {job.analysis && (
          <>
            <AnalysisCard
              analysis={job.analysis}
              escalationRecommended={job.escalation_recommended}
            />

            {/* ── Follow-up ── */}
            <View style={styles.followUpBlock}>
              <View style={styles.followUpHeader}>
                <Text style={styles.followUpTitle}>Follow-up</Text>
                <Text style={styles.counterText}>
                  {job.follow_up.questions_remaining} left
                </Text>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.followUpInput}
                  placeholder="Ask about fees, renewal..."
                  placeholderTextColor={colors.textMuted}
                  value={followUpQuestion}
                  onChangeText={setFollowUpQuestion}
                />
                <AnimatedPressable
                  style={[
                    styles.sendBtn,
                    (isPending || !followUpQuestion.trim()) && styles.disabled,
                  ]}
                  onPress={handleFollowUp}
                  disabled={isPending || !followUpQuestion.trim()}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color={colors.textOnDark} />
                  ) : (
                    <Ionicons name="arrow-up" size={18} color={colors.textOnDark} />
                  )}
                </AnimatedPressable>
              </View>

              <ConversationThread messages={job.conversation} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fonts.bodyLarge,
  },

  headerBlock: {
    gap: spacing.sm,
  },
  contractName: {
    fontSize: fonts.title2,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipPaid: { backgroundColor: colors.riskLowBg },
  chipPending: { backgroundColor: colors.riskMediumBg },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: fonts.caption,
    fontWeight: fontWeights.bold,
  },
  metaText: {
    fontSize: fonts.label,
    color: colors.textMuted,
  },
  metaDot: {
    fontSize: fonts.label,
    color: colors.textMuted,
  },

  paymentBlock: {
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  paymentNote: {
    fontSize: fonts.label,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  paymentBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentBtnText: {
    color: colors.textOnDark,
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
  },
  disabled: { opacity: 0.35 },

  followUpBlock: {
    gap: spacing.md,
  },
  followUpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  followUpTitle: {
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  counterText: {
    fontSize: fonts.caption,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  followUpInput: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: radii.full,
    color: colors.textPrimary,
    fontSize: fonts.body,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
