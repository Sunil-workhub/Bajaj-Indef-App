// components/ReactTable.tsx
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

type Column = {
  title: string;
  key: string;
  align?: "left" | "center" | "right";
  render?: (value: any) => string;
};

type Props = {
  columns: Column[];
  data: Record<string, any>[];
  showTotalRow?: boolean;
  maxHeight?: number; // Optional max height
  containerStyle?: any; // Optional container styling
};

const ReactTable: React.FC<Props> = ({
  columns,
  data,
  showTotalRow = false,
  maxHeight,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Compute column widths based on content length
  const columnWidths = useMemo(() => {
    return columns.map((col) => {
      let maxLen = col.title.length;
      data.forEach((row) => {
        const rawValue = row[col.key];
        const cellText = col.render
          ? col.render(rawValue)
          : String(rawValue ?? "");
        if (cellText.length > maxLen) {
          maxLen = cellText.length;
        }
      });
      // Minimum width based on content, with some padding
      return Math.max(maxLen * 8 + 20, 80);
    });
  }, [columns, data]);

  // Calculate totals for numeric columns
  const totals: Record<string, number> = {};
  if (showTotalRow) {
    columns.forEach((col) => {
      const nums = data
        .map((row) => Number(row[col.key]))
        .filter((v) => !isNaN(v));
      if (nums.length > 0) {
        totals[col.key] = nums.reduce((a, b) => a + b, 0);
      }
    });
  }

  // Function to detect if a value is numeric
  const isNumericValue = (value: string): boolean => {
    if (!value || value.trim() === "") return false;
    const cleanValue = value.replace(/[$,\s%₹]/g, "");
    const parenthesesPattern = /^\([\d,.]+\)$/;
    if (parenthesesPattern.test(cleanValue)) return true;
    const numberPattern = /^-?[\d,.]+\.?\d*$/;
    return numberPattern.test(cleanValue) && !isNaN(parseFloat(cleanValue));
  };

  // Function to get text alignment from column definition
  const getTextAlignment = (column: Column) => {
    return column.align || "left";
  };

  // Function to format cell text for better display
  const formatCellText = (text: string, isFirstColumn: boolean) => {
    if (isFirstColumn) return text;
    if (text.includes(",") && text.includes(".00")) {
      return text.replace(".00", "");
    }
    return text;
  };

  const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Single ScrollView for the entire table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.tableScrollView}
      >
        <View style={[styles.table, { width: totalTableWidth }]}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {columns.map((col, i) => {
              const textAlignment = getTextAlignment(col);
              return (
                <View
                  key={col.key}
                  style={[styles.headerCell, { width: columnWidths[i] }]}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.headerText,
                      textAlignment === "left" && styles.leftAlignedText,
                      textAlignment === "center" && styles.centerAlignedText,
                      textAlignment === "right" && styles.rightAlignedText,
                    ]}
                  >
                    {col.title}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Data Rows */}
          <ScrollView
            style={[styles.dataScrollView, maxHeight && { maxHeight }]}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {data.map((row, idx) => (
              <View key={idx} style={styles.dataRow}>
                {columns.map((col, i) => {
                  const rawValue = row[col.key];
                  const cellText = col.render
                    ? col.render(rawValue)
                    : String(rawValue ?? "");
                  const isFirstColumn = i === 0;
                  const formattedText = formatCellText(cellText, isFirstColumn);
                  const textAlignment = getTextAlignment(col);
                  const isNumeric =
                    col.align === "right" && isNumericValue(cellText);

                  return (
                    <View
                      key={col.key}
                      style={[styles.dataCell, { width: columnWidths[i] }]}
                    >
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        adjustsFontSizeToFit={isNumeric}
                        minimumFontScale={0.7}
                        style={[
                          styles.cellText,
                          textAlignment === "left" && styles.leftAlignedText,
                          textAlignment === "center" &&
                            styles.centerAlignedText,
                          textAlignment === "right" && styles.rightAlignedText,
                          isNumeric && styles.numericText,
                        ]}
                      >
                        {formattedText}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Total Row - Always visible when showTotalRow is true */}
          {showTotalRow && (
            <View style={styles.totalRow}>
              {columns.map((col, i) => {
                let totalValue = "";
                if (i === 0) {
                  totalValue = "Total";
                } else if (totals[col.key] !== undefined) {
                  if (col.render) {
                    totalValue = col.render(totals[col.key]);
                  } else {
                    totalValue = String(totals[col.key]);
                  }
                }

                const textAlignment = getTextAlignment(col);
                const isNumeric =
                  col.align === "right" && isNumericValue(totalValue);

                return (
                  <View
                    key={col.key}
                    style={[styles.totalCell, { width: columnWidths[i] }]}
                  >
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit={isNumeric}
                      minimumFontScale={0.7}
                      style={[
                        styles.totalText,
                        textAlignment === "left" && styles.leftAlignedText,
                        textAlignment === "center" && styles.centerAlignedText,
                        textAlignment === "right" && styles.rightAlignedText,
                        isNumeric && styles.numericText,
                      ]}
                    >
                      {totalValue}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#ffffff",
    },
    tableScrollView: {
      flex: 1,
    },
    table: {
      flex: 1,
    },
    dataScrollView: {
      flex: 1,
      // No fixed maxHeight - let parent control it
    },
    headerRow: {
      flexDirection: "row",
      backgroundColor: "#f8fafc",
      borderBottomWidth: 2,
      borderBottomColor: "#d1d5db",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    headerCell: {
      paddingHorizontal: 8,
      paddingVertical: 12,
      justifyContent: "center",
      borderRightWidth: 0.5,
      borderRightColor: "#d1d5db",
      backgroundColor: colors?.tableHeader,
    },
    headerText: {
      fontWeight: "bold",
      fontSize: 11,
      color: colors?.text,
    },
    dataRow: {
      flexDirection: "row",
      // backgroundColor: "#ffffff",
      backgroundColor: colors?.tableHeader,
      borderBottomWidth: 0.5,
      borderBottomColor: "#f3f4f6",
      minHeight: 32,
    },
    dataCell: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      justifyContent: "center",
      borderRightWidth: 0.5,
      borderRightColor: "#e5e7eb",
    },
    cellText: {
      fontSize: 10,
      color: colors?.text,
    },
    totalRow: {
      flexDirection: "row",
      backgroundColor: "#fef3c7",
      borderTopWidth: 2,
      borderTopColor: "#f59e0b",
      minHeight: 36,
    },
    totalCell: {
      paddingHorizontal: 8,
      paddingVertical: 10,
      justifyContent: "center",
      borderRightWidth: 0.5,
      borderRightColor: "#f59e0b",
    },
    totalText: {
      color: "#92400e",
      fontWeight: "bold",
      fontSize: 11,
    },
    numericText: {
      fontFamily: "monospace",
      fontWeight: "500",
    },
    // Text alignment styles
    leftAlignedText: {
      textAlign: "left",
    },
    centerAlignedText: {
      textAlign: "center",
    },
    rightAlignedText: {
      textAlign: "right",
    },
  });

export default ReactTable;
