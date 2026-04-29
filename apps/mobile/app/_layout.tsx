import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useJobsStore, useOnboardingStore } from "../lib/store";
import { colors, fontWeights } from "../lib/theme";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded);
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated);
  const jobsHydrated = useJobsStore((s) => s.hasHydrated);
  const storesReady = onboardingHydrated && jobsHydrated;
  const statusBarStyle = storesReady && hasOnboarded ? "dark" : "light";

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={statusBarStyle} />
      {!storesReady ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <>
          {!hasOnboarded && <Redirect href="/onboarding" />}
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.bg,
              },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary,
              headerTitleStyle: { fontWeight: fontWeights.semibold, fontSize: 17 },
              headerBackTitle: "Back",
              contentStyle: { backgroundColor: colors.bg },
              animation: "ios_from_right",
            }}
          >
            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false, animation: "fade" }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="submit"
              options={{
                title: "New Contract",
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="job/[id]"
              options={{ title: "Review" }}
            />
          </Stack>
        </>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
