import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registerUser } from "../../api/authService";
import { useTheme } from "../../contexts/ThemeContext";
import { apiMessage, unwrapApi } from "../../utils/apiResponse";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await registerUser(normalizedEmail);
      const account = unwrapApi<{ email?: string; status?: string }>(response);

      router.replace({
        pathname: "/(auth)/pending",
        params: { email: account?.email || normalizedEmail },
      });
    } catch (e: any) {
      setError(apiMessage(e, "Unable to register. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors?.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="mail-outline" size={48} color={colors?.text} />
        </View>

        <Text style={[styles.title, { color: colors?.text }]}>
          Create Account
        </Text>
        <Text style={styles.subtitle}>
          Enter your email to create an account. Your login details will be sent
          to your email after successful registration.
        </Text>

        <View style={styles.inputCard}>
          <MaterialIcons
            name="alternate-email"
            size={20}
            color="#64748b"
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: colors?.text }]}
            placeholder="you@company.com"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!submitting}
          />
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? "Submitting..." : "Register"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 28,
    },
    iconWrap: { alignItems: "center", marginBottom: 16 },
    title: {
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: "#64748b",
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 28,
    },
    inputCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 54,
      elevation: 4,
      shadowColor: "#3b3b3b",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15 },
    errorText: {
      color: "#ef4444",
      fontSize: 13,
      marginTop: 10,
      marginLeft: 4,
    },
    primaryButton: {
      backgroundColor: "#2563eb",
      borderRadius: 12,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      elevation: 4,
    },
    buttonDisabled: { opacity: 0.6 },
    primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    linkButton: { marginTop: 18, alignItems: "center" },
    linkText: { color: "#2563eb", fontSize: 14, fontWeight: "500" },
  });
