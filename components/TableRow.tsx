import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

type Props = {
  columns: string[];
  isHeader?: boolean;
  isTotal?: boolean;
  columnWidths?: number[];
  columnAlignments?: ("left" | "center" | "right")[]; // Custom alignment for each column
  onPress?: () => void; // Optional callback for row press
  disabled?: boolean; // To disable clicking on header/total rows
};

// Global state to track which row is currently highlighted
let currentHighlightedRow: string | null = null;
const highlightedRowCallbacks = new Set<(rowId: string | null) => void>();

export default function TableRow({
  columns,
  isHeader = false,
  isTotal = false,
  columnWidths,
  columnAlignments,
  onPress,
  disabled = false,
}: Props) {
  const rowId = useRef(
    `row-${Math.random().toString(36).substr(2, 9)}`,
  ).current;
  const [isHighlighted, setIsHighlighted] = useState(false);

  const { colors } = useTheme();

  // Register this row's highlight callback
  useEffect(() => {
    const callback = (highlightedId: string | null) => {
      setIsHighlighted(highlightedId === rowId);
    };

    highlightedRowCallbacks.add(callback);

    return () => {
      highlightedRowCallbacks.delete(callback);
      // Clear global state if this was the highlighted row
      if (currentHighlightedRow === rowId) {
        currentHighlightedRow = null;
      }
    };
  }, [rowId]);

  // Function to detect if a value is numeric
  const isNumericValue = (value: string): boolean => {
    if (!value || value.trim() === "") return false;

    // Remove common formatting characters and check if it's a number
    const cleanValue = value.replace(/[$,\s%₹]/g, "");

    // Check for negative numbers in parentheses: (123.45)
    const parenthesesPattern = /^\([\d,.]+\)$/;
    if (parenthesesPattern.test(cleanValue)) {
      return true;
    }

    // Check for regular numbers (including decimals and negative)
    const numberPattern = /^-?[\d,.]+\.?\d*$/;
    return numberPattern.test(cleanValue) && !isNaN(parseFloat(cleanValue));
  };

  // Get column width - ALWAYS use passed columnWidths if available
  const getColumnWidth = (index: number, totalColumns: number) => {
    // PRIORITY: Use passed columnWidths if available
    if (columnWidths && columnWidths[index] !== undefined) {
      return columnWidths[index];
    }

    // Fallback: Equal distribution
    return 100 / totalColumns;
  };

  // Function to format large numbers for better display
  const formatCellText = (text: string, isFirstColumn: boolean) => {
    // Don't format header text or first column (category names)
    if (isHeader || isFirstColumn) {
      return text;
    }

    // If it's a number with commas, try to make it more compact
    if (text.includes(",") && text.includes(".00")) {
      // Remove .00 from whole numbers for space saving
      return text.replace(".00", "");
    }

    return text;
  };

  // Function to get text alignment based on content type or custom alignment
  const getTextAlignment = (text: string, index: number) => {
    // If custom alignments are provided, use them for both headers and data
    if (columnAlignments && columnAlignments[index]) {
      return columnAlignments[index];
    }

    // Default alignment logic when no custom alignments are provided
    // First column is always left aligned (usually contains labels/categories)
    if (index === 0) {
      return "left";
    }

    // Second column (Account) should be left aligned
    if (index === 1) {
      return "left";
    }

    // Third column (Customer) should be left aligned
    if (index === 2) {
      return "left";
    }

    // Fourth column (Type) should be center aligned
    if (index === 3) {
      return "center";
    }

    // For headers without custom alignment, center align
    if (isHeader) {
      return "center";
    }

    // For data rows, check if the content is numeric
    if (isNumericValue(text)) {
      return "right";
    }

    // Default to left alignment for text
    return "left";
  };

  const handlePress = () => {
    if (disabled || isHeader) return;

    // If this row is already highlighted, remove highlight
    if (currentHighlightedRow === rowId) {
      currentHighlightedRow = null;
    } else {
      // Set this row as the highlighted one
      currentHighlightedRow = rowId;
    }

    // Notify all rows about the highlight change
    highlightedRowCallbacks.forEach((callback) =>
      callback(currentHighlightedRow),
    );

    // Call onPress if provided
    if (onPress) {
      onPress();
    }
  };

  const rowContent = (
    <>
      {columns.map((text, index) => {
        const isFirstColumn = index === 0;
        const widthPercentage = getColumnWidth(index, columns.length);
        const formattedText = formatCellText(text, isFirstColumn);
        const textAlignment = getTextAlignment(text, index);
        const isNumeric = !isHeader && index > 3 && isNumericValue(text); // Only columns after Type are considered numeric

        return (
          <View
            key={index}
            style={[
              styles.cellContainer,
              { width: `${widthPercentage}%` },
              // Add minimum width for numeric columns to prevent wrapping
              isNumeric && styles.numericCellContainer,
            ]}
          >
            <Text
              numberOfLines={1} // Force single line
              ellipsizeMode="tail"
              adjustsFontSizeToFit={false} // Auto-adjust font size for numeric columns
              // minimumFontScale={0.7} // Don't go below 70% of original size
              allowFontScaling={false}
              style={[
                styles.cell,
                isHeader ? styles.headerText : styles.bodyText,
                { color: colors?.text || "#000000" },
                isTotal && styles.totalText,
                // Dynamic alignment based on content type
                textAlignment === "left" && styles.leftAlignedText,
                textAlignment === "center" && styles.centerAlignedText,
                textAlignment === "right" && styles.rightAlignedText,
                // Apply padding based on alignment
                textAlignment === "left" && styles.leftPadding,
                textAlignment === "right" && styles.rightPadding,
                // Special styling for numeric columns
                isNumeric && styles.numericText,
                // Highlighted state styling
                isHighlighted &&
                  !isHeader &&
                  !isTotal &&
                  styles.highlightedText,
              ]}
            >
              {formattedText}
            </Text>
          </View>
        );
      })}
    </>
  );

  // Make all non-header rows clickable (even without onPress prop)
  if (!disabled && !isHeader) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.row,
          isHeader && styles.header,
          isTotal && styles.totalRow,
          isHighlighted && styles.highlightedRow,
          { backgroundColor: colors?.tableBody },
        ]}
      >
        {rowContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.row,
        isHeader && styles.header,
        isTotal && styles.totalRow,
        { backgroundColor: colors?.tableHeader },
      ]}
    >
      {rowContent}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginBottom: 0,
    borderRadius: 0, // Remove border radius to prevent alignment issues
    paddingVertical: 0,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    // alignItems: "center",
    // minHeight: 30,
    width: "100%",
    borderWidth: 0,
  },
  highlightedRow: {
    backgroundColor: "#eff6ff", // Light blue background when highlighted
    elevation: 3, // Elevated effect
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderColor: "#3b82f6", // Blue border when highlighted
    borderWidth: 1,
  },
  cellContainer: {
    paddingHorizontal: 2,
    justifyContent: "center",
    minHeight: 24,
    borderRightWidth: 0.5, // Add subtle border between columns
    borderRightColor: "#e5e7eb",
  },
  numericCellContainer: {
    paddingHorizontal: 1,
  },
  cell: {
    paddingVertical: 4,
    fontSize: 11,
    lineHeight: 12,
  },
  numericText: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: "monospace",
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
  // Padding styles
  leftPadding: {
    paddingLeft: 4,
  },
  rightPadding: {
    paddingRight: 4,
  },
  header: {
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 10,
    color: "#111827",
  },
  bodyText: {
    fontSize: 10,
  },
  highlightedText: {
    color: "#1d4ed8", // Blue text when highlighted
    fontWeight: "600", // Slightly bolder
  },
  totalRow: {
    backgroundColor: "#fef3c7",
    borderTopWidth: 2,
    borderTopColor: "#f59e0b",
  },
  totalText: {
    color: "#f39861",
    // fontWeight: "bold",
    fontSize: 10,
  },
});
