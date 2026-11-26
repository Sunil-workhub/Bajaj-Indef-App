import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { OrgAccessItem } from "../../api/types";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function SelectOrgScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { orgAccess, selectOrg } = useAuth();

  const handleSelect = (org: OrgAccessItem) => {
    selectOrg(org);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors?.background }]}>
      <View style={styles.header}>
        <MaterialIcons name="domain" size={44} color={colors?.text} />
        <Text style={[styles.title, { color: colors?.text }]}>
          Select Organization
        </Text>
        <Text style={styles.subtitle}>
          You have access to multiple organizations. Choose one to continue.
        </Text>
      </View>

      <View style={styles.list}>
        {orgAccess.map((org) => (
          <TouchableOpacity
            key={org.orgId}
            style={styles.orgCard}
            onPress={() => handleSelect(org)}
            activeOpacity={0.7}
          >
            <View style={styles.orgIconWrap}>
              <MaterialIcons name="business" size={24} color="#2563eb" />
            </View>
            <Text style={[styles.orgName, { color: colors?.text }]}>
              {org.name}
            </Text>
            <MaterialIcons name="chevron-right" size={24} color="#64748b" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
    header: { alignItems: "center", marginBottom: 32 },
    title: { fontSize: 22, fontWeight: "700", marginTop: 12, marginBottom: 8 },
    subtitle: {
      fontSize: 14,
      color: "#64748b",
      textAlign: "center",
      lineHeight: 20,
    },
    list: { gap: 12 },
    orgCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 18,
      elevation: 4,
      shadowColor: "#3b3b3b",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    orgIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#eff6ff",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    orgName: { flex: 1, fontSize: 16, fontWeight: "600" },
  });
