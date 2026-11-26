// screens/DebtorsAgingReportScreen.tsx
import { MaterialIcons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { debtorsAgingApi } from "../../api/DebtorsAgingApi";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// // Responsive breakpoints
// const isTablet = SCREEN_WIDTH >= 768;
// const isLargeScreen = SCREEN_WIDTH >= 1024;

const columns = [
  "S.No",
  "Account",
  "Customer",
  "Type",
  "Balance",
  "Not Due",
  "0-30",
  "31-60",
  "61-90",
  "91-120",
  "121-180",
  "181-365",
  "366-730",
  "731-1095",
  "Above 1095",
];

// Updated column widths for the new structure (percentages)
const columnWidths = [4, 8, 16, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6];

export default function DebtorsAgingReportScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [data, setData] = useState<string[][]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { height, width } = useWindowDimensions(); // [web:157]
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const TABLE_MAX_HEIGHT = isLandscape ? 160 : height * 0.72;

  // const TABLE_MAX_HEIGHT = Math.max(160, height * 0.72);

  const { colors } = useTheme();
  const styles = createStyles(colors, isTablet);

  const fetchData = async () => {
    try {
      setError(null);
      const typeParam = Array.isArray(type) ? type[0] : type || "ALL";

      const response = await debtorsAgingApi.getDebtorsAgingReport(typeParam);

      // Convert API response to table format
      const tableData = debtorsAgingApi.convertToTableFormat(response);
      setData(tableData);
      setSummary(response.summary);
      setSelectedType(response.selectedType);
    } catch (err: any) {
      setError(err.message || "Failed to load debtors aging data");
      console.error("Error fetching debtors aging data:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchData();
        if (isActive) {
          setLoading(false);
        }
      };
      load();
      return () => {
        isActive = false;
      };
    }, [type]),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleBackPress = () => {
    router.push("/(tabs)/debtorsaging" as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const regularData = data.filter((row) => row[2] !== "Total");
  const totalRow = data.find((row) => row[2] === "Total");

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading debtors aging data..." />
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
          <Text style={styles.headerTitle}>Debtors Aging Report</Text>
          <View style={styles.logoContainer}>
            <MaterialIcons name="business" size={24} color="#ffffff" />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Cards */}
          {/* {summary && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Total Balance</Text>
                  <Text style={styles.summaryValue}>
                    ₹{debtorsAgingApi.formatNumber(summary.totalBalance)}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Total Overdue</Text>
                  <Text style={styles.summaryValue}>
                    ₹
                    {debtorsAgingApi.formatNumber(
                      summary.totalDays0To30 +
                        summary.totalDays31To60 +
                        summary.totalDays61To90 +
                        summary.totalDays91To120 +
                        summary.totalDays121To180 +
                        summary.totalDays181To365 +
                        summary.totalDays365To730 +
                        summary.totalDays731To1095 +
                        summary.totalAbove1095,
                    )}
                  </Text>
                </View>
              </View>
            </View>
          )} */}

          {/* Aging Analysis Table */}
          <View style={styles.tableSection}>
            <View style={styles.tableContainer}>
              {/* Horizontal scroll for wide table */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableWrapper}>
                  {/* Fixed Header */}
                  <View style={styles.fixedHeader}>
                    <TableRow
                      columns={columns}
                      isHeader
                      columnWidths={columnWidths}
                    />
                  </View>

                  {/* Scrollable Content */}
                  <ScrollView
                    style={[
                      styles.tableScrollView,
                      { maxHeight: TABLE_MAX_HEIGHT },
                    ]}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {regularData.length > 0 ? (
                      regularData.map((row, idx) => (
                        <TableRow
                          key={`${idx}-${row[0]}`}
                          columns={row}
                          columnWidths={columnWidths}
                        />
                      ))
                    ) : (
                      <View style={styles.emptyTableState}>
                        <MaterialIcons
                          name="info"
                          size={48}
                          color={colors?.textSecondary}
                        />
                        <Text style={styles.emptyTableText}>
                          No data available
                        </Text>
                        <Text style={styles.emptyTableSubtext}>
                          Try selecting a different customer type
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Fixed Total Row */}
                  {totalRow && (
                    <View style={styles.fixedTotalRow}>
                      <TableRow
                        columns={totalRow}
                        isTotal
                        columnWidths={columnWidths}
                      />
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function formatType(type: any): string {
  switch (String(type).toUpperCase()) {
    case "ABP":
      return "ABP";
    case "ABP EXPORT":
      return "ABP Export";
    case "AMA":
      return "AMA";
    case "DIRECT":
      return "Direct Customer";
    case "SCM":
      return "SCM Customer";
    case "ALL":
      return "All Customers";
    default:
      return String(type) || "Unknown";
  }
}

const createStyles = (colors: any, isTablet: boolean) =>
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
      fontSize: isTablet ? 20 : 18,
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
      padding: isTablet ? 20 : 16,
    },
    filterCard: {
      backgroundColor: colors?.primary + "20",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: isTablet ? 20 : 16,
      marginVertical: 8,
      borderRadius: 8,
      elevation: 1,
    },
    filterIcon: {
      marginRight: 8,
    },
    filterText: {
      color: colors?.primary,
      fontSize: 16,
      flex: 1,
    },
    filterValue: {
      fontWeight: "bold",
      color: colors?.primary,
    },
    recordCount: {
      fontSize: 12,
      color: colors?.primary,
      backgroundColor: colors?.primary + "30",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      fontWeight: "600",
    },
    summaryContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
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
      flexDirection: "row",
      alignItems: "center",
    },
    summaryIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors?.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    summaryContent: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors?.textSecondary,
      fontWeight: "600",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    summaryValue: {
      fontSize: 16,
      color: colors?.text,
      fontWeight: "700",
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
      marginBottom: 16,
    },
    tableSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      backgroundColor: colors?.tableHeader,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    tableSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors?.text,
      flex: 1,
      marginLeft: 8,
    },
    recordCountBadge: {
      backgroundColor: colors?.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    recordCountText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors?.primary,
    },
    tableContainer: {
      flex: 1,
    },
    tableWrapper: {
      minWidth: isTablet ? 1600 : 1400,
    },
    fixedHeader: {
      backgroundColor: colors?.surface,
      elevation: 1,
      zIndex: 1,
      borderBottomWidth: 2,
      borderBottomColor: colors?.border,
    },
    tableScrollView: {
      backgroundColor: colors?.surface,
    },
    fixedTotalRow: {
      backgroundColor: colors?.cardBackground,
      elevation: 1,
      zIndex: 1,
      borderTopWidth: 2,
      borderTopColor: colors?.border,
    },
    emptyTableState: {
      alignItems: "center",
      justifyContent: "center",
      padding: isTablet ? 80 : 60,
      minHeight: 200,
    },
    emptyTableText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors?.textSecondary,
      marginTop: 12,
      marginBottom: 4,
    },
    emptyTableSubtext: {
      fontSize: 14,
      color: colors?.textSecondary,
      textAlign: "center",
    },
    dataInfo: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.cardBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      gap: 6,
    },
    dataInfoText: {
      fontSize: 12,
      color: colors?.textSecondary,
      flex: 1,
    },
  });
