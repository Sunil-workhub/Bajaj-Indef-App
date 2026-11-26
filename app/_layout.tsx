// app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

function AuthNavigation() {
  const { status, needsOrgSelection, selectedOrg } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "checking") return;
    const group = segments[0];
    const page = segments[1];
    const inAuth = group === "(auth)";
    const onIndex = segments.length === 0;

    if (status === "unauthenticated") {
      if (!inAuth && !onIndex) router.replace("/(auth)/login");
      if (onIndex) router.replace("/(auth)/login");
      return;
    }

    if (needsOrgSelection || !selectedOrg) {
      if (!(inAuth && page === "select-org"))
        router.replace("/(auth)/select-org");
      return;
    }

    if (inAuth || onIndex) router.replace("/(tabs)");
  }, [status, needsOrgSelection, selectedOrg, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="card-detail" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PaperProvider>
          <AuthNavigation />
        </PaperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
