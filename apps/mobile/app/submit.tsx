import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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
import {
  createFilePreviewJob,
  createPreviewJob,
  createUrlPreviewJob,
  usingExternalApi,
} from "../lib/api";
import { sampleContracts } from "../lib/demo-engine";
import { useJobsStore } from "../lib/store";
import { colors, fonts, fontWeights, radii, shadow, spacing } from "../lib/theme";
import type { InputType, Market } from "../lib/types";

const inputTypes: { value: InputType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "pdf", label: "PDF", icon: "document-text-outline" },
  { value: "docx", label: "DOCX", icon: "reader-outline" },
  { value: "image", label: "Image", icon: "image-outline" },
  { value: "url", label: "URL", icon: "link-outline" },
];

const markets: { value: Market; label: string; flag: string }[] = [
  { value: "south_africa", label: "South Africa", flag: "ZA" },
  { value: "kenya", label: "Kenya", flag: "KE" },
];

function inferInputTypeFromAsset(
  asset: DocumentPicker.DocumentPickerAsset,
): InputType {
  const name = asset.name.toLowerCase();
  const mimeType = asset.mimeType?.toLowerCase() ?? "";

  if (name.endsWith(".pdf") || mimeType.includes("pdf")) {
    return "pdf";
  }
  if (name.endsWith(".docx") || mimeType.includes("word")) {
    return "docx";
  }
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  return "pdf";
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = unitIndex === 0 ? size.toFixed(0) : size.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

export default function SubmitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sampleId?: string; mode?: string }>();
  const addJob = useJobsStore((state) => state.addJob);
  const apiConnected = usingExternalApi();

  const [sourceName, setSourceName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [inputType, setInputType] = useState<InputType>("pdf");
  const [market, setMarket] = useState<Market>("south_africa");
  const [text, setText] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [selectedAsset, setSelectedAsset] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!params.mode) {
      return;
    }

    if (params.mode === "url") {
      setInputType("url");
      return;
    }

    if (params.mode === "image") {
      setInputType("image");
      return;
    }

    setInputType("pdf");
  }, [params.mode]);

  useEffect(() => {
    if (!params.sampleId) {
      return;
    }

    const sample = sampleContracts.find((item) => item.id === params.sampleId);
    if (!sample) {
      return;
    }

    setSourceName(sample.source_name);
    setInputType(sample.input_type);
    setMarket(sample.market);
    setText(sample.text);
    setPublicUrl("");
    setSelectedAsset(null);
    setDisclaimerAccepted(true);
  }, [params.sampleId]);

  function handleInputTypeChange(nextType: InputType) {
    setInputType(nextType);
    if (nextType === "url") {
      setSelectedAsset(null);
    }
  }

  async function pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) {
        return;
      }

      const asset = result.assets[0] ?? null;
      setSelectedAsset(asset);

      if (asset) {
        setInputType(inferInputTypeFromAsset(asset));
        if (!sourceName) {
          setSourceName(asset.name);
        }
      }
    } catch (err) {
      Alert.alert(
        "Upload error",
        err instanceof Error
          ? err.message
          : "Could not open the document picker.",
      );
    }
  }

  function clearSelectedDocument() {
    setSelectedAsset(null);
  }

  async function handleSubmit() {
    const trimmedText = text.trim();
    const trimmedUrl = publicUrl.trim();

    if (!selectedAsset && !trimmedUrl && trimmedText.length < 40) {
      Alert.alert(
        "Too short",
        "Provide a file, a public URL, or at least 40 characters of contract text.",
      );
      return;
    }

    if (!disclaimerAccepted) {
      Alert.alert(
        "Disclaimer required",
        "Please accept the disclaimer before submitting.",
      );
      return;
    }

    setIsPending(true);
    try {
      const job =
        inputType === "url" && trimmedUrl && apiConnected
          ? await createUrlPreviewJob({
              url: trimmedUrl,
              market,
              source_name: sourceName || trimmedUrl,
              customer_email: customerEmail || undefined,
              disclaimer_accepted: disclaimerAccepted,
            })
          : selectedAsset && inputType !== "url" && apiConnected
            ? await createFilePreviewJob({
                asset: selectedAsset,
                market,
                source_name: sourceName || selectedAsset.name,
                customer_email: customerEmail || undefined,
                disclaimer_accepted: disclaimerAccepted,
              })
            : await createPreviewJob({
                input_type: inputType,
                market,
                text: trimmedText,
                source_name: sourceName || undefined,
                customer_email: customerEmail || undefined,
                disclaimer_accepted: disclaimerAccepted,
              });

      addJob(job, trimmedText);
      router.replace(`/job/${job.job_id}`);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsPending(false);
    }
  }

  const charCount = text.trim().length;
  const hasEnoughInput =
    Boolean(selectedAsset && apiConnected) ||
    Boolean(inputType === "url" && publicUrl.trim() && apiConnected) ||
    charCount >= 40;
  const canSubmit = disclaimerAccepted && hasEnoughInput && !isPending;
  const submitLabel = selectedAsset
    ? "Upload and analyze"
    : inputType === "url"
      ? "Fetch and analyze"
      : "Analyze contract";

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
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroKicker}>Upload workspace</Text>
          <Text style={styles.pageTitle}>Add a contract to review</Text>
          <Text style={styles.pageSubtitle}>
            Choose a document, import a public URL, or paste the text directly.
            Cheka will guide the next step from there.
          </Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: apiConnected
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {apiConnected ? "API connected" : "Demo mode"}
              </Text>
            </View>

            <View style={styles.supportedFormatsRow}>
              <View style={styles.supportedFormatChip}>
                <Text style={styles.supportedFormatText}>PDF</Text>
              </View>
              <View style={styles.supportedFormatChip}>
                <Text style={styles.supportedFormatText}>DOCX</Text>
              </View>
              <View style={styles.supportedFormatChip}>
                <Text style={styles.supportedFormatText}>IMG</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Review details</Text>

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

          <View style={styles.field}>
            <Text style={styles.label}>Customer email</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor={colors.textMuted}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Market</Text>
            <View style={styles.marketRow}>
              {markets.map((item) => {
                const active = market === item.value;
                return (
                  <AnimatedPressable
                    key={item.value}
                    style={[
                      styles.marketChip,
                      active && styles.marketChipActive,
                    ]}
                    onPress={() => setMarket(item.value)}
                  >
                    <Text
                      style={[
                        styles.marketFlag,
                        active && styles.marketFlagActive,
                      ]}
                    >
                      {item.flag}
                    </Text>
                    <Text
                      style={[
                        styles.marketText,
                        active && styles.marketTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Choose intake method</Text>
          <View style={styles.methodGrid}>
            {inputTypes.map((item) => {
              const active = inputType === item.value;
              return (
                <AnimatedPressable
                  key={item.value}
                  style={[styles.methodCard, active && styles.methodCardActive]}
                  onPress={() => handleInputTypeChange(item.value)}
                >
                  <View
                    style={[
                      styles.methodIcon,
                      active && styles.methodIconActive,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? colors.textOnDark : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.methodLabel,
                      active && styles.methodLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {inputType === "url" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Import from URL</Text>
            <Text style={styles.sectionHint}>
              {apiConnected
                ? "Use a publicly reachable link so the API can fetch the document."
                : "Connect the API to enable URL fetching. You can still paste text below."}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                apiConnected
                  ? "https://example.com/contract"
                  : "API connection required for URL import"
              }
              placeholderTextColor={colors.textMuted}
              value={publicUrl}
              onChangeText={setPublicUrl}
              autoCapitalize="none"
              editable={apiConnected}
            />
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Upload document</Text>
            <Text style={styles.sectionHint}>
              {apiConnected
                ? "Pick a document from your device. We will use it as the main intake source."
                : "The upload UI is ready, but the API must be connected before files can be sent."}
            </Text>

            <AnimatedPressable
              style={[
                styles.uploadSurface,
                !apiConnected && styles.uploadSurfaceDisabled,
              ]}
              onPress={pickDocument}
              disabled={!apiConnected}
            >
              <View style={styles.uploadSurfaceIcon}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={26}
                  color={apiConnected ? colors.primary : colors.textMuted}
                />
              </View>
              <Text style={styles.uploadSurfaceTitle}>
                {selectedAsset ? "Document selected" : "Choose document"}
              </Text>
              <Text style={styles.uploadSurfaceBody}>
                {selectedAsset
                  ? "Tap again to replace it with another file."
                  : "PDF, DOCX, and images are supported."}
              </Text>
            </AnimatedPressable>

            {selectedAsset ? (
              <View style={styles.selectedFileCard}>
                <View style={styles.selectedFileHeader}>
                  <View style={styles.selectedFileIcon}>
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.selectedFileContent}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedAsset.name}
                    </Text>
                    <Text style={styles.selectedFileMeta}>
                      {`${formatBytes(selectedAsset.size)} - ${(selectedAsset.mimeType ?? "Unknown type").replace("/", " / ")}`}
                    </Text>
                  </View>
                </View>

                <AnimatedPressable
                  style={styles.clearFileButton}
                  onPress={clearSelectedDocument}
                >
                  <Text style={styles.clearFileButtonText}>Remove</Text>
                </AnimatedPressable>
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.textLabelRow}>
            <View>
              <Text style={styles.sectionTitle}>Contract text or notes</Text>
              <Text style={styles.sectionHint}>
                Paste the contract here if you are not uploading, or add fallback notes for the review.
              </Text>
            </View>
            <Text style={[styles.counter, charCount >= 40 && styles.counterOk]}>
              {charCount}/40
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder={
              inputType === "url" && apiConnected
                ? "Optional fallback text if you do not want the API to fetch the URL."
                : selectedAsset && apiConnected
                  ? "Optional notes or copied clause text."
                  : "Paste the full contract text here..."
            }
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
        </View>

        <AnimatedPressable
          style={styles.disclaimerCard}
          onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
        >
          <View
            style={[
              styles.checkbox,
              disclaimerAccepted && styles.checkboxActive,
            ]}
          >
            {disclaimerAccepted ? (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            ) : null}
          </View>
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerTitle}>Acknowledge the disclaimer</Text>
            <Text style={styles.disclaimerText}>
              Cheka provides guidance, not legal advice. High-risk results should
              still be reviewed by a qualified professional.
            </Text>
          </View>
        </AnimatedPressable>

        <View style={styles.footerCard}>
          <View style={styles.footerInfoRow}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.footerInfoText}>
              Your uploaded contract will be turned into a structured result with
              red flags, key obligations, and follow-up support.
            </Text>
          </View>

          <AnimatedPressable
            style={[styles.submitBtn, !canSubmit && styles.disabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={colors.textOnDark} />
            ) : (
              <>
                <Ionicons
                  name={selectedAsset ? "cloud-upload" : "scan-outline"}
                  size={18}
                  color={colors.textOnDark}
                />
                <Text style={styles.submitText}>{submitLabel}</Text>
              </>
            )}
          </AnimatedPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  heroCard: {
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: colors.dark,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow(4),
  },
  heroGlow: {
    position: "absolute",
    right: -20,
    top: -10,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(250, 204, 21, 0.18)",
  },
  heroKicker: {
    color: "rgba(255,255,255,0.68)",
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pageTitle: {
    fontSize: fonts.heading,
    fontWeight: fontWeights.bold,
    color: colors.textOnDark,
    letterSpacing: -0.7,
    lineHeight: 36,
  },
  pageSubtitle: {
    fontSize: fonts.body,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 23,
  },
  heroMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fonts.label,
    fontWeight: fontWeights.medium,
    color: "rgba(255,255,255,0.76)",
  },
  supportedFormatsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  supportedFormatChip: {
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  supportedFormatText: {
    color: colors.textOnDark,
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(22, 51, 38, 0.05)",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.bold,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: fonts.label,
    lineHeight: 20,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fonts.label,
    fontWeight: fontWeights.medium,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontSize: fonts.body,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  marketRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  marketChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    paddingVertical: 14,
  },
  marketChipActive: {
    backgroundColor: colors.primary,
  },
  marketFlag: {
    color: colors.textMuted,
    fontSize: fonts.label,
    fontWeight: fontWeights.bold,
  },
  marketFlagActive: {
    color: colors.textOnDark,
  },
  marketText: {
    color: colors.textSecondary,
    fontSize: fonts.label,
    fontWeight: fontWeights.semibold,
  },
  marketTextActive: {
    color: colors.textOnDark,
  },
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  methodCard: {
    width: "48%",
    borderRadius: radii.lg,
    backgroundColor: colors.bg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  methodCardActive: {
    backgroundColor: colors.primary,
  },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconActive: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  methodLabel: {
    color: colors.textPrimary,
    fontSize: fonts.body,
    fontWeight: fontWeights.semibold,
  },
  methodLabelActive: {
    color: colors.textOnDark,
  },
  uploadSurface: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 180,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: "rgba(22, 51, 38, 0.12)",
    borderStyle: "dashed",
    backgroundColor: "rgba(238, 244, 204, 0.45)",
    padding: spacing.lg,
  },
  uploadSurfaceDisabled: {
    opacity: 0.55,
  },
  uploadSurfaceIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  uploadSurfaceTitle: {
    color: colors.textPrimary,
    fontSize: fonts.title,
    fontWeight: fontWeights.bold,
    textAlign: "center",
  },
  uploadSurfaceBody: {
    color: colors.textSecondary,
    fontSize: fonts.body,
    lineHeight: 22,
    textAlign: "center",
  },
  selectedFileCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.bg,
    padding: spacing.md,
    gap: spacing.md,
  },
  selectedFileHeader: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  selectedFileIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  selectedFileContent: {
    flex: 1,
    gap: 4,
  },
  selectedFileName: {
    color: colors.textPrimary,
    fontSize: fonts.body,
    fontWeight: fontWeights.semibold,
  },
  selectedFileMeta: {
    color: colors.textMuted,
    fontSize: fonts.caption,
  },
  clearFileButton: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  clearFileButtonText: {
    color: colors.textSecondary,
    fontSize: fonts.label,
    fontWeight: fontWeights.semibold,
  },
  textLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  counter: {
    color: colors.textMuted,
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
    paddingTop: 2,
  },
  counterOk: {
    color: colors.success,
  },
  textArea: {
    minHeight: 200,
    borderRadius: radii.xl,
    backgroundColor: colors.bg,
    color: colors.textPrimary,
    fontSize: fonts.body,
    lineHeight: 24,
    padding: spacing.md,
  },
  disclaimerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: "rgba(255,255,255,0.82)",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(22, 51, 38, 0.05)",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
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
  disclaimerContent: {
    flex: 1,
    gap: 4,
  },
  disclaimerTitle: {
    color: colors.textPrimary,
    fontSize: fonts.body,
    fontWeight: fontWeights.semibold,
  },
  disclaimerText: {
    color: colors.textSecondary,
    fontSize: fonts.label,
    lineHeight: 20,
  },
  footerCard: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  footerInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: "rgba(238, 244, 204, 0.55)",
    padding: spacing.md,
  },
  footerInfoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fonts.body,
    lineHeight: 22,
  },
  submitBtn: {
    minHeight: 56,
    borderRadius: radii.full,
    backgroundColor: "#facc15",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.35,
  },
  submitText: {
    color: "#1c1917",
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.semibold,
  },
});
