import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { apiMessage } from "../../utils/apiResponse";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { login, status, needsOrgSelection, selectedOrg, orgAccess } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    console.log("Auth redirect check:", {
      status,
      orgCount: orgAccess.length,
      selectedOrg,
      needsOrgSelection,
    });

    if (needsOrgSelection) {
      router.replace("/(auth)/select-org");
      return;
    }

    if (selectedOrg) {
      router.replace("/(tabs)");
    }
  }, [status, needsOrgSelection, selectedOrg, orgAccess.length, router]);

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    setSubmitting(true);

    try {
      await login(email.trim().toLowerCase(), password);

      // Do NOT redirect here.
      // Auth state updates will trigger the useEffect above.
    } catch (e: any) {
      setError(apiMessage(e, "Unable to log in. Please try again."));
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
          <MaterialIcons name="lock-outline" size={48} color={colors?.text} />
        </View>

        <Text style={[styles.title, { color: colors?.text }]}>
          Welcome Back
        </Text>
        <Text style={styles.subtitle}>
          Log in with the credentials provided by your admin
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

        <View style={[styles.inputCard, { marginTop: 12 }]}>
          <MaterialIcons
            name="lock-outline"
            size={20}
            color="#64748b"
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: colors?.text }]}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!submitting}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
            <MaterialIcons
              name={showPassword ? "visibility-off" : "visibility"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.linkText}>
            Don't have an account? Request access
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
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
