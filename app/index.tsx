// app / index.tsx

import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function IndexGate() {
  const { status, needsOrgSelection } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(needsOrgSelection ? "/(auth)/select-org" : "/(tabs)");
    } else if (status === "unauthenticated") {
      router.replace("/(auth)/login");
    }
    // status === "checking" -> stay here, spinner shows below
  }, [status, needsOrgSelection]);

  return (
    <View style={[styles.container, { backgroundColor: colors?.background }]}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.text}>Checking access...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { marginTop: 12, color: "#64748b", fontSize: 14 },
});
