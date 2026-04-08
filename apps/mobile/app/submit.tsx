import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { AnimatedPressable } from "../components/AnimatedPressable";
import { createPreviewJob } from "../lib/api";
import { sampleContracts } from "../lib/demo-engine";
import { useJobsStore } from "../lib/store";
import { colors, fonts, fontWeights, radii, spacing } from "../lib/theme";
import type { InputType, Market } from "../lib/types";

const inputTypes: { value: InputType; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "image", label: "Image" },
  { value: "url", label: "URL" },
];

const markets: { value: Market; label: string; flag: string }[] = [
  { value: "south_africa", label: "South Africa", flag: "🇿🇦" },
  { value: "kenya", label: "Kenya", flag: "🇰🇪" },
];

export default function SubmitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sampleId?: string }>();
  const addJob = useJobsStore((s) => s.addJob);

  const [sourceName, setSourceName] = useState("");
  const [inputType, setInputType] = useState<InputType>("pdf");
  const [market, setMarket] = useState<Market>("south_africa");
  const [text, setText] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (params.sampleId) {
      const sample = sampleContracts.find((s) => s.id === params.sampleId);
      if (sample) {
        setSourceName(sample.source_name);
        setInputType(sample.input_type);
        setMarket(sample.market);
        setText(sample.text);
        setDisclaimerAccepted(true);
      }
    }
  }, [params.sampleId]);

  async function handleSubmit() {
    if (text.trim().length < 40) {
      Alert.alert("Too short", "Contract text must be at least 40 characters.");
      return;
    }
    if (!disclaimerAccepted) {
      Alert.alert("Disclaimer required", "Please accept the disclaimer before submitting.");
      return;
    }
    setIsPending(true);
    try {
      const job = await createPreviewJob({
        input_type: inputType,
        market,
        text: text.trim(),
        source_name: sourceName || undefined,
        disclaimer_accepted: disclaimerAccepted,
      });
      addJob(job, text.trim());
      router.replace(`/job/${job.job_id}`);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  const charCount = text.trim().length;
  const canSubmit = disclaimerAccepted && charCount >= 40 && !isPending;

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
        {/* ── Title ── */}
        <Text style={styles.pageTitle}>New review</Text>
        <Text style={styles.pageSubtitle}>
          Paste or upload contract text for AI-powered risk analysis.
        </Text>

        {/* ── Form group ── */}
        <View style={styles.formGroup}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Contract name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. residential-lease.pdf"
              placeholderTextColor={colors.textMuted}
              value={sourceName}
              onChangeText={setSourceName}
            />
          </View>

          <View style={styles.divider} />

          {/* Document type */}
          <View style={styles.field}>
            <Text style={styles.label}>Document type</Text>
            <View style={styles.chipRow}>
              {inputTypes.map((it) => {
                const active = inputType === it.value;
                return (
                  <AnimatedPressable
                    key={it.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setInputType(it.value)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {it.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Market */}
          <View style={styles.field}>
            <Text style={styles.label}>Market</Text>
            <View style={styles.chipRow}>
              {markets.map((m) => {
                const active = market === m.value;
                return (
                  <AnimatedPressable
                    key={m.value}
                    style={[styles.marketChip, active && styles.marketChipActive]}
                    onPress={() => setMarket(m.value)}
                  >
                    <Text style={styles.marketFlag}>{m.flag}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {m.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Contract text ── */}
        <View style={styles.textGroup}>
          <View style={styles.textLabelRow}>
            <Text style={styles.label}>Contract text</Text>
            <Text style={[styles.counter, charCount >= 40 && styles.counterOk]}>
              {charCount}/40 min
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Paste the full contract text here..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ── Disclaimer ── */}
        <AnimatedPressable
          style={styles.disclaimerRow}
          onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
        >
          <View style={[styles.checkbox, disclaimerAccepted && styles.checkboxActive]}>
            {disclaimerAccepted && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
          <Text style={styles.disclaimerText}>
            I understand Cheka provides guidance, not legal advice. High-risk
            results should be reviewed by a professional.
          </Text>
        </AnimatedPressable>

        {/* ── Submit ── */}
        <AnimatedPressable
          style={[styles.submitBtn, !canSubmit && styles.disabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.textOnDark} />
          ) : (
            <Text style={styles.submitText}>Analyze contract</Text>
          )}
        </AnimatedPressable>
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

  pageTitle: {
    fontSize: fonts.heading,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: -12,
  },

  formGroup: {
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  field: { gap: spacing.sm },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: spacing.md,
  },
  label: {
    fontSize: fonts.label,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    color: colors.textPrimary,
    fontSize: fonts.body,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.bg,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: fonts.label,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnDark,
  },
  marketChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    paddingVertical: 14,
  },
  marketChipActive: {
    backgroundColor: colors.primary,
  },
  marketFlag: {
    fontSize: 16,
  },

  textGroup: {
    gap: spacing.sm,
  },
  textLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counter: {
    fontSize: fonts.caption,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  counterOk: {
    color: colors.success,
  },
  textArea: {
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontSize: fonts.body,
    lineHeight: 24,
    minHeight: 200,
    padding: spacing.md,
  },

  disclaimerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fonts.label,
    color: colors.textMuted,
    lineHeight: 20,
  },

  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.35,
  },
  submitText: {
    color: colors.textOnDark,
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
  },
});
