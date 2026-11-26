import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";

type Props = {
  search: string;
  setSearch: (val: string) => void;
  onExport: () => void;
  filterLabel?: string;
};

export default function TableToolbar({
  search,
  setSearch,
  onExport,
  filterLabel,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        placeholder="Search..."
        value={search}
        onChangeText={setSearch}
      />
      {/* <TouchableOpacity style={styles.button} onPress={onExport}>
        <Text style={styles.buttonText}>Export</Text>
      </TouchableOpacity> */}
      {filterLabel && <Text style={styles.filter}>{filterLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  filter: {
    marginLeft: 8,
    color: "#6b7280",
  },
});
