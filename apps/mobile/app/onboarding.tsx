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
import { colors, fonts, fontWeights, radii, spacing } from "../lib/theme";

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  heading: string;
  body: string;
}

const slides: Slide[] = [
  {
    id: "1",
    icon: "shield-checkmark",
    heading: "Know before\nyou sign.",
    body: "Upload any contract and get instant AI-powered risk analysis with plain-language summaries.",
  },
  {
    id: "2",
    icon: "analytics-outline",
    heading: "Clear risk\nanalysis.",
    body: "Red flags, financial obligations, and cancellation terms — identified in seconds.",
  },
  {
    id: "3",
    icon: "chatbubbles-outline",
    heading: "Ask follow-up\nquestions.",
    body: "Dive deeper into any clause. Three free follow-ups per contract, right from your phone.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const complete = useOnboardingStore((s) => s.completeOnboarding);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const isLast = activeIndex === slides.length - 1;

  const finish = () => {
    complete();
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconArea}>
        <View style={styles.iconCircle}>
          <View style={styles.iconCircleInner}>
            <Ionicons name={item.icon} size={48} color={colors.primary} />
          </View>
        </View>
      </View>
      <Text style={styles.heading}>{item.heading}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background soft element for a bit of flair */}
      <View style={styles.bgGlow} />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.logo}>Cheka</Text>
        {!isLast && (
          <Pressable hitSlop={20} onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        style={styles.list}
      />

      {/* Bottom Area */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 32) + 16 }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <AnimatedPressable style={styles.btnWrapper} onPress={handleNext}>
          <View style={styles.btn}>
            <Text style={styles.btnText}>
              {isLast ? "Get Started" : "Continue"}
            </Text>
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bgGlow: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.accent,
    opacity: 0.1,
    transform: [{ scale: 1.5 }],
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  logo: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.bgSoft,
    borderRadius: radii.full,
  },
  skip: {
    fontSize: fonts.body,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl + 16,
    paddingBottom: 60,
  },
  iconArea: {
    marginBottom: spacing.xxxl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(195, 214, 62, 0.15)", // Very soft lime
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(195, 214, 62, 0.3)", // Slightly more opaque lime
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 40,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: spacing.lg,
  },
  body: {
    fontSize: 18,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 28,
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.xxl,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.border,
  },
  btnWrapper: {
    width: "100%",
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full, // Pill shape iOS style
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  btnText: {
    color: colors.textOnDark,
    fontSize: 18,
    fontWeight: fontWeights.semibold,
  },
});
