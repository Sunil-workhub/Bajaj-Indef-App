// screens/commissioning.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchCommissioningDetails,
  fetchCommissioningOverview,
} from "../../api/commissioningApi";
import { CommissioningDataLegacy, CommissioningItem } from "../../api/types";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTheme } from "../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = SCREEN_WIDTH >= 768;
const isLargeScreen = SCREEN_WIDTH >= 1024;

export default function CommissioningScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [commissioningData, setCommissioningData] =
    useState<CommissioningDataLegacy | null>(null);
  const [detailItems, setDetailItems] = useState<CommissioningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const fetchCommissioningDataFromApi = async () => {
    try {
      setError(null);
      const data = await fetchCommissioningOverview();
      setCommissioningData(data);
    } catch (err) {
      setError("Failed to load commissioning data");
      console.error("Error fetching commissioning data:", err);
    }
  };

  const fetchDetailDataFromApi = async (category: string) => {
    try {
      setError(null);
      const data = await fetchCommissioningDetails(category);
      setDetailItems(data);
    } catch (err) {
      setError("Failed to load commissioning details");
      console.error("Error fetching commissioning details:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchCommissioningDataFromApi();
        if (isActive) {
          setLoading(false);
        }
      };
      load();
      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleBackPress = () => {
    if (showDetails) {
      setShowDetails(false);
      setSelectedCategory("");
      setDetailItems([]);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        router.push("/(tabs)/" as any);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (showDetails) {
      await fetchDetailDataFromApi(selectedCategory);
    } else {
      await fetchCommissioningDataFromApi();
    }
    setRefreshing(false);
  };

  const handleCategoryPress = async (category: string, count: number) => {
    if (count === 0) return; // Don't navigate if count is 0

    setSelectedCategory(category);
    setLoading(true);
    await fetchDetailDataFromApi(category);
    setLoading(false);
    setShowDetails(true);
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "due_today":
        return "Due Today";
      case "over_due":
        return "Over Due";
      case "commissioned":
        return "Commissioned";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return "Commissioning Details";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "due_today":
        return "#059669";
      case "over_due":
        return "#dc2626";
      case "commissioned":
        return "#2563eb";
      case "pending":
        return "#d97706";
      case "cancelled":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading commissioning data..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <ErrorMessage
          message={error}
          onRetry={
            showDetails
              ? () => fetchDetailDataFromApi(selectedCategory)
              : fetchCommissioningDataFromApi
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.blueHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {showDetails ? getCategoryTitle(selectedCategory) : "Commissioning"}
          </Text>
          <View style={styles.logoContainer}>
            <MaterialIcons name="business" size={24} color="#ffffff" />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!showDetails ? (
            // Overview Screen
            <View style={styles.overviewContainer}>
              {/* Priority Section */}
              <View style={styles.prioritySection}>
                <Text style={styles.sectionTitle}>
                  <MaterialIcons
                    name="priority-high"
                    size={20}
                    color="#dc2626"
                  />{" "}
                  Urgent Actions
                </Text>

                <View style={styles.priorityGrid}>
                  <TouchableOpacity
                    style={[styles.priorityCard, styles.dueTodayCard]}
                    onPress={() =>
                      handleCategoryPress(
                        "due_today",
                        commissioningData?.dueToday || 0,
                      )
                    }
                    activeOpacity={0.9}
                  >
                    <View style={styles.priorityCardGradient}>
                      <View style={styles.priorityCardHeader}>
                        <View style={styles.priorityIconBadge}>
                          <MaterialIcons
                            name="today"
                            size={24}
                            color="#ffffff"
                          />
                        </View>
                        <MaterialIcons
                          name="arrow-forward"
                          size={20}
                          color="rgba(255,255,255,0.8)"
                        />
                      </View>
                      <View style={styles.priorityCardContent}>
                        <Text style={styles.priorityCardCount}>
                          {commissioningData?.dueToday || 0}
                        </Text>
                        <Text style={styles.priorityCardLabel}>Due Today</Text>
                        <Text style={styles.priorityCardSubtext}>
                          Requires immediate attention
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.priorityCard, styles.overDueCard]}
                    onPress={() =>
                      handleCategoryPress(
                        "over_due",
                        commissioningData?.overDue || 0,
                      )
                    }
                    activeOpacity={0.9}
                  >
                    <View style={styles.priorityCardGradient}>
                      <View style={styles.priorityCardHeader}>
                        <View style={styles.priorityIconBadge}>
                          <MaterialIcons
                            name="warning"
                            size={24}
                            color="#ffffff"
                          />
                        </View>
                        <MaterialIcons
                          name="arrow-forward"
                          size={20}
                          color="rgba(255,255,255,0.8)"
                        />
                      </View>
                      <View style={styles.priorityCardContent}>
                        <Text style={styles.priorityCardCount}>
                          {commissioningData?.overDue || 0}
                        </Text>
                        <Text style={styles.priorityCardLabel}>Over Due</Text>
                        <Text style={styles.priorityCardSubtext}>
                          Immediate action required
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total Request Card */}
              <View style={styles.totalRequestCard}>
                <View style={styles.totalRequestContent}>
                  <View style={styles.totalRequestLeft}>
                    <Text style={styles.totalRequestLabel}>Total Requests</Text>
                    <Text style={styles.totalRequestCount}>
                      {commissioningData?.totalRequest || 0}
                    </Text>
                  </View>
                  <View style={styles.totalRequestIcon}>
                    <MaterialIcons
                      name="assessment"
                      size={40}
                      color="#ffffff"
                    />
                  </View>
                </View>
              </View>

              {/* Status Overview Grid */}
              <View style={styles.statusSection}>
                <View style={styles.statusGrid}>
                  <TouchableOpacity
                    style={styles.statusCard}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.statusIconContainer,
                        { backgroundColor: "#dbeafe" },
                      ]}
                    >
                      <MaterialIcons
                        name="check-circle"
                        size={24}
                        color="#2563eb"
                      />
                    </View>
                    <View style={styles.statusContent}>
                      <Text style={styles.statusCount}>
                        {commissioningData?.commissioned || 0}
                      </Text>
                      <Text style={styles.statusLabel}>Commissioned</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statusCard}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.statusIconContainer,
                        { backgroundColor: "#fef3c7" },
                      ]}
                    >
                      <MaterialIcons
                        name="schedule"
                        size={24}
                        color="#d97706"
                      />
                    </View>
                    <View style={styles.statusContent}>
                      <Text style={styles.statusCount}>
                        {commissioningData?.pending || 0}
                      </Text>
                      <Text style={styles.statusLabel}>Pending</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statusCard}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.statusIconContainer,
                        { backgroundColor: "#f3f4f6" },
                      ]}
                    >
                      <MaterialIcons name="cancel" size={24} color="#6b7280" />
                    </View>
                    <View style={styles.statusContent}>
                      <Text style={styles.statusCount}>
                        {commissioningData?.cancelled || 0}
                      </Text>
                      <Text style={styles.statusLabel}>Cancelled</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            // Details Screen
            <View style={styles.detailsContainer}>
              <View style={styles.detailsHeader}>
                <MaterialIcons name="list" size={24} color={colors?.primary} />
                <Text style={styles.detailsTitle}>
                  {getCategoryTitle(selectedCategory)} ({detailItems.length})
                </Text>
              </View>

              <View style={styles.itemsList}>
                {detailItems.map((item, index) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemTitleContainer}>
                        <Text style={styles.itemCompany}>
                          {item.companyName}
                        </Text>
                        <Text style={styles.itemLocation}>{item.location}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(item.status) },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {item.status === "due_today"
                            ? "DUE"
                            : item.status === "over_due"
                              ? "OVERDUE"
                              : selectedCategory.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.itemDetails}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>ABP Assigned</Text>
                          <Text style={styles.detailValue}>
                            {item.abpAssigned}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Contact Person</Text>
                          <Text style={styles.detailValue}>
                            {item.contactPerson}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Designation</Text>
                          <Text style={styles.detailValue}>
                            {item.designation}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Serial No</Text>
                          <Text style={styles.detailValue}>
                            {item.serialNo}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>QR Code</Text>
                          <Text style={styles.detailValue}>{item.qrCode}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Job No</Text>
                          <Text style={styles.detailValue}>{item.jobNo}</Text>
                        </View>
                      </View>

                      <View style={styles.dueDateRow}>
                        <MaterialIcons
                          name="schedule"
                          size={16}
                          color="#dc2626"
                        />
                        <Text style={styles.dueDateLabel}>Due Date:</Text>
                        <Text
                          style={[
                            styles.dueDateValue,
                            item.status === "over_due" && styles.overDueDate,
                          ]}
                        >
                          {item.dueDate}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                {detailItems.length === 0 && (
                  <View style={styles.emptyState}>
                    <MaterialIcons
                      name="inbox"
                      size={64}
                      color={colors?.textSecondary}
                    />
                    <Text style={styles.emptyStateText}>No items found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      There are no{" "}
                      {getCategoryTitle(selectedCategory).toLowerCase()} items
                      at the moment.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors?.background,
    },
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
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    headerTitle: {
      fontSize: isTablet ? 24 : 22,
      fontWeight: "bold",
      color: colors?.text,
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
      padding: isTablet ? 20 : 16,
    },
    overviewContainer: {
      gap: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors?.text,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    prioritySection: {
      gap: 0,
    },
    priorityGrid: {
      flexDirection: isTablet ? "row" : "row",
      gap: 12,
    },
    priorityCard: {
      flex: 1,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    dueTodayCard: {
      backgroundColor: "#059669",
    },
    overDueCard: {
      backgroundColor: "#dc2626",
    },
    priorityCardGradient: {
      padding: isTablet ? 24 : 20,
    },
    priorityCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    priorityIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    priorityCardContent: {
      alignItems: "flex-start",
    },
    priorityCardCount: {
      fontSize: isTablet ? 36 : 32,
      fontWeight: "900",
      color: "#ffffff",
      marginBottom: 4,
    },
    priorityCardLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: 4,
    },
    priorityCardSubtext: {
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
    },
    totalRequestCard: {
      borderRadius: 16,
      overflow: "hidden",
      elevation: 2,
    },
    totalRequestContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: isTablet ? 24 : 20,
      backgroundColor: "#667eea",
    },
    totalRequestLeft: {
      flex: 1,
    },
    totalRequestLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "rgba(255,255,255,0.8)",
      marginBottom: 4,
    },
    totalRequestCount: {
      fontSize: isTablet ? 40 : 36,
      fontWeight: "900",
      color: "#ffffff",
      marginBottom: 4,
    },
    totalRequestIcon: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    statusSection: {
      gap: 0,
    },
    statusGrid: {
      gap: 12,
    },
    statusCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.surface,
      padding: 16,
      borderRadius: 12,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: colors?.border,
    },
    statusIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    statusContent: {
      flex: 1,
    },
    statusCount: {
      fontSize: 24,
      fontWeight: "800",
      color: colors?.text,
      marginBottom: 2,
    },
    statusLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors?.textSecondary,
    },
    statusArrow: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors?.cardBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    detailsContainer: {
      gap: 16,
    },
    detailsHeader: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.surface,
      padding: 16,
      borderRadius: 12,
      elevation: 1,
      gap: 8,
    },
    detailsTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors?.text,
    },
    itemsList: {
      gap: 16,
    },
    itemCard: {
      backgroundColor: colors?.surface,
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    itemTitleContainer: {
      flex: 1,
      marginRight: 12,
    },
    itemCompany: {
      fontSize: 16,
      fontWeight: "700",
      color: colors?.primary,
      marginBottom: 4,
    },
    itemLocation: {
      fontSize: 13,
      color: colors?.textSecondary,
      lineHeight: 18,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#ffffff",
      letterSpacing: 0.5,
    },
    itemDetails: {
      gap: 12,
    },
    detailRow: {
      flexDirection: "row",
      gap: 16,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: colors?.textSecondary,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors?.text,
    },
    dueDateRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fef2f2",
      padding: 8,
      borderRadius: 6,
      marginTop: 4,
      gap: 6,
    },
    dueDateLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "#dc2626",
    },
    dueDateValue: {
      fontSize: 12,
      fontWeight: "700",
      color: "#dc2626",
    },
    overDueDate: {
      color: "#b91c1c",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: isTablet ? 60 : 40,
      backgroundColor: colors?.surface,
      borderRadius: 12,
      elevation: 1,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors?.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors?.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });
