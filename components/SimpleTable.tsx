// components/SimpleTable.tsx - Simplified version using React Native Paper's natural behavior
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { DataTable } from "react-native-paper";

type TableColumn = {
  key: string;
  title: string;
  numeric?: boolean;
  sortable?: boolean;
};

type TableData = {
  [key: string]: string | number;
};

type SimpleTableProps = {
  columns: TableColumn[];
  data: TableData[];
  maxHeight?: number;
  horizontalScroll?: boolean;
  onRowPress?: (item: TableData, index: number) => void;
};

export function SimpleTable({
  columns,
  data,
  maxHeight = 400,
  horizontalScroll = true,
  onRowPress,
}: SimpleTableProps) {
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  const handleRowPress = (item: TableData, index: number) => {
    setHighlightedRow(highlightedRow === index ? null : index);
    onRowPress?.(item, index);
  };

  const tableContent = (
    <DataTable style={styles.table}>
      {/* Header */}
      <DataTable.Header style={styles.header}>
        {columns.map((column) => (
          <DataTable.Title
            key={column.key}
            numeric={column.numeric}
            style={styles.headerCell}
            textStyle={styles.headerText}
          >
            {column.title}
          </DataTable.Title>
        ))}
      </DataTable.Header>

      {/* Data Rows */}
      <View style={{ maxHeight }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {data.map((item, index) => {
            const isHighlighted = highlightedRow === index;

            return (
              <DataTable.Row
                key={`row-${index}`}
                style={[styles.row, isHighlighted && styles.highlightedRow]}
                onPress={
                  onRowPress ? () => handleRowPress(item, index) : undefined
                }
              >
                {columns.map((column) => (
                  <DataTable.Cell
                    key={`${index}-${column.key}`}
                    numeric={column.numeric}
                    style={styles.cell}
                    textStyle={[
                      styles.cellText,
                      isHighlighted && styles.highlightedText,
                      column.numeric && styles.numericText,
                    ]}
                  >
                    {String(item[column.key] || "")}
                  </DataTable.Cell>
                ))}
              </DataTable.Row>
            );
          })}
        </ScrollView>
      </View>
    </DataTable>
  );

  if (horizontalScroll) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.horizontalScroll}
        >
          {tableContent}
        </ScrollView>
      </View>
    );
  }

  return <View style={styles.container}>{tableContent}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    overflow: "hidden",
  },
  horizontalScroll: {
    flex: 1,
  },
  table: {
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  headerCell: {
    justifyContent: "center",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#111827",
  },
  row: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    minHeight: 48,
  },
  highlightedRow: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
    borderWidth: 1,
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cellText: {
    fontSize: 12,
    color: "#374151",
  },
  highlightedText: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  numericText: {
    // fontFamily: "monospace",
    fontWeight: "500",
  },
});
