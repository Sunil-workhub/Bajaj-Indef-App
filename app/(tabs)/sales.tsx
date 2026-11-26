import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";
import { useSalesData } from "../../hooks/useSalesData";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = SCREEN_WIDTH >= 768;
const isLargeScreen = SCREEN_WIDTH >= 1024;

// Number formatting utility
const formatNumber = (value: string | number): string => {
  if (!value || value === "0" || value === "0.00") return "0.00";

  // Convert to string if it's a number
  const strValue = typeof value === "number" ? value.toString() : value;

  // Remove any existing formatting
  const cleanValue = strValue.replace(/[₹,\s]/g, "");

  // Parse as number
  const numValue = parseFloat(cleanValue);

  if (isNaN(numValue)) return strValue; // Return original if not a valid number

  // Format with Indian number system (commas)
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

// Format currency with rupee symbol
const formatCurrency = (value: string | number): string => {
  if (!value || value === "0" || value === "0.00") return "₹0.00";

  const formattedNumber = formatNumber(value);
  return `₹${formattedNumber}`;
};

export default function SalesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { data, loading, error, fetchData } = useSalesData();
  const [refreshing, setRefreshing] = useState(false);

  const { colors } = useTheme();

  const styles = createStyles(colors);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        await fetchData();
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

  const summaryColumns = ["Description", "Current Month", "YTD"];
  const monthColumns = ["Month", "Current Year", "Previous Year"];

  // Define column alignments for consistent header-data alignment
  const summaryAlignments: ("left" | "center" | "right")[] = [
    "left",
    "right",
    "right",
  ];
  const monthAlignments: ("left" | "center" | "right")[] = [
    "left",
    "right",
    "right",
  ];

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/(tabs)/" as any);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading sales data..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <ErrorMessage message={error} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  // Format summary data with proper number formatting
  const summaryData =
    data?.summary?.map((item) => [
      item.description,
      formatNumber(item.currentMonth),
      formatNumber(item.ytd),
    ]) || [];

  // Format monthly data with proper number formatting
  const monthlyData =
    data?.monthlyBreakdown?.map((item) => [
      item.month,
      formatNumber(item.currentYear),
      formatNumber(item.previousYear),
    ]) || [];

  // Separate regular data from total rows
  const summaryRegularData =
    summaryData.length > 1 ? summaryData.slice(0, -1) : [];
  const summaryTotalRow =
    summaryData.length > 0 ? summaryData[summaryData.length - 1] : null;

  const monthlyRegularData =
    monthlyData.length > 1 ? monthlyData.slice(0, -1) : [];
  const monthlyTotalRow =
    monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      {!loading && (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.blueHeader}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sales Summary</Text>
            <View style={styles.logoContainer}>
              <MaterialIcons name="business" size={24} color="#ffffff" />
            </View>
          </View>

          <ScrollView
            style={styles.content}
            // refreshControl={
            //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            // }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* This Month Summary Section */}
            <View style={styles.tableSection}>
              {/* <View style={styles.tableSectionHeader}>
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color="#2563eb"
                />
                <Text style={styles.tableSectionTitle}>This Month</Text>
                <View style={styles.recordCount}>
                  <Text style={styles.recordCountText}>
                    {summaryRegularData.length} items
                  </Text>
                </View>
              </View> */}

              <View style={styles.tableContainer}>
                {/* Fixed Header */}
                <View style={styles.fixedHeader}>
                  <TableRow
                    columns={summaryColumns}
                    isHeader
                    columnAlignments={summaryAlignments}
                  />
                </View>

                {/* Scrollable Content */}
                <ScrollView
                  style={[
                    styles.tableScrollView,
                    { maxHeight: getResponsiveTableHeight() },
                  ]}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {summaryRegularData.length > 0 ? (
                    summaryRegularData.map((row, idx) => (
                      <TableRow
                        key={`summary-${idx}`}
                        columns={row}
                        isTotal={false}
                        columnAlignments={summaryAlignments}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyTableState}>
                      <MaterialIcons name="info" size={32} color="#9ca3af" />
                      <Text style={styles.emptyTableText}>
                        No summary data available
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Fixed Total Row */}
                {summaryTotalRow && (
                  <View style={styles.fixedTotalRow}>
                    <TableRow
                      columns={summaryTotalRow}
                      isTotal
                      columnAlignments={summaryAlignments}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Today's Sale Card */}
            <View style={styles.todaySaleCard}>
              {/* <View style={styles.todaySaleIconContainer}>
                <MaterialIcons name="today" size={20} color="#0284c7" />
              </View> */}
              <View style={styles.todaySaleContent}>
                <Text style={styles.todaySaleLabel}>Today&apos;s Sale</Text>
                <Text style={styles.todaySaleValue}>
                  {formatCurrency(data?.todaySale || "0.00")}
                </Text>
              </View>
            </View>

            {/* Monthly Breakdown Section */}
            <View style={styles.tableSection}>
              {/* <View style={styles.tableSectionHeader}>
                <MaterialIcons name="trending-up" size={20} color="#2563eb" />
                <Text style={styles.tableSectionTitle}>Monthly Breakdown</Text>
                <View style={styles.recordCount}>
                  <Text style={styles.recordCountText}>
                    {monthlyRegularData.length} months
                  </Text>
                </View>
              </View> */}

              <View style={styles.tableContainer}>
                {/* Fixed Header */}
                <View style={styles.fixedHeader}>
                  <TableRow
                    columns={monthColumns}
                    isHeader
                    columnAlignments={monthAlignments}
                  />
                </View>

                {/* Scrollable Content */}
                <ScrollView
                  style={[
                    styles.tableScrollView,
                    { maxHeight: getResponsiveTableHeightBot() },
                  ]}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {monthlyRegularData.length > 0 ? (
                    monthlyRegularData.map((row, idx) => (
                      <TableRow
                        key={`monthly-${idx}`}
                        columns={row}
                        isTotal={false}
                        columnAlignments={monthAlignments}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyTableState}>
                      <MaterialIcons name="info" size={32} color="#9ca3af" />
                      <Text style={styles.emptyTableText}>
                        No monthly data available
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Fixed Total Row */}
                {monthlyTotalRow && (
                  <View style={styles.fixedTotalRow}>
                    <TableRow
                      columns={monthlyTotalRow}
                      isTotal
                      columnAlignments={monthAlignments}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Bottom spacing for better scrolling */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// Responsive function for table height
const getResponsiveTableHeight = () => {
  if (isLargeScreen) {
    return Math.min(400, SCREEN_HEIGHT * 0.4);
  } else if (isTablet) {
    return Math.min(300, SCREEN_HEIGHT * 0.3);
  } else {
    return Math.min(260, SCREEN_HEIGHT * 0.55);
  }
};
const getResponsiveTableHeightBot = () => {
  if (isLargeScreen) {
    return Math.min(400, SCREEN_HEIGHT * 0.35);
  } else if (isTablet) {
    return Math.min(300, SCREEN_HEIGHT * 0.3);
  } else {
    return Math.min(250, SCREEN_HEIGHT * 0.25);
  }
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f8fafc",
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
      minHeight: 60,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    headerTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: "bold",
      color: "#ffffff",
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
      padding: isTablet ? 20 : 16,
      backgroundColor: colors?.background,
    },
    tableSection: {
      backgroundColor: "#ffffff",
      borderRadius: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      overflow: "hidden",
      marginBottom: 16,
    },
    tableSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: isTablet ? 10 : 8,
      backgroundColor: "#f8fafc",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    tableSectionTitle: {
      fontSize: isTablet ? 18 : 14,
      fontWeight: "700",
      color: "#1f2937",
      flex: 1,
      marginLeft: 8,
    },
    recordCount: {
      backgroundColor: "#e0f2fe",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    recordCountText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#0369a1",
    },
    tableContainer: {
      flex: 1,
    },
    fixedHeader: {
      backgroundColor: "#ffffff",
      elevation: 1,
      zIndex: 1,
      borderBottomWidth: 2,
      borderBottomColor: "#e5e7eb",
    },
    tableScrollView: {
      backgroundColor: "#ffffff",
      flexGrow: 0,
    },
    fixedTotalRow: {
      backgroundColor: "#f3f4f6",
      elevation: 1,
      zIndex: 1,
      borderTopWidth: 2,
      borderTopColor: "#e5e7eb",
    },
    emptyTableState: {
      alignItems: "center",
      justifyContent: "center",
      padding: isTablet ? 60 : 40,
      minHeight: 120,
    },
    emptyTableText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#6b7280",
      marginTop: 8,
      textAlign: "center",
    },
    todaySaleCard: {
      backgroundColor: "#ffffff",
      borderRadius: 12,
      padding: isTablet ? 8 : 8,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      borderLeftWidth: 4,
      borderLeftColor: "#0284c7",
    },
    todaySaleIconContainer: {
      width: isTablet ? 56 : 40,
      height: isTablet ? 56 : 40,
      borderRadius: isTablet ? 12 : 10,
      backgroundColor: "#e0f2fe",
      alignItems: "center",
      justifyContent: "center",
      marginRight: isTablet ? 20 : 16,
    },
    todaySaleContent: {
      flex: 1,
      display: "flex",
      flexDirection: "row",
      alignItems: "baseline",
      gap: isTablet ? 16 : 12,
      justifyContent: "center",
    },
    todaySaleLabel: {
      fontSize: isTablet ? 16 : 16,
      color: "#6b7280",
      fontWeight: "600",
      marginBottom: 4,
    },
    todaySaleValue: {
      fontSize: isTablet ? 28 : 20,
      fontWeight: "900",
      color: "#0284c7",
    },
    bottomSpacing: {
      height: 20,
    },
  });
