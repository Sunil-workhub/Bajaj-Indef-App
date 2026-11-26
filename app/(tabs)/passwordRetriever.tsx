// screens/PinValidationScreen.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { validateUserPin } from "../../api/passwordRetrieverApi";
import { useTheme } from "../../contexts/ThemeContext";

const PIN_LENGTH = 4;

export default function PinValidationScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLandscape = width > height;

  const styles = createStyles(colors, isTablet, isLandscape);

  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ✅ Clear PIN whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset PIN when screen is focused
      setPin(Array(PIN_LENGTH).fill(""));
      setError(null);
      setLoading(false);

      // Focus first input after a small delay
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);

      // Cleanup when screen loses focus
      return () => {
        clearTimeout(timer);
        // Clear PIN when leaving the screen
        setPin(Array(PIN_LENGTH).fill(""));
        setError(null);
      };
    }, []),
  );

  const handleBackPress = () => {
    // Clear PIN before going back
    setPin(Array(PIN_LENGTH).fill(""));
    setError(null);

    if (navigation.canGoBack()) navigation.goBack();
    else router.push("/(tabs)/" as any);
  };

  const handlePinChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    setError(null);
    const newPin = [...pin];

    if (value.length > 1) {
      const digits = value.slice(0, PIN_LENGTH).split("");
      digits.forEach((digit, idx) => {
        if (index + idx < PIN_LENGTH) newPin[index + idx] = digit;
      });
      setPin(newPin);

      const nextIndex = Math.min(index + digits.length, PIN_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newPin[index] = value;
      setPin(newPin);

      if (value && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== "Backspace") return;

    const newPin = [...pin];
    if (pin[index]) {
      newPin[index] = "";
      setPin(newPin);
    } else if (index > 0) {
      newPin[index - 1] = "";
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validatePin = async () => {
    const enteredPin = pin.join("");

    if (enteredPin.length !== PIN_LENGTH) {
      setError(`Please enter a ${PIN_LENGTH}-digit PIN`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await validateUserPin(parseInt(enteredPin));

      if (response.isValid) {
        // ✅ Clear PIN before navigation for security
        setPin(Array(PIN_LENGTH).fill(""));
        router.push("/passwordRetrievalNextScreen" as any);
      } else {
        setError(response.message || "Invalid PIN. Please try again.");
        setPin(Array(PIN_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate PIN. Please try again.");
      setPin(Array(PIN_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const isPinComplete = pin.every((digit) => digit !== "");

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            Password Retrieval
          </Text>
        </View>
        <View style={styles.logoContainer}>
          <MaterialIcons name="lock-outline" size={24} color="#ffffff" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={60}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialIcons
                name="lock"
                size={isTablet ? 64 : 56}
                color={colors?.primary}
              />
            </View>

            <Text style={styles.title}>Enter PIN</Text>
            <Text style={styles.subtitle}>
              Enter your 4-digit PIN to access password retrieval
            </Text>

            <View style={styles.pinContainer}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.pinInput,
                    digit && styles.pinInputFilled,
                    error && styles.pinInputError,
                  ]}
                  value={digit}
                  onChangeText={(value) => handlePinChange(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  secureTextEntry
                  autoFocus={index === 0}
                  editable={!loading}
                  returnKeyType="done"
                />
              ))}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.validateButton,
                (!isPinComplete || loading) && styles.validateButtonDisabled,
              ]}
              onPress={validatePin}
              disabled={!isPinComplete || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.validateButtonText}>Validate PIN</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color="#ffffff"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isTablet: boolean, isLandscape: boolean) =>
  StyleSheet.create({
    flex: { flex: 1 },

    container: {
      flex: 1,
      backgroundColor: colors?.background,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors?.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      minHeight: 60,
    },
    backButton: {
      alignSelf: "flex-start",
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    headerTitleContainer: {
      flex: 1,
      marginHorizontal: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: isTablet ? 18 : 16, // Reduced from 20/18
      fontWeight: "bold",
      color: colors?.text,
      textAlign: "center",
      lineHeight: isTablet ? 24 : 20, // Added line height for better spacing
    },
    logoContainer: {
      alignSelf: "flex-start",
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingVertical: isLandscape ? 16 : 24,
    },

    content: {
      paddingHorizontal: isTablet ? 32 : 24,
      alignItems: "center",
    },

    iconContainer: {
      width: isTablet ? 120 : 96,
      height: isTablet ? 120 : 96,
      borderRadius: isTablet ? 60 : 48,
      backgroundColor: colors?.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isLandscape ? 16 : 28,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.13,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },

    title: {
      fontSize: isTablet ? 30 : 26,
      fontWeight: "bold",
      color: colors?.text,
      marginBottom: 8,
      textAlign: "center",
    },

    subtitle: {
      fontSize: isTablet ? 16 : 14,
      color: colors?.textSecondary,
      marginBottom: isLandscape ? 16 : 20,
      textAlign: "center",
      paddingHorizontal: 20,
    },

    pinContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: isLandscape ? 16 : 24,
      gap: isTablet ? 18 : 14,
    },

    pinInput: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 70 : 60,
      borderRadius: 12,
      backgroundColor: colors?.cardBackground,
      borderWidth: 2,
      borderColor: colors?.border,
      fontSize: isTablet ? 32 : 28,
      fontWeight: "bold",
      color: colors?.text,
      textAlign: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    pinInputFilled: {
      borderColor: colors?.primary,
      backgroundColor: colors?.surface,
    },
    pinInputError: {
      borderColor: "#ef4444",
    },

    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderRadius: 8,
      gap: 8,
      maxWidth: isTablet ? 500 : 350,
    },
    errorText: {
      color: "#ef4444",
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
    },

    validateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors?.primary,
      paddingVertical: isTablet ? 18 : 16,
      paddingHorizontal: isTablet ? 48 : 40,
      borderRadius: 12,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.13,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      gap: 8,
      minWidth: isTablet ? 240 : 200,
      alignSelf: "center",
    },
    validateButtonDisabled: {
      backgroundColor: colors?.border,
      opacity: 0.6,
    },
    validateButtonText: {
      color: "#ffffff",
      fontSize: isTablet ? 20 : 18,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
  });
