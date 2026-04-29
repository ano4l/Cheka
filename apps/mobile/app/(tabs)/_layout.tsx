import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { LiquidTabBar } from "../../components/LiquidTabBar";
import { colors, fontWeights } from "../../lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: fontWeights.semibold, fontSize: 17 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
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
