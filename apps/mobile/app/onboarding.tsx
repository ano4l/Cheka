import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedPressable } from "../components/AnimatedPressable";
import { useOnboardingStore } from "../lib/store";
import { colors, fonts, fontWeights, radii, shadow, spacing } from "../lib/theme";

type SignalTone = "low" | "medium" | "high";

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  heading: string;
  body: string;
  metricValue: string;
  metricLabel: string;
  previewLabel: string;
  previewTitle: string;
  note: string;
  chips: string[];
  signals: Array<{
    label: string;
    width: number;
    tone: SignalTone;
  }>;
}

const slides: Slide[] = [
  {
    id: "1",
    icon: "shield-checkmark",
    eyebrow: "Read the power dynamics early",
    heading: "Know the risky parts before you sign.",
    body:
      "Cheka turns dense contracts into a clear read on red flags, obligations, and exit pressure in a few seconds.",
    metricValue: "2 min",
    metricLabel: "from upload to clarity",
    previewLabel: "Contract pulse",
    previewTitle: "Lease risk scan ready",
    note: "Built for founders, freelancers, and teams reviewing under time pressure.",
    chips: ["Red flags", "Deadlines", "Money traps"],
    signals: [
      { label: "Exit notice", width: 0.84, tone: "high" },
      { label: "Deposit terms", width: 0.58, tone: "medium" },
      { label: "Repair burden", width: 0.42, tone: "low" },
    ],
  },
  {
    id: "2",
    icon: "sparkles",
    eyebrow: "Plain language by default",
    heading: "See what matters without reading every clause twice.",
    body:
      "Important payment terms, cancellation windows, and exclusivity issues are surfaced in a structured summary you can actually use.",
    metricValue: "12",
    metricLabel: "clauses mapped fast",
    previewLabel: "Structured output",
    previewTitle: "Top issues prioritized",
    note: "The summary is designed for quick decisions, not legalese theater.",
    chips: ["Summary", "Risk score", "Key obligations"],
    signals: [
      { label: "Renewal trap", width: 0.78, tone: "high" },
      { label: "Late fee exposure", width: 0.61, tone: "medium" },
      { label: "IP ownership", width: 0.37, tone: "low" },
    ],
  },
  {
    id: "3",
    icon: "chatbubbles",
    eyebrow: "Keep the conversation going",
    heading: "Ask follow-ups until the contract makes sense.",
    body:
      "After the review lands, you can keep digging into specific clauses with three free follow-up questions right from the app.",
    metricValue: "3 free",
    metricLabel: "follow-up questions",
    previewLabel: "Cheka assist",
    previewTitle: "Continue from the result",
    note: "Stay inside one thread instead of jumping between PDFs, screenshots, and group chats.",
    chips: ["Follow-ups", "WhatsApp next", "Shared context"],
    signals: [
      { label: "Clause context", width: 0.88, tone: "low" },
      { label: "Answer speed", width: 0.7, tone: "medium" },
      { label: "Decision support", width: 0.52, tone: "low" },
    ],
  },
];

function signalToneColor(tone: SignalTone) {
  switch (tone) {
    case "high":
      return colors.riskHigh;
    case "medium":
      return colors.riskMedium;
    default:
      return colors.accent;
  }
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const complete = useOnboardingStore((state) => state.completeOnboarding);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 55,
  }).current;
  const isLast = activeIndex === slides.length - 1;

  const finish = () => {
    complete();
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    if (isLast) {
      finish();
      return;
    }

    flatListRef.current?.scrollToIndex({
      index: activeIndex + 1,
      animated: true,
    });
  };

  const heroHeight = Math.min(Math.max(height * 0.38, 300), 360);

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.visualStage, { height: heroHeight }]}>
        <View style={styles.visualGlowPrimary} />
        <View style={styles.visualGlowSecondary} />
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{item.metricValue}</Text>
          <Text style={styles.metricLabel}>{item.metricLabel}</Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewTopRow}>
            <View style={styles.iconChip}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveChipText}>{item.previewLabel}</Text>
            </View>
          </View>

          <Text style={styles.previewTitle}>{item.previewTitle}</Text>

          <View style={styles.signalStack}>
            {item.signals.map((signal) => (
              <View key={signal.label} style={styles.signalRow}>
                <View style={styles.signalHeader}>
                  <Text style={styles.signalLabel}>{signal.label}</Text>
                  <Text style={styles.signalPercent}>
                    {Math.round(signal.width * 100)}%
                  </Text>
                </View>
                <View style={styles.signalTrack}>
                  <View
                    style={[
                      styles.signalFill,
                      {
                        width: `${signal.width * 100}%`,
                        backgroundColor: signalToneColor(signal.tone),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.chipRow}>
            {item.chips.map((chip) => (
              <View key={chip} style={styles.featureChip}>
                <Text style={styles.featureChipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.floatingNote}>
          <Ionicons name="flash" size={16} color={colors.accent} />
          <Text style={styles.floatingNoteText}>{item.note}</Text>
        </View>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.eyebrow}>{item.eyebrow}</Text>
        <Text style={styles.heading}>{item.heading}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.backgroundBase} />
      <View style={styles.backgroundOrbLeft} />
      <View style={styles.backgroundOrbRight} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.brandChip}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>Cheka</Text>
        </View>

        {!isLast ? (
          <Pressable hitSlop={16} onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.list}
      />

      <View
        style={[
          styles.bottomDock,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <View style={styles.bottomGlass}>
          <View style={styles.progressRow}>
            <View style={styles.dotRow}>
              {slides.map((slide, index) => (
                <View
                  key={slide.id}
                  style={[
                    styles.dot,
                    index === activeIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>
              {activeIndex + 1} / {slides.length}
            </Text>
          </View>

          <Text style={styles.bottomHint}>
            Private by default. Built to help you review faster and ask better questions.
          </Text>

          <AnimatedPressable style={styles.buttonWrap} onPress={handleNext}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>
                {isLast ? "Start reviewing" : "Continue"}
              </Text>
              <Ionicons
                name={isLast ? "checkmark" : "arrow-forward"}
                size={18}
                color={colors.textOnDark}
              />
            </View>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1917",
  },
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1c1917",
  },
  backgroundOrbLeft: {
    position: "absolute",
    top: 90,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
    transform: [{ scale: 1.2 }],
  },
  backgroundOrbRight: {
    position: "absolute",
    right: -80,
    bottom: 180,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  brandText: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.4,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  skipText: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: fonts.body,
    fontWeight: fontWeights.medium,
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  visualStage: {
    justifyContent: "flex-end",
  },
  visualGlowPrimary: {
    position: "absolute",
    top: 26,
    left: 28,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(195, 214, 62, 0.18)",
    transform: [{ scale: 1.12 }],
  },
  visualGlowSecondary: {
    position: "absolute",
    right: 18,
    top: 12,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  metricCard: {
    position: "absolute",
    top: 10,
    right: 6,
    width: 116,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    ...shadow(2),
  },
  metricValue: {
    color: colors.white,
    fontSize: fonts.title1,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.8,
  },
  metricLabel: {
    marginTop: 4,
    color: "rgba(255, 255, 255, 0.68)",
    fontSize: fonts.caption,
    lineHeight: 16,
  },
  previewCard: {
    padding: spacing.lg,
    borderRadius: 30,
    backgroundColor: "rgba(250, 252, 249, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    ...shadow(4),
  },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(22, 51, 38, 0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveChipText: {
    color: colors.textSecondary,
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
  },
  previewTitle: {
    color: colors.textPrimary,
    fontSize: fonts.title1,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: spacing.lg,
  },
  signalStack: {
    gap: spacing.md,
  },
  signalRow: {
    gap: 8,
  },
  signalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  signalLabel: {
    color: colors.textSecondary,
    fontSize: fonts.footnote,
    fontWeight: fontWeights.medium,
  },
  signalPercent: {
    color: colors.textMuted,
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
  },
  signalTrack: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(22, 51, 38, 0.08)",
    overflow: "hidden",
  },
  signalFill: {
    height: "100%",
    borderRadius: radii.full,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.lg,
  },
  featureChip: {
    borderRadius: radii.full,
    backgroundColor: "rgba(22, 51, 38, 0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featureChipText: {
    color: colors.textSecondary,
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
  },
  floatingNote: {
    position: "absolute",
    left: 12,
    bottom: -16,
    right: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.full,
    backgroundColor: "rgba(22, 51, 38, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  floatingNoteText: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: fonts.caption,
    lineHeight: 16,
  },
  copyCard: {
    marginTop: spacing.xl,
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heading: {
    color: colors.white,
    fontSize: fonts.hero,
    fontWeight: fontWeights.heavy,
    letterSpacing: -1.7,
    lineHeight: 46,
  },
  body: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: fonts.bodyLarge,
    lineHeight: 28,
  },
  bottomDock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  bottomGlass: {
    borderRadius: 30,
    padding: spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: radii.full,
  },
  dotActive: {
    width: 34,
    backgroundColor: colors.accent,
  },
  dotInactive: {
    width: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressText: {
    color: "rgba(255, 255, 255, 0.58)",
    fontSize: fonts.caption,
    fontWeight: fontWeights.semibold,
  },
  bottomHint: {
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: fonts.body,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  buttonWrap: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    borderRadius: radii.full,
    paddingVertical: 18,
    backgroundColor: "#facc15",
  },
  buttonText: {
    color: "#1c1917",
    fontSize: fonts.bodyLarge,
    fontWeight: fontWeights.bold,
  },
});
