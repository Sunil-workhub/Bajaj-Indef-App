// screens/orderRegister.tsx (Entered, to be booked)
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
import {
  fetchOrderRegisterData,
  fetchSummaryData,
} from "../../api/csilorderRegisterApi";
import { OrderData, SummaryData } from "../../api/types";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// // Responsive breakpoints
// const isTablet = SCREEN_WIDTH >= 768;
// const isLargeScreen = SCREEN_WIDTH >= 1024;

export default function OrderRegisterScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [orderData, setOrderData] = useState<OrderData[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { height, width } = useWindowDimensions(); // [web:157]
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const TABLE_MAX_HEIGHT = isLandscape ? 130 : height * 0.66;

  const { colors } = useTheme();
  const styles = createStyles(colors, isTablet, isLandscape);

  const fetchData = async () => {
    try {
      setError(null);
      console.log("Fetching order register data...");

      // Fetch both orders and summary data
      const [orders, summary] = await Promise.all([
        fetchOrderRegisterData(),
        fetchSummaryData(),
      ]);

      console.log("Fetched orders:", orders.length);
      console.log("Fetched summary:", summary);

      setOrderData(orders);
      setSummaryData(summary);
    } catch (err) {
      console.error("Error fetching order register data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load order register data",
      );
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
    await fetchData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Table columns
  const tableColumns = [
    "Order No.",
    "Buyer",
    "Entered On",
    "Promise Dt",
    "Item Code",
    "Description",
    "Qty",
    "Value",
  ];

  // Custom column widths for better readability
  const columnWidths = [11, 11, 11, 11, 10, 25, 6, 13]; // percentages

  const columnAlignments: ("left" | "center" | "right")[] = [
    "left", // Order No.
    "left", // Buyer
    "left", // Entered On
    "left", // Promise Dt
    "left", // Item Code
    "left", // Description
    "center", // Qty
    "right", // Value
  ];

  // Convert data to table format
  const tableData = orderData.map((order) => [
    order.orderNo,
    order.buyer,
    order.enteredOn,
    order.promiseDt,
    order.itemCode,
    order.description,
    order.qty.toString(),
    formatCurrency(order.value),
  ]);

  // Calculate totals function
  const calculateTotals = () => {
    const totalQty = orderData.reduce((sum, order) => sum + order.qty, 0);
    const totalValue = orderData.reduce((sum, order) => sum + order.value, 0);

    return [
      "Total",
      "",
      "",
      "",
      "",
      "",
      totalQty.toString(),
      formatCurrency(totalValue),
    ];
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading order register data..." />
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              Order Register [to be booked]
            </Text>
          </View>

          <View style={styles.logoContainer}>
            <MaterialIcons name="receipt-long" size={24} color="#ffffff" />
          </View>
        </View>

        {/* Summary Strip */}
        {summaryData && (
          <View style={styles.summaryStrip}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconContainer}>
                  <MaterialIcons
                    name="settings"
                    size={16}
                    color={colors?.iconGreen}
                  />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Spares</Text>
                  <Text style={styles.summaryValue}>
                    ₹{formatCurrency(summaryData.spares)}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <View style={styles.summaryIconContainer}>
                  <MaterialIcons
                    name="precision-manufacturing"
                    size={16}
                    color={colors?.iconBlue}
                  />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Mains</Text>
                  <Text style={styles.summaryValue}>
                    ₹{formatCurrency(summaryData.mains)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Order Register Table */}
          <View style={styles.tableSection}>
            <View style={styles.tableContainer}>
              {/* Horizontal scroll for wide table */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableWrapper}>
                  <TableRow
                    columns={tableColumns}
                    isHeader
                    columnWidths={columnWidths}
                    columnAlignments={columnAlignments}
                  />

                  <ScrollView
                    style={{ maxHeight: TABLE_MAX_HEIGHT }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {tableData.length > 0 ? (
                      tableData.map((row, idx) => (
                        <TableRow
                          key={idx}
                          columns={row}
                          isTotal={false}
                          columnWidths={columnWidths}
                          columnAlignments={columnAlignments}
                        />
                      ))
                    ) : (
                      <View style={styles.emptyTableState}>
                        <MaterialIcons
                          name="inbox"
                          size={48}
                          color={colors?.textSecondary}
                        />
                        <Text style={styles.emptyTableText}>
                          No orders found
                        </Text>
                        <Text style={styles.emptyTableSubtext}>
                          Order data will appear here when available
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Fixed Total Row at Bottom */}
                  {orderData.length > 0 && (
                    <View style={styles.fixedTotalRow}>
                      <TableRow
                        columns={calculateTotals()}
                        isTotal={true}
                        columnWidths={columnWidths}
                        columnAlignments={columnAlignments}
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

const createStyles = (colors: any, isTablet: boolean, isLandscape: boolean) =>
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
    summaryStrip: {
      backgroundColor: colors?.surface,
      paddingVertical: 2,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
      elevation: 1,
    },
    summaryContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    summaryItem: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    summaryIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: colors?.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    summaryContent: {
      ...(isLandscape
        ? {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }
        : {
            alignItems: "flex-start",
          }),
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors?.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors?.text,
      marginTop: 1,
    },
    summaryDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors?.border,
      marginHorizontal: 16,
    },
    content: {
      flex: 1,
      padding: isTablet ? 20 : 16,
      backgroundColor: colors?.background,
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
    tableContainer: {
      flex: 1,
    },
    tableWrapper: {
      minWidth: 1000, // Ensure table is wide enough for all columns
    },
    // tableScrollView: {
    //   maxHeight: SCREEN_HEIGHT * 0.66, // Responsive max height
    // },
    emptyTableState: {
      alignItems: "center",
      justifyContent: "center",
      padding: isTablet ? 60 : 40,
      minHeight: 120,
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
    fixedTotalRow: {
      backgroundColor: colors?.cardBackground,
      borderTopWidth: 2,
      borderTopColor: colors?.border,
      marginTop: 4,
    },
  });
