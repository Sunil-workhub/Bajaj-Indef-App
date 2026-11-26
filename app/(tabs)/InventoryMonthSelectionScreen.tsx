/* eslint-disable react-hooks/exhaustive-deps */
// screens/InventoryMonthSelectionScreen.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { inventoryApi } from "../../api/inventoryApi";
import { MonthOption } from "../../api/types";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = SCREEN_WIDTH >= 768;
const isLargeScreen = SCREEN_WIDTH >= 1024;

export default function InventoryMonthSelectionScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const fetchMonths = async () => {
    try {
      setError(null);
      const monthsData = await inventoryApi.getAvailableMonths();
      setMonths(monthsData);
    } catch (err: any) {
      setError(err.message || "Failed to load available months");
      console.error("Error fetching months:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchMonths();
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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/(tabs)/" as any);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonths();
    setRefreshing(false);
  };

  const handleMonthSelect = (month: MonthOption) => {
    router.push({
      pathname: "/(tabs)/inventoryagingMonthly",
      params: {
        monthDescription: month.monthDescription,
        monthId: month.monthId.toString(),
      },
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading available months..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <ErrorMessage message={error} onRetry={fetchMonths} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Month</Text>
          <View style={styles.logoContainer}>
            <MaterialIcons name="calendar-today" size={24} color="#ffffff" />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthsContainer}>
            <Text style={styles.sectionTitle}>
              Select a month to view inventory aging report
            </Text>

            {months.map((month, index) => (
              <TouchableOpacity
                key={`${month.monthId}-${index}`}
                style={styles.monthCard}
                onPress={() => handleMonthSelect(month)}
                activeOpacity={0.7}
              >
                <View style={styles.monthCardContent}>
                  <View style={styles.monthInfo}>
                    <MaterialIcons name="event" size={24} color="#2563eb" />
                    <Text style={styles.monthText}>
                      {month.monthDescription}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#6b7280"
                  />
                </View>
              </TouchableOpacity>
            ))}

            {months.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <MaterialIcons name="event-busy" size={64} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No months available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Please check back later or contact support
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
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
      height: 60,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    headerTitle: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: "bold",
      color: colors?.text,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    logoContainer: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    content: {
      flex: 1,
    },
    monthsContainer: {
      padding: isTablet ? 20 : 16,
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: "600",
      color: colors?.textSecondary,
      marginBottom: 20,
      textAlign: "center",
    },
    monthCard: {
      backgroundColor: colors?.surface,
      borderRadius: 12,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    monthCardContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    monthInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    monthText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors?.text,
      marginLeft: 12,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors?.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors?.textSecondary,
      textAlign: "center",
    },
  });
