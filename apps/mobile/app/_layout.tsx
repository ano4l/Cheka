import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import { useOnboardingStore } from "../lib/store";
import { colors, fontWeights } from "../lib/theme";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={hasOnboarded ? "dark" : "light"} />
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
    </QueryClientProvider>
  );
}
