import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
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
  addFYYears,
  buildBudgetMISPayload,
  buildLastNFinancialYears,
  getBudgetMISABP,
  getBudgetMISProduct,
} from "../../api/budgetMISApi";
import type {
  ABPDetailRow,
  ModelDetailRow,
  ProductSummaryRow,
  ProductTotalRow,
} from "../../api/types";
import CollapsibleProductTable from "../../components/CollapsibleProductTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import TableRow from "../../components/TableRow";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Params ────────────────────────────────────────────────────────────────────
type Params = {
  reportType: "budget_vs_sales" | "budget_vs_order_intake";
  analysisType: "abp_wise" | "product_wise";
  marketType: "domestic" | "exports" | "both";
  timeComparison: "current_vs_last" | "last_5_years";
  fromYear?: string;
  budgetYearFy?: string;
  mtd?: string;
  region?: string;
  salesPerson?: string;
  abp?: string;
  status?: "all" | "active" | "inactive";
  achievement?: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fv = (v: any, d = 2) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return v?.toString?.() ?? "-";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
};
const isTabletW = (w: number) => w >= 768;

export default function BudgetMisReportScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { height, width } = useWindowDimensions();
  const tablet = isTabletW(width);
  const isLandscape = width > height;
  const TABLE_MAX_H = isLandscape ? 120 : height * 0.62;
  const TABLE_MAX_HProd = isLandscape ? 95 : height * 0.62;

  const { colors } = useTheme();
  const styles = createStyles(colors, tablet);
  const params = useLocalSearchParams() as unknown as Params;

  // ── Extract primitives ONCE — this is the key fix ─────────────────────────
  // useLocalSearchParams() returns a NEW object reference on every render.
  // Passing `params` (or a whole object) to useCallback/useEffect deps means
  // React sees a new reference each time → load() is recreated → useEffect
  // fires again → infinite API loop.
  //
  // Extracting to plain strings lets React do value-based comparison (===),
  // so useCallback only rebuilds `load` when an actual param VALUE changes.
  const p_reportType = params.reportType ?? "budget_vs_sales";
  const p_analysisType = params.analysisType ?? "abp_wise";
  const p_marketType = params.marketType ?? "both";
  const p_timeComparison = params.timeComparison ?? "current_vs_last";
  const p_mtd = params.mtd ?? "";
  const p_region = params.region ?? "";
  const p_salesPerson = params.salesPerson ?? "";
  const p_abp = params.abp ?? "";
  const p_status = params.status ?? "all";
  const p_achievement = params.achievement ?? "all";
  const p_budgetYearFy = params.budgetYearFy ?? buildLastNFinancialYears(1)[0];

  // ── ABP state ─────────────────────────────────────────────────────────────
  const [abpRows, setAbpRows] = useState<ABPDetailRow[]>([]);
  const [abpTotal, setAbpTotal] = useState<ABPDetailRow | null>(null);
  const [abpDcTotal, setAbpDcTotal] = useState<ABPDetailRow | null>(null);
  const [abpCombined, setAbpCombined] = useState<ABPDetailRow | null>(null);

  // ── Product state ─────────────────────────────────────────────────────────
  const [productRows, setProductRows] = useState<ProductSummaryRow[]>([]);
  const [modelRows, setModelRows] = useState<ModelDetailRow[]>([]);
  const [prodAbpTotal, setProdAbpTotal] = useState<ProductTotalRow | null>(
    null,
  );
  const [prodDcTotal, setProdDcTotal] = useState<ProductTotalRow | null>(null);
  const [prodCombined, setProdCombined] = useState<ProductTotalRow | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLast5 = p_timeComparison === "last_5_years";
  const isAbpWise = p_analysisType === "abp_wise";
  const budgetFy = p_budgetYearFy;

  // ── Year labels ───────────────────────────────────────────────────────────
  const yearLabels = useMemo(
    () => ({
      cy: budgetFy,
      ly: addFYYears(budgetFy, -1),
      ly2: addFYYears(budgetFy, -2),
      ly3: addFYYears(budgetFy, -3),
      ly4: addFYYears(budgetFy, -4),
      ly5: addFYYears(budgetFy, -5),
    }),
    [budgetFy],
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  // ── Load ──────────────────────────────────────────────────────────────────
  // All deps are primitive strings — React compares by value, not reference.
  // This callback is only recreated when an actual param value changes,
  // which in turn triggers the useEffect below exactly once per real change.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Clear stale data from the previous analysis type immediately so the UI
    // does not flash old rows while the new request is in-flight.
    setAbpRows([]);
    setAbpTotal(null);
    setAbpDcTotal(null);
    setAbpCombined(null);
    setProductRows([]);
    setModelRows([]);
    setProdAbpTotal(null);
    setProdDcTotal(null);
    setProdCombined(null);

    try {
      const payload = buildBudgetMISPayload({
        budgetYear: budgetFy,
        mtd: p_mtd,
        timeComparison: p_timeComparison,
        reportType: p_reportType,
        marketType: p_marketType,
        analysisType: p_analysisType,
        status: p_status,
        achievement: p_achievement,
        region: p_region,
        salesPerson: p_salesPerson,
        abp: p_abp,
        budgetYearIndex: 0,
      });

      if (isAbpWise) {
        const res = await getBudgetMISABP(payload);
        if (res.status_Code === 200) {
          setAbpRows(res.data.abpDetails ?? []);
          setAbpTotal(res.data.abpTotal ?? null);
          setAbpDcTotal(res.data.dcTotal ?? null);
          setAbpCombined(res.data.combinedTotal ?? null);
        } else {
          setError(res.message ?? "Failed to load ABP data.");
        }
      } else {
        const res = await getBudgetMISProduct(payload);
        if (res.status_Code === 200) {
          setProductRows(res.data.productSummary ?? []);
          setModelRows(res.data.modelDetails ?? []);
          setProdAbpTotal(res.data.abpTotal ?? null);
          setProdDcTotal(res.data.dcTotal ?? null);
          setProdCombined(res.data.combinedTotal ?? null);
        } else {
          setError(res.message ?? "Failed to load product data.");
        }
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load Budget MIS report.");
    } finally {
      setLoading(false);
    }
  }, [
    // All primitives — stable value comparisons, no infinite loop
    budgetFy,
    p_mtd,
    p_timeComparison,
    p_reportType,
    p_marketType,
    p_analysisType,
    p_status,
    p_achievement,
    p_region,
    p_salesPerson,
    p_abp,
    isAbpWise,
  ]);

  // Fires only when `load` actually changes (i.e. a param value truly changed).
  useEffect(() => {
    load();
  }, [load]);

  // ── ABP table config ──────────────────────────────────────────────────────
  const abpColumns = useMemo(() => {
    if (isLast5)
      return [
        "ABP Name",
        yearLabels.ly5,
        yearLabels.ly4,
        yearLabels.ly3,
        yearLabels.ly2,
        yearLabels.ly,
        yearLabels.cy,
        "Growth %",
        "Budget",
        "Variance",
        "Ach %",
      ];
    return [
      "ABP Name",
      yearLabels.ly,
      yearLabels.cy,
      "Growth %",
      "Budget",
      "Variance",
      "Ach %",
    ];
  }, [isLast5, yearLabels]);

  const abpWidths = useMemo(
    () =>
      isLast5
        ? [20, 9, 9, 9, 9, 9, 9, 7, 9, 9, 10]
        : [26, 14, 14, 10, 12, 12, 12],
    [isLast5],
  );
  const abpAlign = useMemo<("left" | "center" | "right")[]>(
    () => abpWidths.map((_, i) => (i === 0 ? "left" : "right")),
    [abpWidths],
  );

  const toAbpRow = (r: ABPDetailRow): string[] =>
    isLast5
      ? [
          r.amaName ?? "",
          fv(r.lastYear5 ?? 0),
          fv(r.lastYear4 ?? 0),
          fv(r.lastYear3 ?? 0),
          fv(r.lastYear2 ?? 0),
          fv(r.lastYear ?? 0),
          fv(r.current ?? 0),
          String(r.growth ?? 0),
          fv(r.budget ?? 0),
          fv(r.variance ?? 0),
          String(r.achievement ?? 0),
        ]
      : [
          r.amaName ?? "",
          fv(r.lastYear ?? 0),
          fv(r.current ?? 0),
          String(r.growth ?? 0),
          fv(r.budget ?? 0),
          fv(r.variance ?? 0),
          String(r.achievement ?? 0),
        ];

  // ── Error / Loading ───────────────────────────────────────────────────────
  const handleBackPress = () => {
    router.push("/(tabs)/budgetmis" as any);
  };

  if (loading)
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading Budget MIS report..." />
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={{ padding: 16 }}>
          <Text style={{ color: colors?.accent, fontWeight: "600" }}>
            {error}
          </Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 12 }}>
            <Text style={{ color: colors?.primary, fontWeight: "600" }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Animated.View style={[styles.blueHeader, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget MIS — Report</Text>
        <View style={styles.logoContainer}>
          <MaterialIcons name="table-chart" size={24} color="#fff" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.tableSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableWrapper}>
              {/* ── ABP view ───────────────────────────────────────────── */}
              {isAbpWise && (
                <>
                  <TableRow
                    columns={abpColumns}
                    isHeader
                    columnWidths={abpWidths}
                    columnAlignments={abpAlign}
                  />

                  <ScrollView
                    style={{ maxHeight: TABLE_MAX_H }}
                    showsVerticalScrollIndicator
                    nestedScrollEnabled
                  >
                    {abpRows.length === 0 ? (
                      <View style={styles.emptyState}>
                        <MaterialIcons
                          name="info-outline"
                          size={42}
                          color={colors?.textSecondary}
                        />
                        <Text style={styles.emptyStateText}>No data found</Text>
                      </View>
                    ) : (
                      abpRows.map((r, idx) => (
                        <TableRow
                          key={`${r.partyNo}-${idx}`}
                          columns={toAbpRow(r)}
                          isTotal={false}
                          columnWidths={abpWidths}
                          columnAlignments={abpAlign}
                        />
                      ))
                    )}
                  </ScrollView>

                  {/* ABP Total — API-provided */}
                  {abpTotal && (
                    <View style={styles.fixedTotalRow}>
                      <TableRow
                        columns={toAbpRow(abpTotal)}
                        isTotal
                        columnWidths={abpWidths}
                        columnAlignments={abpAlign}
                      />
                    </View>
                  )}

                  {/* DC Total — API-provided */}
                  {abpDcTotal && (
                    <View style={styles.fixedTotalRow}>
                      <TableRow
                        columns={toAbpRow(abpDcTotal)}
                        isTotal
                        columnWidths={abpWidths}
                        columnAlignments={abpAlign}
                      />
                    </View>
                  )}

                  {/* Combined Total (ABP + DC) — API-provided */}
                  {abpCombined && (
                    <View style={styles.fixedGrandTotalRow}>
                      <TableRow
                        columns={toAbpRow(abpCombined)}
                        isTotal
                        columnWidths={abpWidths}
                        columnAlignments={abpAlign}
                      />
                    </View>
                  )}
                </>
              )}

              {/* ── Product view ────────────────────────────────────────── */}
              {!isAbpWise && (
                <CollapsibleProductTable
                  productRows={productRows}
                  modelRows={modelRows}
                  abpTotal={prodAbpTotal}
                  dcTotal={prodDcTotal}
                  combinedTotal={prodCombined}
                  isLast5={isLast5}
                  yearLabels={yearLabels}
                  maxHeight={TABLE_MAX_HProd}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (colors: any, isTablet: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors?.background },
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
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: "bold",
      color: colors?.text,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    logoContainer: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    content: { flex: 1, padding: isTablet ? 16 : 12 },
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
    tableWrapper: { minWidth: isTablet ? 1200 : 1100 },
    fixedTotalRow: { borderTopWidth: 2, borderTopColor: colors?.border },
    fixedGrandTotalRow: {
      backgroundColor: (colors?.primary ?? "#000") + "20",
      borderTopWidth: 2,
      borderTopColor: colors?.primary,
    },
    emptyState: { alignItems: "center", justifyContent: "center", padding: 28 },
    emptyStateText: {
      marginTop: 8,
      color: colors?.textSecondary,
      fontWeight: "600",
    },
  });
