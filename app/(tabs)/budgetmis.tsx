import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  buildLastNFinancialYears,
  computeStartEndYear,
  getAbpPartners,
  getBudgetMonths,
  getBudgetYears,
  getRegions,
  getSalespersons,
} from "../../api/budgetMISApi";
import type { DropdownOption } from "../../api/types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTheme } from "../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

const ALL_ID = "All";
const ALL_OPTION: DropdownOption = { id: ALL_ID, name: "All" };

type FilterState = {
  reportType: "budget_vs_sales" | "budget_vs_order_intake";
  analysisType: "abp_wise" | "product_wise";
  marketType: "domestic" | "exports" | "both";
  timeComparison: "current_vs_last" | "last_5_years";
  fromYear: string;
  budgetYearFy: string;
  mtd: string;
  regionId: string;
  salesPersonId: string;
  abpId: string;
  status: "all" | "active" | "inactive";
  achievement: "all" | "90" | "80-90" | "80";
};

export default function BudgetMisScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const [regions, setRegions] = useState<DropdownOption[]>([ALL_OPTION]);
  const [salesPersons, setSalesPersons] = useState<DropdownOption[]>([
    ALL_OPTION,
  ]);
  const [abpPartners, setAbpPartners] = useState<DropdownOption[]>([
    ALL_OPTION,
  ]);
  const [budgetYears, setBudgetYears] = useState<
    { id: number; name: string }[]
  >([]);
  const [budgetMonths, setBudgetMonths] = useState<
    { value: string; name: string }[]
  >([]);

  const last5FY = buildLastNFinancialYears(5);
  const [fromYearOptions, setFromYearOptions] = useState(last5FY);
  const [budgetYearOptions, setBudgetYearOptions] = useState(last5FY.slice(-2));

  const [filters, setFilters] = useState<FilterState>(() => {
    const { startYear, endYear, years } =
      computeStartEndYear("current_vs_last");
    return {
      reportType: "budget_vs_sales",
      analysisType: "abp_wise",
      marketType: "both",
      timeComparison: "current_vs_last",
      fromYear: years[0],
      budgetYearFy: endYear,
      mtd: "All",
      regionId: ALL_ID,
      salesPersonId: ALL_ID,
      abpId: ALL_ID,
      status: "all",
      achievement: "all",
    };
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const r = await getRegions();
        if (active) setRegions([ALL_OPTION, ...r]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await getBudgetYears();
        if (active && response.status_Code === 200) {
          setBudgetYears(response.data);
          if (response.data.length > 0)
            setFilters((p) => ({ ...p, budgetYearFy: response.data[0].name }));
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!filters.budgetYearFy || filters.budgetYearFy === "All") return;
    let active = true;
    (async () => {
      try {
        const response = await getBudgetMonths(filters.budgetYearFy);
        if (active && response.status_Code === 200)
          setBudgetMonths(response.data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      active = false;
    };
  }, [filters.budgetYearFy]);

  useEffect(() => {
    const { endYear, years } = computeStartEndYear(filters.timeComparison);
    if (filters.timeComparison === "last_5_years") {
      setFromYearOptions(buildLastNFinancialYears(5));
      setBudgetYearOptions(buildLastNFinancialYears(5));
      setFilters((p) => ({ ...p, fromYear: years[0], budgetYearFy: endYear }));
    } else {
      setBudgetYearOptions(years);
      setFilters((p) => ({ ...p, fromYear: years[0], budgetYearFy: endYear }));
    }
  }, [filters.timeComparison]);

  useEffect(() => {
    if (filters.analysisType !== "abp_wise") return;
    let active = true;
    (async () => {
      try {
        const list = await getSalespersons(
          filters.regionId === ALL_ID ? "" : filters.regionId,
        );
        if (!active) return;
        setSalesPersons([ALL_OPTION, ...list]);
        setAbpPartners([ALL_OPTION]);
        setFilters((p) => ({ ...p, salesPersonId: ALL_ID, abpId: ALL_ID }));
      } catch (e) {
        console.error(e);
        setSalesPersons([ALL_OPTION]);
      }
    })();
    return () => {
      active = false;
    };
  }, [filters.regionId, filters.analysisType]);

  useEffect(() => {
    if (filters.analysisType !== "abp_wise") return;
    let active = true;
    (async () => {
      try {
        const list = await getAbpPartners({
          region: filters.regionId === ALL_ID ? "" : filters.regionId,
          salesRep:
            filters.salesPersonId === ALL_ID ? "" : filters.salesPersonId,
        });
        if (!active) return;
        setAbpPartners([ALL_OPTION, ...list]);
        setFilters((p) => ({ ...p, abpId: ALL_ID }));
      } catch (e) {
        console.error(e);
        setAbpPartners([ALL_OPTION]);
      }
    })();
    return () => {
      active = false;
    };
  }, [filters.regionId, filters.salesPersonId, filters.analysisType]);

  const handleBackPress = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else router.push("/(tabs)/" as any);
  };

  const updateFilter = (key: keyof FilterState, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // ── Pill-style toggle radio ───────────────────────────────────────────────
  const renderPillRadio = (
    options: { key: string; label: string }[],
    selectedValue: string,
    onSelect: (value: string) => void,
  ) => (
    <View style={styles.pillGroup}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.pill,
            selectedValue === option.key && styles.pillActive,
          ]}
          onPress={() => onSelect(option.key)}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.pillText,
              selectedValue === option.key && styles.pillTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Compact dropdown ──────────────────────────────────────────────────────
  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    onSelect: (value: string) => void,
    dropdownKey: string,
    icon?: string,
  ) => (
    <View style={styles.dropdownWrap}>
      <View style={styles.dropdownLabelRow}>
        {icon && (
          <MaterialIcons name={icon as any} size={12} color={colors?.primary} />
        )}
        <Text style={styles.dropdownLabel}>{label}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.dropdownBtn,
          showDropdown === dropdownKey && styles.dropdownBtnActive,
        ]}
        onPress={() =>
          setShowDropdown(showDropdown === dropdownKey ? null : dropdownKey)
        }
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownValue} numberOfLines={1}>
          {value}
        </Text>
        <MaterialIcons
          name={
            showDropdown === dropdownKey ? "arrow-drop-up" : "arrow-drop-down"
          }
          size={20}
          color={
            showDropdown === dropdownKey
              ? colors?.primary
              : colors?.textSecondary
          }
        />
      </TouchableOpacity>
      <Modal
        visible={showDropdown === dropdownKey}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(null)}
        >
          <View style={styles.modalBox}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    value === item && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setShowDropdown(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      value === item && styles.modalItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {value === item && (
                    <MaterialIcons
                      name="check"
                      size={16}
                      color={colors?.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  // ── Compact object dropdown ───────────────────────────────────────────────
  const renderObjectDropdown = (
    label: string,
    selectedId: string,
    options: DropdownOption[],
    onSelectId: (id: string) => void,
    dropdownKey: string,
    icon?: string,
  ) => {
    const displayName =
      options.find((o) => String(o.id) === String(selectedId))?.name ??
      selectedId;
    return (
      <View style={styles.dropdownWrap}>
        <View style={styles.dropdownLabelRow}>
          {icon && (
            <MaterialIcons
              name={icon as any}
              size={12}
              color={colors?.primary}
            />
          )}
          <Text style={styles.dropdownLabel}>{label}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.dropdownBtn,
            showDropdown === dropdownKey && styles.dropdownBtnActive,
          ]}
          onPress={() =>
            setShowDropdown(showDropdown === dropdownKey ? null : dropdownKey)
          }
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValue} numberOfLines={1}>
            {displayName}
          </Text>
          <MaterialIcons
            name={
              showDropdown === dropdownKey ? "arrow-drop-up" : "arrow-drop-down"
            }
            size={20}
            color={
              showDropdown === dropdownKey
                ? colors?.primary
                : colors?.textSecondary
            }
          />
        </TouchableOpacity>
        <Modal
          visible={showDropdown === dropdownKey}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(null)}
          >
            <View style={styles.modalBox}>
              <FlatList
                data={options}
                keyExtractor={(item) => String(item.id)}
                style={styles.modalList}
                renderItem={({ item }) => {
                  const isSel = String(item.id) === String(selectedId);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        isSel && styles.modalItemActive,
                      ]}
                      onPress={() => {
                        onSelectId(String(item.id));
                        setShowDropdown(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          isSel && styles.modalItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSel && (
                        <MaterialIcons
                          name="check"
                          size={16}
                          color={colors?.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  const budgetYearOptionsDisplay = budgetYears.map((y) => y.name);
  const monthOptions = ["All", ...budgetMonths.map((m) => m.name)];

  const generateReport = () => {
    const selectedMonth = budgetMonths.find((m) => m.name === filters.mtd);
    const mtdValue = filters.mtd === "All" ? "" : selectedMonth?.value || "";
    router.push({
      pathname: "/budgetMisReport",
      params: {
        reportType: filters.reportType,
        analysisType: filters.analysisType,
        marketType: filters.marketType,
        timeComparison: filters.timeComparison,
        fromYear: filters.fromYear,
        budgetYearFy: filters.budgetYearFy,
        mtd: mtdValue,
        region: filters.regionId === ALL_ID ? "" : filters.regionId,
        salesPerson:
          filters.salesPersonId === ALL_ID ? "" : filters.salesPersonId,
        abp: filters.abpId === ALL_ID ? "" : filters.abpId,
        status: filters.status,
        achievement: filters.achievement,
      } as any,
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      edges={["top", "left", "right"]}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors?.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Budget MIS</Text>
        </View>
        <View style={styles.logoContainer}>
          <MaterialIcons name="assessment" size={18} color={colors?.primary} />
        </View>
        {/* <View style={styles.headerBtn} /> */}
      </Animated.View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowDropdown(null)}
          >
            {/* ══ SECTION 1 — Report Configuration ══════════════════════════ */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Report Configuration</Text>
              </View>

              {/* Report Type */}
              <View style={styles.fieldRow}>
                {/* <Text style={styles.fieldLabel}>Report Type</Text> */}
                {renderPillRadio(
                  [
                    { key: "budget_vs_sales", label: "Budget vs Sales" },
                    { key: "budget_vs_order_intake", label: "Order Intake" },
                  ],
                  filters.reportType,
                  (v) => updateFilter("reportType", v),
                )}
              </View>

              {/* Analysis Type */}
              <View style={styles.fieldRow}>
                {/* <Text style={styles.fieldLabel}>Analysis</Text> */}
                {renderPillRadio(
                  [
                    { key: "abp_wise", label: "ABP Wise" },
                    { key: "product_wise", label: "Product Wise" },
                  ],
                  filters.analysisType,
                  (v) => updateFilter("analysisType", v),
                )}
              </View>

              {/* Market Scope */}
              <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                {/* <Text style={styles.fieldLabel}>Market</Text> */}
                {renderPillRadio(
                  [
                    { key: "domestic", label: "Domestic" },
                    { key: "exports", label: "Exports" },
                    { key: "both", label: "Both" },
                  ],
                  filters.marketType,
                  (v) => updateFilter("marketType", v),
                )}
              </View>
            </View>

            {/* ══ SECTION 2 — Time Period ════════════════════════════════════ */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Time Period</Text>
              </View>

              {/* Time Comparison toggle */}
              <View
                style={[
                  styles.fieldRow,
                  filters.timeComparison !== "last_5_years" && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                {/* <Text style={styles.fieldLabel}>Compare</Text> */}
                {renderPillRadio(
                  [
                    { key: "current_vs_last", label: "Current vs Last" },
                    { key: "last_5_years", label: "Last 5 Years" },
                  ],
                  filters.timeComparison,
                  (v) => updateFilter("timeComparison", v),
                )}
              </View>

              {/* From Year — only for last_5_years */}
              {filters.timeComparison === "last_5_years" && (
                <View
                  style={[
                    styles.twoColGrid,
                    { borderBottomWidth: 0, paddingVertical: 0 },
                  ]}
                >
                  {renderDropdown(
                    "",
                    filters.fromYear,
                    fromYearOptions,
                    (v) => updateFilter("fromYear", v),
                    "fromYear",
                    "",
                  )}
                </View>
              )}
            </View>

            {/* ══ SECTION 3 — Basic Parameters ══════════════════════════════ */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Budget Parameters</Text>
              </View>
              <View style={styles.twoColGrid}>
                {renderDropdown(
                  "",
                  filters.budgetYearFy,
                  budgetYearOptionsDisplay.length > 0
                    ? budgetYearOptionsDisplay
                    : budgetYearOptions,
                  (v) => updateFilter("budgetYearFy", v),
                  "budgetYearFy",
                  "",
                )}
                {renderDropdown(
                  "",
                  filters.mtd,
                  monthOptions,
                  (v) => updateFilter("mtd", v),
                  "mtd",
                  "",
                )}
              </View>
            </View>

            {/* ══ SECTION 4 — ABP Filters (conditional) ═════════════════════ */}
            {filters.analysisType === "abp_wise" && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>ABP Filters</Text>
                </View>

                {/* Region / Sales Person side by side */}
                <View style={styles.twoColGrid}>
                  {renderObjectDropdown(
                    "Region",
                    filters.regionId,
                    regions,
                    (id) => updateFilter("regionId", id),
                    "region",
                    "location-on",
                  )}
                  {renderObjectDropdown(
                    "Sales Person",
                    filters.salesPersonId,
                    salesPersons.length ? salesPersons : [ALL_OPTION],
                    (id) => updateFilter("salesPersonId", id),
                    "salesPerson",
                    "person",
                  )}
                </View>

                {/* ABP Partner full width */}
                <View style={styles.fullRowGrid}>
                  {renderObjectDropdown(
                    "ABP",
                    filters.abpId,
                    abpPartners.length ? abpPartners : [ALL_OPTION],
                    (id) => updateFilter("abpId", id),
                    "abp",
                    "business",
                  )}
                </View>

                {/* Partner Status */}
                <View style={styles.fieldRow}>
                  {/* <Text style={styles.fieldLabel}>Status</Text> */}
                  {renderPillRadio(
                    [
                      { key: "all", label: "All" },
                      { key: "active", label: "Active" },
                      { key: "inactive", label: "Inactive" },
                    ],
                    filters.status,
                    (v) => updateFilter("status", v),
                  )}
                </View>

                {/* Achievement */}
                <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                  {/* <Text style={styles.fieldLabel}>Achievement</Text> */}
                  {renderPillRadio(
                    [
                      { key: "all", label: "All" },
                      { key: "90", label: "≥90%" },
                      { key: "80-90", label: "80–90%" },
                      { key: "80", label: "<80%" },
                    ],
                    filters.achievement,
                    (v) => updateFilter("achievement", v),
                  )}
                </View>
              </View>
            )}

            {/* ══ Generate Button ════════════════════════════════════════════ */}
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={generateReport}
              activeOpacity={0.85}
            >
              <MaterialIcons name="bar-chart" size={20} color="#fff" />
              <Text style={styles.generateBtnText}>Generate MIS Report</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors?.background },

    // ── Header ───────────────────────────────────────────────────────────────
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors?.surface,
      paddingHorizontal: 12,
      height: 52,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors?.cardBackground,
    },
    headerCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors?.text,
      letterSpacing: 0.3,
    },
    logoContainer: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.1)",
    },

    // ── Scroll ────────────────────────────────────────────────────────────────
    scroll: { flex: 1 },
    scrollContent: {
      padding: 12,
      gap: 10,
      paddingBottom: 24,
    },

    // ── Section Card ──────────────────────────────────────────────────────────
    section: {
      backgroundColor: colors?.surface,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors?.border,
      marginBottom: 10,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors?.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    sectionAccent: {
      width: 3,
      height: 14,
      borderRadius: 2,
      backgroundColor: colors?.primary,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors?.text,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },

    // ── Field Row (label + pills) ─────────────────────────────────────────────
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors?.textSecondary,
      width: 76,
      flexShrink: 0,
    },

    // ── Pill Toggle ───────────────────────────────────────────────────────────
    pillGroup: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    pill: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors?.border,
      backgroundColor: colors?.cardBackground,
    },
    pillActive: {
      backgroundColor: colors?.primary,
      borderColor: colors?.primary,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors?.textSecondary,
    },
    pillTextActive: {
      color: "#ffffff",
      fontWeight: "600",
    },

    // ── Two-Column Grid (for dropdowns) ───────────────────────────────────────
    twoColGrid: {
      flexDirection: "row",
      gap: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    fullRowGrid: {
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },

    // ── Dropdown ──────────────────────────────────────────────────────────────
    dropdownWrap: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRightWidth: 1,
      borderRightColor: colors?.border,
    },
    dropdownLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 4,
    },
    dropdownLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors?.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    dropdownBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors?.cardBackground,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors?.border,
      minHeight: 34,
    },
    dropdownBtnActive: {
      borderColor: colors?.primary,
      backgroundColor: colors?.primary + "15",
    },
    dropdownValue: {
      fontSize: 13,
      color: colors?.text,
      fontWeight: "500",
      flex: 1,
    },

    // ── Modal ─────────────────────────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalBox: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors?.surface,
      borderRadius: 12,
      overflow: "hidden",
      elevation: 8,
      borderWidth: 1,
      borderColor: colors?.border,
      maxHeight: SCREEN_HEIGHT * 0.4,
    },
    modalList: { maxHeight: 300 },
    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    modalItemActive: { backgroundColor: colors?.primary + "18" },
    modalItemText: { fontSize: 14, color: colors?.text, flex: 1 },
    modalItemTextActive: { color: colors?.primary, fontWeight: "600" },

    // ── Generate Button ───────────────────────────────────────────────────────
    generateBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors?.primary,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
      elevation: 3,
      shadowColor: colors?.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
    },
    generateBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#ffffff",
      letterSpacing: 0.3,
    },
  });
