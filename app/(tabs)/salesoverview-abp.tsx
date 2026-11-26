// screens/salesOverviewABP.tsx - Fixed total row at bottom
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
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
import { fetchABPSalesData } from "../../api/abpSalesApi";
import { ABPSalesData } from "../../api/types";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// // Responsive breakpoints
// const isTablet = SCREEN_WIDTH >= 768;
// const isLargeScreen = SCREEN_WIDTH >= 1024;

// const TABLE_MAX_HEIGHT = SCREEN_HEIGHT * 0.72; // Adjusted for fixed total row

export default function SalesOverviewABPScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [salesData, setSalesData] = useState<ABPSalesData[]>([]);
  const [totalData, setTotalData] = useState<ABPSalesData | null>(null);
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

  const fetchSalesDataFromApi = async () => {
    try {
      setError(null);
      const { data, total } = await fetchABPSalesData();
      setSalesData(data);
      setTotalData(total);
    } catch (err) {
      setError("Failed to load ABP sales overview data");
      console.error("Error fetching ABP sales overview data:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchSalesDataFromApi();
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
    await fetchSalesDataFromApi();
    setRefreshing(false);
  };

  const formatNumber = (value: number) => {
    if (value === 0) return "0";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Table columns
  const tableColumns = [
    "ABP Name",
    "Booked Qty",
    "Booked Value",
    "Billed Qty",
    "Billed Value",
    "Pending Qty",
    "Pending Value",
  ];

  const columnAlignments: ("left" | "center" | "right")[] = [
    "left", // Order No.
    "center", // Buyer
    "right", // Entered On
    "center", // Promise Dt
    "right", // Item Code
    "center", // Description
    "right", // Qty
  ];
  const headerColumnAlignments: ("left" | "center" | "right")[] = [
    "left", // Order No.
    "center", // Buyer
    "center", // Entered On
    "center", // Promise Dt
    "center", // Item Code
    "center", // Description
    "center", // Qty
  ];

  // Custom column widths for better readability
  const columnWidths = [20, 11, 16, 11, 16, 11, 10]; // percentages

  // Convert data to table format
  const convertToTableRow = (data: ABPSalesData): string[] => [
    data.abpName,
    formatNumber(data.bookedQty),
    formatNumber(data.bookedValue),
    formatNumber(data.billedQty),
    formatNumber(data.billedValue),
    formatNumber(data.pendingQty),
    formatNumber(data.pendingValue),
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading ABP sales overview data..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <ErrorMessage message={error} onRetry={fetchSalesDataFromApi} />
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              Sales Overview (ABP wise)
            </Text>
          </View>

          <View style={styles.logoContainer}>
            <MaterialIcons name="analytics" size={24} color="#ffffff" />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Sales Overview Table */}
          <View style={styles.tableSection}>
            {/* Horizontal Scroll Container */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.tableWrapper}>
                {/* Table Header - Fixed at top */}
                <TableRow
                  columns={tableColumns}
                  isHeader
                  columnWidths={columnWidths}
                  columnAlignments={headerColumnAlignments}
                />

                {/* Scrollable Table Content */}
                <ScrollView
                  style={[styles.tableContent, { maxHeight: TABLE_MAX_HEIGHT }]}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {/* Sales Data Rows */}
                  {salesData.length > 0 ? (
                    salesData.map((abpData, idx) => (
                      <TableRow
                        key={`${abpData.abpName}-${idx}`}
                        columns={convertToTableRow(abpData)}
                        isTotal={false}
                        columnWidths={columnWidths}
                        columnAlignments={columnAlignments}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <MaterialIcons
                        name="business"
                        size={48}
                        color={colors?.textSecondary}
                      />
                      <Text style={styles.emptyStateText}>
                        No ABP sales data found
                      </Text>
                      <Text style={styles.emptyStateSubtext}>
                        ABP sales information will appear here when available.
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Fixed Total Row at Bottom */}
                {totalData && (
                  <View style={styles.fixedTotalRow}>
                    <TableRow
                      columns={convertToTableRow(totalData)}
                      isTotal={true}
                      columnWidths={columnWidths}
                      columnAlignments={columnAlignments}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
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
    content: {
      flex: 1,
      padding: isTablet ? 20 : 16,
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
      justifyContent: "space-between",
      padding: isTablet ? 12 : 8,
      backgroundColor: colors?.tableHeader,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    tableSectionTitle: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: "700",
      color: colors?.text,
      flex: 1,
      marginLeft: 8,
    },
    recordCount: {
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
    tableWrapper: {
      minWidth: isTablet ? 1200 : 1000,
    },
    tableContent: {
      flex: 1,
    },
    fixedTotalRow: {
      backgroundColor: colors?.cardBackground,
      borderTopWidth: 2,
      borderTopColor: colors?.border,
      marginTop: 4,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: isTablet ? 60 : 40,
    },
    emptyStateText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors?.textSecondary,
      marginTop: 12,
      marginBottom: 4,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors?.textSecondary,
      textAlign: "center",
    },
  });
