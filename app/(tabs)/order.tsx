import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Animated,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import TableRow from "../../components/TableRow";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useOrderData } from "../../hooks/useOrderData";

export default function OrderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { data, loading, error, refetch } = useOrderData();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const columns = ["Month", "ABP", "ABP EXP", "DC", "DC EXP", "Total", "SCM"];

  const convertedData = data.map((item) => [
    item.month,
    item.abp,
    item.abpExport,
    item.dc,
    item.dcExport,
    item.total,
    item.scm,
  ]);

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/(tabs)/" as any);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading order data..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <ErrorMessage message={error} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Blue Header with Back Button and Logo */}
        <View style={styles.blueHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Order Intake</Text>

          <View style={styles.logoContainer}>
            {/* Replace with your logo */}
            <MaterialIcons name="business" size={24} color="#ffffff" />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScrollView
            horizontal
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View>
              <TableRow columns={columns} isHeader />
              <ScrollView style={{ maxHeight: 400 }}>
                {convertedData.length > 0 ? (
                  convertedData.map((row, index) => (
                    <TableRow key={index} columns={row} />
                  ))
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                      No order data available
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  blueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  logoContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flex: 1,
    padding: 8,
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});
