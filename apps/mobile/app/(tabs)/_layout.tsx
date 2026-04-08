import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";

import { colors, fontWeights } from "../../lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: fontWeights.semibold, fontSize: 17 },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.separator,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: fontWeights.medium,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerShown: false,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
