// screens/DebtorsAgingSelectorScreen.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { debtorsAgingApi } from "../../api/DebtorsAgingApi";
import { CustomerTypeTab } from "../../api/types";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = SCREEN_WIDTH >= 768;
const isLargeScreen = SCREEN_WIDTH >= 1024;

export default function DebtorsAgingSelectorScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [customerTypes, setCustomerTypes] = useState<CustomerTypeTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const fetchCustomerTypes = async () => {
    try {
      setError(null);
      const types = await debtorsAgingApi.getCustomerTypes();
      setCustomerTypes(types);
    } catch (err: any) {
      setError(err.message || "Failed to load customer types");
      console.error("Error fetching customer types:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchCustomerTypes();
        if (isActive) {
          setLoading(false);
        }
      };
      load();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleSelect = (type: string) => {
    router.push({ pathname: "/(tabs)/debtorsAgingReport", params: { type } });
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/(tabs)/" as any);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.blueHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Debtors Aging</Text>
          <View style={styles.logoContainer}>
            <MaterialIcons name="business" size={24} color="#ffffff" />
          </View>
        </View>
        <LoadingSpinner message="Loading customer types..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.blueHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Debtors Aging</Text>
          <View style={styles.logoContainer}>
            <MaterialIcons name="business" size={24} color="#ffffff" />
          </View>
        </View>
        <ErrorMessage message={error} onRetry={fetchCustomerTypes} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Blue Header */}
      <View style={styles.blueHeader}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debtors Aging</Text>
        <View style={styles.logoContainer}>
          <MaterialIcons name="business" size={24} color="#ffffff" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructionText}>
          Select customer type to view aging report
        </Text>

        <View style={styles.optionsContainer}>
          {customerTypes.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[
                styles.button,
                { backgroundColor: colors?.cardBackground },
              ]}
              onPress={() => handleSelect(opt.type)}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name={opt.icon as any}
                color="#fff"
                size={24}
                style={styles.icon}
              />
              <Text style={styles.buttonText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {customerTypes.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="info"
              size={48}
              color={colors?.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              No customer types available
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors?.background,
    },
    blueHeader: {
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
      height: 60,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    headerTitle: {
      fontSize: isTablet ? 24 : 22,
      fontWeight: "bold",
      color: colors?.text,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 16,
    },
    logoContainer: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    content: {
      flex: 1,
      padding: isTablet ? 24 : 16,
    },
    instructionText: {
      fontSize: isTablet ? 18 : 16,
      color: colors?.textSecondary,
      textAlign: "center",
      marginVertical: isTablet ? 24 : 20,
      fontWeight: "500",
    },
    optionsContainer: {
      alignItems: "center",
      width: "100%",
    },
    button: {
      width: isTablet ? "75%" : "87%",
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: isTablet ? 26 : 22,
      paddingHorizontal: isTablet ? 22 : 18,
      borderRadius: 14,
      marginVertical: 12,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.13,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      justifyContent: "flex-start",
    },
    icon: {
      marginRight: 18,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: isTablet ? 20 : 18,
      letterSpacing: 0.5,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors?.textSecondary,
      marginTop: 16,
      textAlign: "center",
    },
  });
