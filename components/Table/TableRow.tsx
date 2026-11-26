import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  columns: string[];
  isHeader?: boolean;
  isTotal?: boolean;
};

const TableRow = ({ columns, isHeader = false, isTotal = false }: Props) => {
  return (
    <View
      style={[
        styles.row,
        isHeader && styles.header,
        isTotal && styles.totalRow,
      ]}
    >
      {columns.map((text, index) => (
        <Text
          key={index}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.cell,
            isHeader ? styles.headerText : styles.bodyText,
            isTotal && styles.totalText,
            index === 0 && styles.firstCol,
            index === columns.length - 1 && styles.lastCol,
          ]}
        >
          {text}
        </Text>
      ))}
    </View>
  );
};

export default TableRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 6,
    paddingVertical: 8,
    elevation: 1,
    alignItems: "center",
  },
  cell: {
    paddingHorizontal: 6,
    flex: 1,
    textAlign: "center",
  },
  firstCol: {
    flex: 2,
    textAlign: "left",
    paddingLeft: 12,
  },
  lastCol: {
    textAlign: "right",
    paddingRight: 12,
  },
  header: {
    backgroundColor: "#f3f4f6",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#111827",
  },
  bodyText: {
    fontSize: 13,
    color: "#374151",
  },
  totalRow: {
    backgroundColor: "#fff6e3",
  },
  totalText: {
    color: "#b67900",
    fontWeight: "bold",
  },
});
