import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AnalysisCard } from "../../components/AnalysisCard";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { ConversationThread } from "../../components/ConversationThread";
import {
  askFollowUp,
  confirmPayment,
  fetchJob,
  initializeCheckout,
  retryJob,
  usingExternalApi,
} from "../../lib/api";
import { useJobsStore } from "../../lib/store";
import { colors, fonts, fontWeights, radii, spacing } from "../../lib/theme";

const marketLabels: Record<string, string> = {
  south_africa: "South Africa",
  kenya: "Kenya",
};

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const job = useJobsStore((state) => state.jobs.find((entry) => entry.job_id === id));
  const updateJob = useJobsStore((state) => state.updateJob);
  const getText = useJobsStore((state) => state.getText);
  const apiConnected = usingExternalApi();

  const [isPending, setIsPending] = useState(false);
  const [isRefreshingJob, setIsRefreshingJob] = useState(() => Boolean(apiConnected && id));
  const [followUpQuestion, setFollowUpQuestion] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!apiConnected || !id) {
        return undefined;
      }

      let isActive = true;

      const refreshJob = async () => {
        setIsRefreshingJob(true);
        try {
          const latestJob = await fetchJob(id);
          if (isActive) {
            updateJob(latestJob);
          }
        } catch {
          // Keep the refresh silent so passive sync never interrupts the review flow.
        } finally {
          if (isActive) {
            setIsRefreshingJob(false);
          }
        }
      };

      void refreshJob();

      return () => {
        isActive = false;
      };
    }, [apiConnected, id, updateJob]),
  );

  if (!job) {
    return (
      <View style={styles.emptyContainer}>
        {isRefreshingJob ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.emptyText}>Loading latest review...</Text>
          </>
        ) : (
          <Text style={styles.emptyText}>Job not found.</Text>
        )}
      </View>
    );
  }

  const currentJob = job;

  async function handleConfirmPayment() {
    setIsPending(true);
    try {
      const updated = await confirmPayment(currentJob, getText(currentJob.job_id));
      updateJob(updated);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Payment confirmation failed.");
    } finally {
      setIsPending(false);
    }
  }

  async function handlePrepareCheckout() {
    setIsPending(true);
    try {
      const updated = await initializeCheckout(currentJob, {
        customer_email: currentJob.customer_email ?? undefined,
      });
      updateJob(updated);
      if (updated.payment.checkout_url) {
        await Linking.openURL(updated.payment.checkout_url);
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Checkout initialization failed.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleFollowUp() {
    if (!followUpQuestion.trim()) {
      return;
    }

    setIsPending(true);
    try {
      const result = await askFollowUp(currentJob, followUpQuestion.trim());
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

  async function handleRetry() {
    setIsPending(true);
    try {
      const updated = await retryJob(currentJob, getText(currentJob.job_id));
      updateJob(updated);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Retry failed.");
    } finally {
      setIsPending(false);
    }
  }

  const isPaid = currentJob.payment.payment_status === "paid";

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
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <Text style={styles.contractName}>
              {currentJob.source_name ?? "Unnamed contract"}
            </Text>
            {isRefreshingJob ? (
              <View style={styles.syncChip}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.syncChipText}>Syncing</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.statusChip, isPaid ? styles.chipPaid : styles.chipPending]}>
              <View style={[styles.statusDot, { backgroundColor: isPaid ? colors.success : colors.warning }]} />
              <Text style={[styles.statusChipText, { color: isPaid ? colors.success : colors.warning }]}>
                {isPaid ? "Paid" : "Pending"}
              </Text>
            </View>
            <Text style={styles.metaText}>
              {marketLabels[currentJob.market] ?? currentJob.market}
            </Text>
            <Text style={styles.metaDot}>-</Text>
            <Text style={styles.metaText}>{currentJob.payment.display_amount}</Text>
          </View>
        </View>

        {!isPaid && (
          <View style={styles.paymentBlock}>
            <Text style={styles.paymentNote}>{currentJob.payment.note}</Text>
            {apiConnected ? (
              <AnimatedPressable
                style={[styles.secondaryPaymentBtn, isPending && styles.disabled]}
                onPress={handlePrepareCheckout}
                disabled={isPending}
              >
                <Text style={styles.secondaryPaymentBtnText}>Prepare checkout</Text>
              </AnimatedPressable>
            ) : null}
            <AnimatedPressable
              style={[styles.paymentBtn, isPending && styles.disabled]}
              onPress={handleConfirmPayment}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.textOnDark} />
              ) : (
                <Text style={styles.paymentBtnText}>
                  {apiConnected ? "Confirm payment after checkout" : "Confirm payment"}
                </Text>
              )}
            </AnimatedPressable>
          </View>
        )}

        {isPaid && currentJob.status === "processing" ? (
          <View style={styles.processingBlock}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.processingText}>
              Payment is confirmed and your analysis is still processing.
            </Text>
          </View>
        ) : null}

        {currentJob.status === "failed" ? (
          <View style={styles.failedBlock}>
            <Text style={styles.failedText}>
              This review failed during processing, but you can retry it here without creating a new checkout.
            </Text>
            <AnimatedPressable
              style={[styles.failedActionBtn, isPending && styles.disabled]}
              onPress={handleRetry}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.textOnDark} />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color={colors.textOnDark} />
                  <Text style={styles.failedActionText}>Retry analysis</Text>
                </>
              )}
            </AnimatedPressable>
          </View>
        ) : null}

        {currentJob.analysis ? (
          <>
            <AnalysisCard
              analysis={currentJob.analysis}
              escalationRecommended={currentJob.escalation_recommended}
            />

            <View style={styles.followUpBlock}>
              <View style={styles.followUpHeader}>
                <Text style={styles.followUpTitle}>Follow-up</Text>
                <Text style={styles.counterText}>
                  {currentJob.follow_up.questions_remaining} left
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

              <ConversationThread messages={currentJob.conversation} />
            </View>
          </>
        ) : null}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  contractName: {
    flex: 1,
    fontSize: fonts.title2,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  syncChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radii.full,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncChipText: {
    color: colors.textSecondary,
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
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
    backgroundColor: colors.dark,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryPaymentBtn: {
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentBtnText: {
    color: colors.textOnDark,
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
  },
  secondaryPaymentBtnText: {
    color: colors.textPrimary,
    fontSize: fonts.body,
    fontWeight: fontWeights.semibold,
  },
  disabled: { opacity: 0.35 },
  processingBlock: {
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  processingText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fonts.body,
  },
  failedBlock: {
    backgroundColor: colors.riskHighBg,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  failedText: {
    color: colors.riskHigh,
    fontSize: fonts.body,
    lineHeight: 22,
  },
  failedActionBtn: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.dark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  failedActionText: {
    color: colors.textOnDark,
    fontSize: fonts.body,
    fontWeight: fontWeights.semibold,
  },
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
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
});
