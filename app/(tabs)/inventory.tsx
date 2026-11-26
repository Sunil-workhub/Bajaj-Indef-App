// screens/InventoryAgingDateScreen.tsx - Updated with fixed table heights and restructured cards
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  calculateInventoryDateTotals,
  fetchInventoryDateData,
} from "../../api/inventoryDateApi";
import { InventoryDateItem } from "../../api/types";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";

// Main table columns
const DETAILED_TABLE_COLUMNS = [
  "Inventory Class",
  "(1-180)",
  "(181-365)",
  "(366-540)",
  "(541-730)",
  "(731-1095)",
  "(1096-1460)",
  "(1461-1825)",
  "(1826-2190)",
  "(2191-2555)",
  "(2555+)",
  "Total",
];

// Imported components columns
const IMPORTED_COLUMNS = ["Sub Class", "Total"];

const detailedColumnWidths = [13, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 8];
const importedColumnWidths = [60, 40];

const detailedAlignments: ("left" | "center" | "right")[] = [
  "left",
  "right",
  "right",
  "right",
  "right",
  "right",
  "right",
  "right",
  "right",
  "right",
  "right",
  "right",
];

const importedAlignments: ("left" | "center" | "right")[] = ["left", "right"];

export default function InventoryAgingDateScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [detailedData, setDetailedData] = useState<InventoryDateItem[]>([]);
  const [importedComponents, setImportedComponents] = useState<any[]>([]);
  const [importedTradedComponents, setImportedTradedComponents] = useState<
    any[]
  >([]);
  const [bottomTotals, setBottomTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { height, width } = useWindowDimensions(); // [web:157]
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const TABLE_MAX_HEIGHT = isLandscape ? 160 : height * 0.4;

  const { colors } = useTheme();
  const styles = createStyles(colors, isTablet);

  const convertedDetailedData = useMemo(() => {
    return detailedData.map((item) => [
      item.inventoryClass,
      item.days1To180,
      item.days181To365,
      item.days366To540,
      item.days541To730,
      item.days731To1095,
      item.days1096To1460,
      item.days1461To1825,
      item.days1826To2190,
      item.days2191To2555,
      item.days2555Plus,
      item.total,
    ]);
  }, [detailedData]);

  const convertedImportedData = useMemo(() => {
    return importedComponents.map((item) => [item.subClass, item.total]);
  }, [importedComponents]);

  const convertedTradedData = useMemo(() => {
    return importedTradedComponents.map((item) => [item.subClass, item.total]);
  }, [importedTradedComponents]);

  const totalRow = useMemo(() => {
    return calculateInventoryDateTotals(detailedData);
  }, [detailedData]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      console.log("🔄 Starting inventory data fetch...");

      const result = await fetchInventoryDateData();

      setDetailedData(result.detailedAgingData);
      setImportedComponents(result.importedComponents);
      setImportedTradedComponents(result.importedTradedComponents);
      setBottomTotals(result.bottomTotals);
    } catch (err) {
      console.error("❌ Error fetching inventory data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load inventory aging data. Please try again.",
      );
    }
  }, []);

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
    }, [fetchData]),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim]);

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/(tabs)/" as any);
    }
  }, [navigation, router]);

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading inventory aging data..." />
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <MaterialIcons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Retry</Text>
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              Inventory Aging (As on Date)
            </Text>
          </View>
          <View style={styles.logoContainer}>
            <MaterialIcons name="hourglass-empty" size={24} color="#ffffff" />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Detailed Aging Table */}
          <View style={styles.tableSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.tableWrapper}>
                <TableRow
                  columns={DETAILED_TABLE_COLUMNS}
                  isHeader
                  columnWidths={detailedColumnWidths}
                  columnAlignments={detailedAlignments}
                />
                <ScrollView
                  style={[
                    styles.tableScrollView,
                    { maxHeight: TABLE_MAX_HEIGHT },
                  ]}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {convertedDetailedData.map((row, index) => (
                    <TableRow
                      key={`detailed-${index}`}
                      columns={row}
                      columnWidths={detailedColumnWidths}
                      columnAlignments={detailedAlignments}
                    />
                  ))}
                </ScrollView>
                {totalRow && (
                  <View style={styles.totalRowContainer}>
                    <TableRow
                      columns={totalRow as any}
                      isTotal
                      columnWidths={detailedColumnWidths}
                      columnAlignments={detailedAlignments}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Imported Components and Traded Equipment - Side by Side with Fixed Height */}
          <View style={styles.twoColumnGrid}>
            {/* Imported Components */}
            <View style={styles.halfWidthTable}>
              <View style={styles.tableSectionHeader}>
                <MaterialIcons name="inbox" size={18} color={colors?.primary} />
                <Text style={styles.tableSectionTitleSmall}>
                  Imported Components
                </Text>
              </View>
              <View style={styles.compactTableContainer}>
                <TableRow
                  columns={IMPORTED_COLUMNS}
                  isHeader
                  columnWidths={importedColumnWidths}
                  columnAlignments={importedAlignments}
                />
                <ScrollView
                  style={styles.compactTableScrollView}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {convertedImportedData.map((row, index) => (
                    <TableRow
                      key={`imported-${index}`}
                      columns={row}
                      columnWidths={importedColumnWidths}
                      columnAlignments={importedAlignments}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Imported Traded Equipment */}
            <View style={styles.halfWidthTable}>
              <View style={styles.tableSectionHeader}>
                <MaterialIcons
                  name="local-shipping"
                  size={18}
                  color={colors?.primary}
                />
                <Text style={styles.tableSectionTitleSmall}>
                  Imported Traded Equipment
                </Text>
              </View>
              <View style={styles.compactTableContainer}>
                <TableRow
                  columns={IMPORTED_COLUMNS}
                  isHeader
                  columnWidths={importedColumnWidths}
                  columnAlignments={importedAlignments}
                />
                <ScrollView
                  style={styles.compactTableScrollView}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {convertedTradedData.map((row, index) => (
                    <TableRow
                      key={`traded-${index}`}
                      columns={row}
                      columnWidths={importedColumnWidths}
                      columnAlignments={importedAlignments}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Location Totals - Restructured Cards */}
          <View style={styles.locationCardsContainer}>
            {/* First Card - Khopoli and MFG */}
            <View style={styles.locationCard}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Khopoli:</Text>
                <Text style={styles.dataValue}>
                  {bottomTotals?.khopoli || "0"}
                </Text>
              </View>
              <View style={styles.dataDivider} />
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>MFG:</Text>
                <Text style={styles.dataValue}>{bottomTotals?.mfg || "0"}</Text>
              </View>
            </View>

            {/* Second Card - Pune and MFG_84 */}
            <View style={styles.locationCard}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Pune:</Text>
                <Text style={styles.dataValue}>
                  {bottomTotals?.pune || "0"}
                </Text>
              </View>
              <View style={styles.dataDivider} />
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>MFG_84:</Text>
                <Text style={styles.dataValue}>
                  {bottomTotals?.mfg_84 || "0"}
                </Text>
              </View>
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
      marginBottom: 16,
    },
    tableSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: colors?.tableHeader,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    tableSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors?.text,
      marginLeft: 8,
    },
    tableSectionTitleSmall: {
      fontSize: 14,
      fontWeight: "700",
      color: colors?.text,
      marginLeft: 8,
    },
    tableWrapper: {
      minWidth: 1200,
    },
    tableScrollView: {},
    totalRowContainer: {
      borderTopWidth: 2,
      borderTopColor: colors?.border,
      backgroundColor: colors?.cardBackground,
    },
    twoColumnGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    halfWidthTable: {
      flex: 1,
      backgroundColor: colors?.surface,
      borderRadius: 12,
      overflow: "hidden",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      height: 280, // Fixed height for table container
    },
    compactTableContainer: {
      flex: 1,
      width: "100%",
    },
    compactTableScrollView: {
      flex: 1,
      maxHeight: 220, // Fixed max height for scrollable content
    },
    locationCardsContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    locationCard: {
      flex: 1,
      backgroundColor: colors?.surface,
      borderRadius: 10,
      padding: 14,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: colors?.primary,
    },
    dataRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
    },
    dataDivider: {
      height: 1,
      backgroundColor: colors?.border,
      marginVertical: 8,
    },
    dataLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors?.textSecondary,
    },
    dataValue: {
      fontSize: 13,
      fontWeight: "700",
      color: colors?.text,
      textAlign: "right",
    },
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
  });
