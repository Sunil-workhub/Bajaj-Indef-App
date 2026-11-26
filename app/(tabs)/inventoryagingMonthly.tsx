// screens/InventoryAgingMonthlyScreen.tsx - Updated with flexible header
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
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { inventoryApi } from "../../api/inventoryApi";
import { BottomTotals, ImportedComponentItem } from "../../api/types";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const isTablet = SCREEN_WIDTH >= 768;

const AGING_TABLE_HEIGHT = SCREEN_HEIGHT * 0.45;
const COMPONENTS_SECTION_HEIGHT = 280;

// Column headers for aging analysis
const agingColumns = [
  "Item Category",
  "1-180",
  "181-365",
  "366-730",
  "731-1095",
  "1096-1460",
  "1461+",
  "Total",
];

const IMPORTED_COLUMNS = ["Sub Class", "Total"];

const columnAlignments: ("left" | "center" | "right")[] = [
  "left",
  "right",
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
  "center",
];

const importedAlignments: ("left" | "center" | "right")[] = ["left", "right"];
const agingColumnWidths = [25, 11, 11, 11, 11, 11, 10, 10];
const importedColumnWidths = [60, 40];

export default function InventoryAgingMonthlyScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [agingData, setAgingData] = useState<string[][]>([]);
  const [importedComponents, setImportedComponents] = useState<
    ImportedComponentItem[]
  >([]);
  const [importedTradedComponents, setImportedTradedComponents] = useState<
    ImportedComponentItem[]
  >([]);

  console.log("importedComponents", importedComponents);
  console.log("importedTradedComponents", importedTradedComponents);
  const [bottomTotals, setBottomTotals] = useState<BottomTotals | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const monthDescription = params.monthDescription as string;

  const fetchData = async () => {
    try {
      setError(null);

      if (!monthDescription) {
        throw new Error("Month description is required");
      }

      const response =
        await inventoryApi.getInventoryAgingData(monthDescription);

      const agingTableData = inventoryApi.convertToTableFormat(response);
      setAgingData(agingTableData);

      setImportedComponents(response.importedComponents || []);
      setImportedTradedComponents(response.importedTradedComponents || []);
      setBottomTotals(response.bottomTotals);
      setSelectedMonth(response.selectedMonth);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory data");
      console.error("Error fetching inventory data:", err);
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
    }, [monthDescription]),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleBackPress = () => {
    router.replace("/(tabs)/InventoryMonthSelectionScreen" as any);
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
        <LoadingSpinner message="Loading inventory data..." />
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

  const regularAgingData = agingData.filter(
    (row) => row[0] !== "Total" && !row[0].includes("%"),
  );
  const totalRow = agingData.find((row) => row[0] === "Total");
  const percentageRow = agingData.find((row) => row[0].includes("%"));

  const convertedImportedData = importedComponents.map((item) => [
    item.subClass,
    item.total,
  ]);

  const convertedTradedData = importedTradedComponents.map((item) => [
    item.subClass,
    item.total,
  ]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Flexible Header - Auto-adjusts to content */}
        <View style={styles.blueHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              Inventory Aging ({selectedMonth || monthDescription})
            </Text>
          </View>

          <View style={styles.logoContainer}>
            <MaterialIcons name="business" size={24} color="#ffffff" />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Aging Analysis Table */}
          <View style={[styles.sectionWrap, { maxHeight: AGING_TABLE_HEIGHT }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.agingTableContainer}>
                <TableRow
                  columns={agingColumns}
                  isHeader
                  columnWidths={agingColumnWidths}
                  columnAlignments={headerColumnAlignments}
                />

                <ScrollView style={{ flexGrow: 0 }} nestedScrollEnabled={true}>
                  {regularAgingData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      columns={row}
                      isTotal={false}
                      columnWidths={agingColumnWidths}
                      columnAlignments={columnAlignments}
                    />
                  ))}
                </ScrollView>

                {totalRow && (
                  <TableRow
                    columns={totalRow}
                    isTotal
                    columnWidths={agingColumnWidths}
                    columnAlignments={columnAlignments}
                  />
                )}

                {percentageRow && (
                  <View style={styles.percentageRowContainer}>
                    <TableRow
                      columns={percentageRow}
                      isTotal={false}
                      columnWidths={agingColumnWidths}
                      columnAlignments={columnAlignments}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Imported Components and Traded Equipment */}
          <View style={styles.twoColumnGrid}>
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

          {/* Location Totals Cards */}
          {bottomTotals && (
            <View style={styles.locationCardsContainer}>
              <View style={styles.locationCard}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Khopoli:</Text>
                  <Text style={styles.dataValue}>{bottomTotals.khopoli}</Text>
                </View>
                <View style={styles.dataDivider} />
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>MFG:</Text>
                  <Text style={styles.dataValue}>{bottomTotals.mfg}</Text>
                </View>
              </View>

              <View style={styles.locationCard}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Pune:</Text>
                  <Text style={styles.dataValue}>{bottomTotals.pune}</Text>
                </View>
                <View style={styles.dataDivider} />
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>MFG_84:</Text>
                  <Text style={styles.dataValue}>{bottomTotals.mfg84}</Text>
                </View>
              </View>
            </View>
          )}
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
      minHeight: 60, // Changed from fixed height to minHeight
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      alignSelf: "flex-start", // Align to top
    },
    headerTitleContainer: {
      flex: 1,
      marginHorizontal: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: isTablet ? 18 : 16, // Slightly smaller for better fit
      fontWeight: "bold",
      color: colors?.text,
      textAlign: "center",
      lineHeight: isTablet ? 24 : 20, // Better line spacing
    },
    logoContainer: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      alignSelf: "flex-start", // Align to top
    },
    content: {
      flex: 1,
      padding: isTablet ? 20 : 16,
    },
    section: {
      marginTop: 6,
      fontSize: isTablet ? 18 : 16,
      fontWeight: "600",
      color: colors?.textSecondary,
      marginBottom: 6,
    },
    sectionWrap: {
      marginBottom: 16,
      overflow: "hidden",
      backgroundColor: colors?.surface,
      borderRadius: 12,
      paddingBottom: 4,
      elevation: 2,
    },
    agingTableContainer: {
      minWidth: isTablet ? 1200 : 1000,
    },
    percentageRowContainer: {
      backgroundColor: colors?.accent + "30",
      borderRadius: 8,
      marginTop: 0,
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
      height: 280,
    },
    tableSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: colors?.tableHeader,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    tableSectionTitleSmall: {
      fontSize: 14,
      fontWeight: "700",
      color: colors?.text,
      marginLeft: 8,
    },
    compactTableContainer: {
      flex: 1,
      width: "100%",
    },
    compactTableScrollView: {
      flex: 1,
      maxHeight: 220,
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
  });
