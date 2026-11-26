// screens/salesOverviewProduct.tsx
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
import { fetchProductSalesData } from "../../api/productSalesApi";
import { ProductSalesData } from "../../api/types";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// // Responsive breakpoints
// const isTablet = SCREEN_WIDTH >= 768;
// const isLargeScreen = SCREEN_WIDTH >= 1024;

// const TABLE_MAX_HEIGHT = SCREEN_HEIGHT * 0.72;

export default function SalesOverviewProductScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [salesData, setSalesData] = useState<ProductSalesData[]>([]);
  console.log(salesData);
  const [totalData, setTotalData] = useState<ProductSalesData | null>(null);
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
      const { data, total } = await fetchProductSalesData();
      setSalesData(data);
      setTotalData(total);
    } catch (err) {
      setError("Failed to load product sales data");
      console.error("Error fetching product sales data:", err);
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

  // Table columns with shorter headers to save space
  const tableColumns = [
    "Product",
    "Sold Qty",
    "Sold Value",
    "Pending Qty",
    "Pending Value",
  ];

  const columnAlignments: ("left" | "center" | "right")[] = [
    "left", // product
    "center", // soldQty
    "right", // soldValue
    "center", // pendingQty
    "right", // pendingValue
  ];
  const headerColumnAlignments: ("left" | "center" | "right")[] = [
    "left", // product
    "center", // soldQty
    "center", // soldValue
    "center", // pendingQty
    "center", // pendingValue
  ];

  // Optimized column widths based on your data
  const columnWidths = [25, 16, 22, 15, 22];

  // Convert data to table format
  const convertToTableRow = (data: ProductSalesData): string[] => [
    data.product,
    formatNumber(data.soldQty),
    formatNumber(data.soldValue),
    formatNumber(data.pendingQty),
    formatNumber(data.pendingValue),
  ];

  // Handle row press
  const handleRowPress = (productData: ProductSalesData) => {
    console.log("Product row pressed:", productData.product);
    // Add your navigation or detail view logic here
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading product sales data..." />
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
              Sales Overview (Product wise)
            </Text>
          </View>
          <View style={styles.logoContainer}>
            <MaterialIcons name="inventory" size={24} color="#ffffff" />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.reportContainer}>
            {/* Sales Overview Table */}
            <View style={styles.tableSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View
                  style={[
                    styles.tableWrapper,
                    {
                      minWidth: width,
                      maxWidth: width * 1.4,
                      padding: isTablet ? 12 : 8,
                    },
                  ]}
                >
                  {/* Table Header */}
                  <TableRow
                    columns={tableColumns}
                    isHeader
                    columnWidths={columnWidths}
                    columnAlignments={headerColumnAlignments}
                  />

                  <ScrollView
                    style={[
                      styles.tableContent,
                      { maxHeight: TABLE_MAX_HEIGHT },
                    ]}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {/* Sales Data Rows */}
                    {salesData.map((productData, idx) => (
                      <TableRow
                        key={`${productData.product}-${idx}`}
                        columns={convertToTableRow(productData)}
                        columnWidths={columnWidths}
                        onPress={() => handleRowPress(productData)}
                        columnAlignments={columnAlignments}
                      />
                    ))}
                  </ScrollView>

                  {/* Total Row */}
                  {totalData && (
                    <View style={styles.totalRowContainer}>
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

              {/* Empty State */}
              {salesData.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="inventory"
                    size={64}
                    color={colors?.textSecondary}
                  />
                  <Text style={styles.emptyStateText}>
                    No product sales data found
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Product sales information will appear here when available.
                  </Text>
                </View>
              )}
            </View>
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
    },
    reportContainer: {
      padding: isTablet ? 20 : 16,
    },
    tableContent: {
      flex: 1,
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
      marginBottom: 0,
    },
    tableSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: isTablet ? 12 : 8,
      paddingVertical: isTablet ? 12 : 8,
      backgroundColor: colors?.tableHeader,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    tableSectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: "700",
      color: colors?.primary,
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
      // minWidth: SCREEN_WIDTH,
      // maxWidth: SCREEN_WIDTH * 1.4,
      // padding: isTablet ? 12 : 8,
      minWidth: isTablet ? 1200 : 1000,
    },
    totalRowContainer: {
      backgroundColor: colors?.cardBackground,
      borderRadius: 8,
      marginTop: 8,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: isTablet ? 60 : 40,
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
      lineHeight: 20,
    },
    summarySection: {
      backgroundColor: colors?.surface,
      borderRadius: 12,
      padding: isTablet ? 24 : 20,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    summarySectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors?.text,
      marginBottom: 16,
    },

    summaryCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 6,
    },
    summaryCardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors?.textSecondary,
    },
    summaryCardValue: {
      fontSize: 18,
      fontWeight: "800",
      color: colors?.text,
      marginBottom: 4,
    },
    summaryCardSubtext: {
      fontSize: 12,
      color: colors?.textSecondary,
    },
  });
