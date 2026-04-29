import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts, fontWeights, radii, shadow, spacing } from "../lib/theme";

const BAR_HORIZONTAL_PADDING = spacing.sm;
const ITEM_GAP = spacing.sm;

export function LiquidTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;

  const routeCount = state.routes.length;
  const itemWidth =
    barWidth > 0
      ? (barWidth - BAR_HORIZONTAL_PADDING * 2 - ITEM_GAP * (routeCount - 1)) /
        routeCount
      : 0;

  useEffect(() => {
    if (!itemWidth) {
      return;
    }

    Animated.spring(indicatorX, {
      toValue: state.index * (itemWidth + ITEM_GAP),
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start();
  }, [indicatorX, itemWidth, state.index]);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        {
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <View style={styles.ambientGlowLeft} />
      <View style={styles.ambientGlowRight} />

      <View
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        style={styles.shell}
      >
        <View style={styles.glossBand} />
        <View style={styles.glassLayer} />

        {itemWidth > 0 ? (
          <Animated.View
            style={[
              styles.activeBubble,
              {
                width: itemWidth,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          >
            <View style={styles.activeBubbleSheen} />
          </Animated.View>
        ) : null}

        <View style={styles.itemsRow}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : typeof options.title === "string"
                  ? options.title
                  : route.name;

            const color = focused ? colors.primary : colors.textMuted;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onLongPress={onLongPress}
                onPress={onPress}
                style={[
                  styles.itemPressable,
                  { marginRight: index < routeCount - 1 ? ITEM_GAP : 0 },
                ]}
              >
                <View style={styles.itemInner}>
                  <View
                    style={[
                      styles.iconWrap,
                      focused && styles.iconWrapFocused,
                    ]}
                  >
                    {options.tabBarIcon?.({
                      focused,
                      color,
                      size: 20,
                    })}
                  </View>
                  <Text
                    style={[
                      styles.label,
                      focused && styles.labelFocused,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
  },
  ambientGlowLeft: {
    position: "absolute",
    bottom: 18,
    left: spacing.xl,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(195, 214, 62, 0.18)",
    transform: [{ scale: 1.2 }],
  },
  ambientGlowRight: {
    position: "absolute",
    right: spacing.xxl,
    bottom: 14,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(22, 51, 38, 0.1)",
    transform: [{ scale: 1.25 }],
  },
  shell: {
    overflow: "hidden",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
    backgroundColor: "rgba(246, 249, 244, 0.82)",
    ...shadow(4),
    ...(Platform.OS === "android"
      ? { elevation: 10 }
      : {
          shadowColor: "#09140d",
          shadowOpacity: 0.16,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 14 },
        }),
  },
  glossBand: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: "rgba(255, 255, 255, 0.44)",
  },
  glassLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  itemsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: BAR_HORIZONTAL_PADDING,
    paddingVertical: 8,
  },
  activeBubble: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: BAR_HORIZONTAL_PADDING,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.72)",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    ...shadow(2),
  },
  activeBubbleSheen: {
    position: "absolute",
    top: 4,
    left: 12,
    right: 12,
    height: 18,
    borderRadius: radii.full,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  itemPressable: {
    flex: 1,
    minHeight: 68,
    borderRadius: radii.full,
  },
  itemInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22, 51, 38, 0.04)",
  },
  iconWrapFocused: {
    backgroundColor: "rgba(195, 214, 62, 0.34)",
  },
  label: {
    fontSize: fonts.caption,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
});
