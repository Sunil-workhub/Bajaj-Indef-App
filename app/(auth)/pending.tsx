import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export default function PendingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <View style={[styles.container, { backgroundColor: colors?.background }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="check-circle-outline"
            size={48}
            color="#16a34a"
          />
        </View>

        <Text style={[styles.title, { color: colors?.text }]}>
          Registration Successful
        </Text>

        <Text style={styles.subtitle}>
          Your account{email ? ` (${email})` : ""} was created successfully.
          Your password has been sent to your email. Please check your inbox.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/(auth)/login")}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Go to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace("/(auth)/register")}
        >
          <Text style={styles.linkText}>Use a different email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "#fef3c7",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
    subtitle: {
      fontSize: 14,
      color: "#64748b",
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 32,
    },
    primaryButton: {
      backgroundColor: "#2563eb",
      borderRadius: 12,
      height: 52,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
    },
    primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    linkButton: { marginTop: 16 },
    linkText: { color: "#2563eb", fontSize: 14, fontWeight: "500" },
  });
