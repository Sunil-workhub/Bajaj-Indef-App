import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type {
  ModelDetailRow,
  ProductSummaryRow,
  ProductTotalRow,
} from "../api/types";
import { useTheme } from "../contexts/ThemeContext";
import TableRow from "./TableRow";

// ─── Column definitions ───────────────────────────────────────────────────────
const CY_WIDTHS: number[] = [18, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6];
const CY_ALIGN: ("left" | "center" | "right")[] = [
  "left",
  ...Array(12).fill("right"),
];

const L5_WIDTHS: number[] = [22, 9, 9, 9, 9, 9, 9, 10, 7, 7];
const L5_ALIGN: ("left" | "center" | "right")[] = [
  "left",
  ...Array(9).fill("right"),
];

const CY_GROUPS = [
  { label: "Product", pct: 18 },
  { label: "Last Year", pct: 14 },
  { label: "Current Year", pct: 14 },
  { label: "Growth(%)", pct: 14 },
  { label: "Budget", pct: 14 },
  { label: "Variance", pct: 14 },
  { label: "Achievement(%)", pct: 12 },
];
const CY_SUB_COLS = [
  "",
  "Qty",
  "Value",
  "Qty",
  "Value",
  "Qty",
  "Value",
  "Qty",
  "Value",
  "Qty",
  "Value",
  "Qty",
  "Value",
];

// ─── Formatters ────────────────────────────────────────────────────────────────
const fv = (v: any, d = 2): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
};
const fq = (v: any): string => {
  const n = Number(v);
  return Number.isFinite(n) ? new Intl.NumberFormat("en-IN").format(n) : "-";
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type YearLabels = {
  cy: string;
  ly: string;
  ly2: string;
  ly3: string;
  ly4: string;
  ly5: string;
};

interface Props {
  productRows: ProductSummaryRow[];
  modelRows: ModelDetailRow[];
  abpTotal: ProductTotalRow | null;
  dcTotal: ProductTotalRow | null;
  combinedTotal: ProductTotalRow | null;
  isLast5: boolean;
  yearLabels: YearLabels;
  maxHeight: number;
}

// ─── Row converters ────────────────────────────────────────────────────────────
const toProductCells = (
  r: ProductSummaryRow | ModelDetailRow,
  displayName: string,
  isProduct: boolean,
  isExpanded: boolean,
  isLast5: boolean,
): string[] => {
  // Product: toggle icon | Model: no icon (label carries the name only)
  const label = isProduct
    ? `${isExpanded ? "▾ " : "▸ "}${displayName}`
    : displayName;

  if (isLast5)
    return [
      label,
      fv(r.l5_Value ?? 0),
      fv(r.l4_Value ?? 0),
      fv(r.l3_Value ?? 0),
      fv(r.l2_Value ?? 0),
      fv(r.lY_Value),
      fv(r.cY_Value),
      fv(r.budget_Value),
      String(r.growth_Value ?? 0),
      String(r.achievement_Value ?? 0),
    ];

  return [
    label,
    fq(r.lY_Qty),
    fv(r.lY_Value),
    fq(r.cY_Qty),
    fv(r.cY_Value),
    String(r.growth_Qty ?? 0),
    String(r.growth_Value ?? 0),
    fq(r.budget_Qty),
    fv(r.budget_Value),
    String(r.variance_Qty ?? 0),
    fv(r.variance_Value),
    String(r.achievement_Qty ?? 0),
    String(r.achievement_Value ?? 0),
  ];
};

const toApiTotalCells = (r: ProductTotalRow, isLast5: boolean): string[] => {
  if (isLast5)
    return [
      r.rowType,
      fv(r.l5_Value ?? 0),
      fv(r.l4_Value ?? 0),
      fv(r.l3_Value ?? 0),
      fv(r.l2_Value ?? 0),
      fv(r.lY_Value),
      fv(r.cY_Value),
      fv(r.budget_Value),
      String(r.growth_Value ?? 0),
      String(r.achievement_Value ?? 0),
    ];

  return [
    r.rowType,
    fq(r.lY_Qty),
    fv(r.lY_Value),
    fq(r.cY_Qty),
    fv(r.cY_Value),
    String(r.growth_Qty ?? 0),
    String(r.growth_Value ?? 0),
    fq(r.budget_Qty),
    fv(r.budget_Value),
    String(r.variance_Qty ?? 0),
    fv(r.variance_Value ?? "0.00"),
    String(r.achievement_Qty ?? 0),
    String(r.achievement_Value ?? 0),
  ];
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CollapsibleProductTable({
  productRows,
  modelRows,
  abpTotal,
  dcTotal,
  combinedTotal,
  isLast5,
  yearLabels,
  maxHeight,
}: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const colWidths = isLast5 ? L5_WIDTHS : CY_WIDTHS;
  const alignments = isLast5 ? L5_ALIGN : CY_ALIGN;

  const toggle = (product: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(product) ? next.delete(product) : next.add(product);
      return next;
    });

  // ── Header ─────────────────────────────────────────────────────────────────
  const renderHeader = () => {
    if (isLast5) {
      return (
        <TableRow
          columns={[
            "Product / Model",
            yearLabels.ly5,
            yearLabels.ly4,
            yearLabels.ly3,
            yearLabels.ly2,
            yearLabels.ly,
            yearLabels.cy,
            "Budget Val",
            "Growth %",
            "Ach %",
          ]}
          isHeader
          columnWidths={L5_WIDTHS}
          columnAlignments={L5_ALIGN}
        />
      );
    }

    return (
      <>
        <View
          style={[styles.groupRow, { backgroundColor: colors?.tableHeader }]}
        >
          {CY_GROUPS.map((g, i) => (
            <View
              key={i}
              style={[
                styles.groupCell,
                { width: `${g.pct}%` },
                i < CY_GROUPS.length - 1 && styles.groupCellBorder,
              ]}
            >
              <Text style={[styles.groupText, { color: colors?.text }]}>
                {g.label}
              </Text>
            </View>
          ))}
        </View>
        <TableRow
          columns={CY_SUB_COLS}
          isHeader
          columnWidths={CY_WIDTHS}
          columnAlignments={CY_ALIGN}
        />
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View>
      {renderHeader()}

      {/* Total (ABP) — pinned, from API */}
      {abpTotal && (
        <TableRow
          columns={toApiTotalCells(abpTotal, isLast5)}
          isTotal
          columnWidths={colWidths}
          columnAlignments={alignments}
        />
      )}

      {/* Scrollable body */}
      <ScrollView
        style={{ maxHeight }}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        {productRows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors?.textSecondary }]}>
              No product data found
            </Text>
          </View>
        ) : (
          productRows.map((p) => {
            const isExp = expanded.has(p.product);
            const models = modelRows.filter((m) => m.product === p.product);
            const hasModels = models.length > 0;

            return (
              <View key={p.product}>
                {/* ── Product row ─────────────────────────────────────── */}
                <View
                  style={
                    isExp && hasModels
                      ? styles.expandedProductWrapper
                      : undefined
                  }
                >
                  <TableRow
                    columns={toProductCells(p, p.product, true, isExp, isLast5)}
                    isTotal={false}
                    columnWidths={colWidths}
                    columnAlignments={alignments}
                    onPress={hasModels ? () => toggle(p.product) : undefined}
                  />
                </View>

                {/* ── Model group container ────────────────────────────── */}
                {isExp && hasModels && (
                  <View style={styles.modelGroupContainer}>
                    {/* Pill header: "X models" */}
                    <View style={styles.modelGroupHeader}>
                      <View style={styles.modelCountPill}>
                        <Text style={styles.modelCountText}>
                          {models.length}{" "}
                          {models.length === 1 ? "model" : "models"}
                        </Text>
                      </View>
                    </View>

                    {/* Model rows */}
                    {models.map((m, idx) => (
                      <View
                        key={m.models}
                        style={[
                          styles.modelRowWrapper,
                          idx < models.length - 1 && styles.modelRowDivider,
                        ]}
                      >
                        <TableRow
                          columns={toProductCells(
                            m,
                            m.models,
                            false,
                            false,
                            isLast5,
                          )}
                          isTotal={false}
                          columnWidths={colWidths}
                          columnAlignments={alignments}
                        />
                      </View>
                    ))}

                    {/* Bottom accent bar */}
                    <View style={styles.modelGroupFooter} />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Total (DC) — pinned, from API */}
      {dcTotal && (
        <View style={styles.totalBorder}>
          <TableRow
            columns={toApiTotalCells(dcTotal, isLast5)}
            isTotal
            columnWidths={colWidths}
            columnAlignments={alignments}
          />
        </View>
      )}

      {/* Total (ABP + DC) — pinned grand total, from API */}
      {combinedTotal && (
        <View style={styles.grandBorder}>
          <TableRow
            columns={toApiTotalCells(combinedTotal, isLast5)}
            isTotal
            columnWidths={colWidths}
            columnAlignments={alignments}
          />
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (colors: any) => {
  // Accent colour — use primary or a teal fallback
  const accent = colors?.primary ?? "#0d9488";
  const accentBg = accent + "14"; // ~8 % opacity fill inside model container
  const divider = accent + "35"; // ~21 % opacity for row separators

  return StyleSheet.create({
    // ── Grouped header ──────────────────────────────────────────────────────
    groupRow: {
      flexDirection: "row",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border ?? "#d1d5db",
    },
    groupCell: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 2,
    },
    groupCellBorder: {
      borderRightWidth: 0.5,
      borderRightColor: colors?.border ?? "#e5e7eb",
    },
    groupText: {
      fontSize: 10,
      fontWeight: "bold",
      textAlign: "center",
    },

    // ── Expanded product row ─────────────────────────────────────────────────
    // Left border + subtle tint signal "this row has an open panel below it"
    expandedProductWrapper: {
      borderLeftWidth: 3,
      borderLeftColor: accent,
      backgroundColor: accentBg,
    },

    // ── Model group container ────────────────────────────────────────────────
    modelGroupContainer: {
      marginLeft: 0, // flush with left edge (border provides the inset)
      marginBottom: 4,
      borderLeftWidth: 3,
      borderLeftColor: accent,
      backgroundColor: accentBg,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      overflow: "hidden",
    },

    // Tiny pill header inside the model container
    modelGroupHeader: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      flexDirection: "row",
      alignItems: "center",
    },
    modelCountPill: {
      backgroundColor: accent + "30", // ~19 % opacity
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    modelCountText: {
      fontSize: 9,
      fontWeight: "700",
      color: accent,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },

    // Individual model row wrappers
    modelRowWrapper: {
      backgroundColor: "transparent",
    },
    modelRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: divider,
    },

    // Bottom accent line — closes the container visually
    modelGroupFooter: {
      height: 3,
      backgroundColor: accent + "40", // ~25 % opacity
    },

    // ── Pinned total rows ────────────────────────────────────────────────────
    totalBorder: {
      borderTopWidth: 2,
      borderTopColor: colors?.border ?? "#d1d5db",
    },
    grandBorder: {
      backgroundColor: accent + "20",
      borderTopWidth: 2,
      borderTopColor: accent,
    },

    // ── Empty state ──────────────────────────────────────────────────────────
    empty: {
      alignItems: "center",
      paddingVertical: 28,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: "600",
    },
  });
};
