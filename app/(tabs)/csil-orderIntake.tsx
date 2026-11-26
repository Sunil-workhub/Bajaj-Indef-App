// screens/orderIntake.tsx
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
import { fetchOrderIntakeReport, formatCurrency } from "../../api/csilorderApi";
import { MonthlyData, OrderIntakeData } from "../../api/types";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = SCREEN_WIDTH >= 768;
const isLargeScreen = SCREEN_WIDTH >= 1024;

export default function OrderIntakeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [orderIntakeData, setOrderIntakeData] =
    useState<OrderIntakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const fetchOrderIntakeData = async () => {
    try {
      setError(null);
      console.log("🔄 Fetching order intake data...");
      const data = await fetchOrderIntakeReport();
      console.log("✅ Order intake data received:", data);
      setOrderIntakeData(data);
    } catch (err) {
      console.error("❌ Error fetching order intake data:", err);
      setError("Failed to load order intake data. Please try again.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchOrderIntakeData();
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
    await fetchOrderIntakeData();
    setRefreshing(false);
  };

  // Format currency for display
  const formatDisplayCurrency = (amount: number) => {
    return formatCurrency(amount);
  };

  // Table columns
  const tableColumns = [
    "Month",
    "ABP",
    "ABP EXP",
    "DC",
    "DC EXP",
    "Total",
    "SCM",
  ];
  const adjTableColumns = [
    "",
    "ABP",
    "ABP EXP",
    "DC",
    "DC EXP",
    "Total",
    "SCM",
  ];

  // Custom column widths
  const columnWidths = [16, 16, 12, 14, 12, 16, 14]; // percentages

  // Convert data to table format
  const convertToTableRow = (data: MonthlyData): string[] => [
    data.month,
    formatDisplayCurrency(data.abp),
    formatDisplayCurrency(data.abpExp),
    formatDisplayCurrency(data.dc),
    formatDisplayCurrency(data.dcExp),
    formatDisplayCurrency(data.total),
    formatDisplayCurrency(data.scm),
  ];

  const monthlyColumnAlignments: ("left" | "center" | "right")[] = [
    "left",
    "right",
    "right",
    "right",
    "right",
    "right",
    "right",
  ];
  const headerColumnAlignments: ("left" | "center" | "right")[] = [
    "left",
    "center",
    "center",
    "center",
    "center",
    "center",
    "center",
  ];

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading order intake data..." />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={64}
            color={colors?.accent}
          />
          <Text style={styles.errorTitle}>Error Loading Data</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrderIntakeData}
          >
            <MaterialIcons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No data state
  if (!orderIntakeData) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={64} color={colors?.textSecondary} />
          <Text style={styles.emptyStateText}>No data available</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrderIntakeData}
          >
            <MaterialIcons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Load Data</Text>
          </TouchableOpacity>
        </View>
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
        <View style={styles.blueHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Intake</Text>
          <View style={styles.logoContainer}>
            <MaterialIcons name="trending-up" size={24} color="#ffffff" />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors?.primary || "#2563eb"]}
              tintColor={colors?.primary || "#2563eb"}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.reportContainer}>
            {/* Current Year Monthly Data Table */}
            <View style={styles.tableSection}>
              <View style={styles.tableSectionHeader}>
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color={colors?.primary}
                />
                <Text style={styles.tableSectionTitle}>
                  Current Year Monthly Data
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableWrapper}>
                  {/* Table Header */}
                  <TableRow
                    columns={tableColumns}
                    isHeader
                    columnWidths={columnWidths}
                    columnAlignments={headerColumnAlignments}
                  />

                  {/* Monthly Data Rows */}
                  {orderIntakeData.currentYear.map((monthData, idx) => (
                    <TableRow
                      key={`current-${idx}`}
                      columns={convertToTableRow(monthData)}
                      isTotal={false}
                      columnWidths={columnWidths}
                      columnAlignments={monthlyColumnAlignments}
                    />
                  ))}

                  {/* Current Year Total */}
                  <View style={styles.totalRowContainer}>
                    <TableRow
                      columns={convertToTableRow(
                        orderIntakeData.currentYearTotal,
                      )}
                      isTotal={true}
                      columnWidths={columnWidths}
                      columnAlignments={monthlyColumnAlignments}
                    />
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Adjustments Table (Opening, Cancelled, Rebook) */}
            <View style={styles.tableSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableWrapper}>
                  {/* Table Header */}
                  <TableRow
                    columns={adjTableColumns}
                    isHeader
                    columnWidths={columnWidths}
                    columnAlignments={headerColumnAlignments}
                  />

                  {/* Adjustments Data */}
                  <TableRow
                    columns={convertToTableRow(
                      orderIntakeData.adjustments.opening,
                    )}
                    isTotal={false}
                    columnWidths={columnWidths}
                    columnAlignments={monthlyColumnAlignments}
                  />
                  <TableRow
                    columns={convertToTableRow(
                      orderIntakeData.adjustments.cancelled,
                    )}
                    isTotal={false}
                    columnWidths={columnWidths}
                    columnAlignments={monthlyColumnAlignments}
                  />
                  <TableRow
                    columns={convertToTableRow(
                      orderIntakeData.adjustments.rebook,
                    )}
                    isTotal={false}
                    columnWidths={columnWidths}
                    columnAlignments={monthlyColumnAlignments}
                  />

                  {/* Adjustments Total */}
                  <View style={styles.totalRowContainer}>
                    <TableRow
                      columns={convertToTableRow(
                        orderIntakeData.adjustmentsTotal,
                      )}
                      isTotal={true}
                      columnWidths={columnWidths}
                      columnAlignments={monthlyColumnAlignments}
                    />
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Previous Year Table */}
            <View style={styles.tableSection}>
              <View style={styles.tableSectionHeader}>
                <MaterialIcons
                  name="history"
                  size={20}
                  color={colors?.secondary}
                />
                <Text
                  style={[
                    styles.tableSectionTitle,
                    { color: colors?.secondary },
                  ]}
                >
                  Previous Year
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableWrapper}>
                  {/* Table Header */}
                  <TableRow
                    columns={tableColumns}
                    isHeader
                    columnWidths={columnWidths}
                    columnAlignments={headerColumnAlignments}
                  />

                  {/* Previous Year Data */}
                  {orderIntakeData.previousYear.map((monthData, idx) => (
                    <TableRow
                      key={`prev-${idx}`}
                      columns={convertToTableRow(monthData)}
                      isTotal={false}
                      columnWidths={columnWidths}
                      columnAlignments={monthlyColumnAlignments}
                    />
                  ))}

                  {/* Previous Year Total */}
                  <View style={styles.totalRowContainer}>
                    <TableRow
                      columns={convertToTableRow(
                        orderIntakeData.previousYearTotal,
                      )}
                      isTotal={true}
                      columnWidths={columnWidths}
                      columnAlignments={monthlyColumnAlignments}
                    />
                  </View>

                  {/* Yesterday Row */}
                  <View style={styles.sectionSpacing} />
                  <View style={styles.yesterdayRowContainer}>
                    <TableRow
                      columns={convertToTableRow(orderIntakeData.yesterday)}
                      isTotal={false}
                      columnWidths={columnWidths}
                      columnAlignments={monthlyColumnAlignments}
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
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
      zIndex: 1000,
    },
    content: {
      flex: 1,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    headerTitle: {
      fontSize: isTablet ? 24 : 18,
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
    reportContainer: {
      padding: isTablet ? 20 : 16,
      gap: 16,
    },
    tableSection: {
      backgroundColor: colors?.surface,
      borderRadius: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      overflow: "hidden",
    },
    tableSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: isTablet ? 12 : 8,
      paddingVertical: isTablet ? 12 : 8,
      backgroundColor: colors?.tableHeader,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
      gap: 8,
    },
    tableSectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: "700",
      color: colors?.primary,
      flex: 1,
    },
    dataCount: {
      backgroundColor: colors?.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    dataCountText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors?.primary,
    },
    tableWrapper: {
      minWidth: isTablet ? 1000 : 800,
      padding: isTablet ? 12 : 8,
    },
    totalRowContainer: {
      backgroundColor: colors?.cardBackground,
      borderRadius: 8,
      marginVertical: 4,
    },
    yesterdayRowContainer: {
      backgroundColor: colors?.accent + "30",
      borderRadius: 8,
      marginVertical: 2,
    },
    sectionSpacing: {
      height: 12,
    },
    summaryContainer: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors?.surface,
      padding: 16,
      borderRadius: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      alignItems: "center",
      gap: 8,
    },
    summaryCardTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors?.textSecondary,
      textAlign: "center",
    },
    summaryCardValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors?.text,
      textAlign: "center",
    },
    dataInfoFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      marginTop: 8,
    },
    dataInfoText: {
      fontSize: 14,
      color: colors?.textSecondary,
      fontStyle: "italic",
    },
    // Error states
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors?.accent,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: colors?.textSecondary,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 24,
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    retryButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors?.textSecondary,
      marginTop: 16,
      marginBottom: 24,
    },
  });
