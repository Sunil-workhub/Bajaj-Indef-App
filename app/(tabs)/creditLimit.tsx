// screens/creditLimit.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchCreditLimits, updateOrderIntake } from "../../api/creditLimitApi";
import { CreditLimitData } from "../../api/types";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTheme } from "../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = SCREEN_WIDTH >= 768;
const isLargeScreen = SCREEN_WIDTH >= 1024;

export default function CreditLimitScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const [creditLimitData, setCreditLimitData] = useState<CreditLimitData[]>([]);
  const [filteredData, setFilteredData] = useState<CreditLimitData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  console.log("creditLimitData", creditLimitData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CreditLimitData | null>(
    null,
  );
  const [newOrderIntake, setNewOrderIntake] = useState("");
  const [updating, setUpdating] = useState(false);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const fetchCreditLimitData = async () => {
    try {
      setError(null);
      const data = await fetchCreditLimits();
      setCreditLimitData(data);
      setFilteredData(data);
    } catch (err) {
      setError("Failed to load credit limit data");
      console.error("Error fetching credit limit data:", err);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (text.trim() === "") {
      setFilteredData(creditLimitData);
    } else {
      const filtered = creditLimitData.filter((item) => {
        const searchText = text.toLowerCase();
        return (
          item.companyName.toLowerCase().includes(searchText) ||
          item.customerNumber.toLowerCase().includes(searchText)
        );
      });
      setFilteredData(filtered);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchCreditLimitData();
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
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/(tabs)/" as any);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCreditLimitData();
    setRefreshing(false);
  };

  const openUpdateModal = (item: CreditLimitData) => {
    setSelectedItem(item);
    setNewOrderIntake(item.orderIntake.toFixed(2));
    setShowUpdateModal(true);

    // Animate modal slide up
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeUpdateModal = () => {
    // Animate modal slide down
    Animated.timing(modalSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowUpdateModal(false);
      setSelectedItem(null);
      setNewOrderIntake("");
    });
  };

  const handleUpdateOrderIntake = async () => {
    if (!selectedItem || !newOrderIntake.trim()) {
      Alert.alert("Error", "Please enter a valid order intake value");
      return;
    }

    const orderIntakeValue = parseFloat(newOrderIntake);
    if (isNaN(orderIntakeValue) || orderIntakeValue < 0) {
      Alert.alert("Error", "Please enter a valid positive number");
      return;
    }

    setUpdating(true);
    try {
      // Call the actual API to update order intake
      const updatedData = await updateOrderIntake(
        selectedItem.customerNumber,
        orderIntakeValue,
      );

      // Update the local state with the fresh data from API
      setCreditLimitData(updatedData);
      setFilteredData(updatedData);
      setSearchQuery("");

      closeUpdateModal();
      Alert.alert("Success", "Order intake updated successfully");
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", "Failed to update order intake. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (outstanding: number, creditLimit: number) => {
    if (creditLimit === 0) return "#6b7280"; // Gray for no credit limit
    const ratio = outstanding / creditLimit;
    if (ratio > 0.8) return "#dc2626"; // Red for high utilization
    if (ratio > 0.5) return "#d97706"; // Orange for medium utilization
    return "#059669"; // Green for low utilization
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <LoadingSpinner message="Loading credit limit data..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <ErrorMessage message={error} onRetry={fetchCreditLimitData} />
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
          <Text style={styles.headerTitle}>Credit Limit</Text>
          <View style={styles.logoContainer}>
            <MaterialIcons name="account-balance" size={24} color="#ffffff" />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color={colors?.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company name or customer number"
            placeholderTextColor={colors?.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch("")}
              style={styles.clearButton}
            >
              <MaterialIcons
                name="close"
                size={20}
                color={colors?.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.creditLimitContainer}>
            {filteredData.map((item, index) => (
              <View key={item.id} style={styles.creditCard}>
                {/* Company Header */}
                <View style={styles.companyHeader}>
                  <View style={styles.companyTitleContainer}>
                    <Text style={styles.companyName}>{item.companyName}</Text>
                    <View
                      style={[
                        styles.statusIndicator,
                        {
                          backgroundColor: getStatusColor(
                            item.outstanding,
                            item.creditLimit,
                          ),
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Credit Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Credit Limit</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(item.creditLimit)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text
                        style={[
                          styles.detailLabel,
                          {
                            color: getStatusColor(
                              item.outstanding,
                              item.creditLimit,
                            ),
                          },
                        ]}
                      >
                        Outstanding
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color: getStatusColor(
                              item.outstanding,
                              item.creditLimit,
                            ),
                          },
                        ]}
                      >
                        {formatCurrency(item.outstanding)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Order Intake</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(item.orderIntake)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Pending Order</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(item.pendingOrder)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Credit Hold</Text>
                      <View style={styles.creditHoldContainer}>
                        <Text
                          style={[
                            styles.creditHoldText,
                            {
                              color: item.creditHold ? "#dc2626" : "#059669",
                            },
                          ]}
                        >
                          {item.creditHold ? "Yes" : "No"}
                        </Text>
                        {item.creditHold && (
                          <MaterialIcons
                            name="block"
                            size={16}
                            color="#dc2626"
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openUpdateModal(item)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="edit"
                    size={18}
                    color={colors?.primary}
                  />
                  <Text style={styles.actionButtonText}>
                    CHANGE ORDER INTAKE
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {filteredData.length === 0 && searchQuery.length > 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="search-off"
                  size={64}
                  color={colors?.textSecondary}
                />
                <Text style={styles.emptyStateText}>No results found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your search terms
                </Text>
              </View>
            )}

            {creditLimitData.length === 0 && searchQuery.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="account-balance-wallet"
                  size={64}
                  color={colors?.textSecondary}
                />
                <Text style={styles.emptyStateText}>
                  No credit limit data found
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Credit limit information will appear here when available.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Update Order Intake Modal */}
        <Modal
          visible={showUpdateModal}
          transparent
          animationType="none"
          onRequestClose={closeUpdateModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY: modalSlideAnim }] },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Order Intake</Text>
                <TouchableOpacity
                  onPress={closeUpdateModal}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={colors?.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {selectedItem && (
                <View style={styles.modalContent}>
                  {/* Company Info */}
                  <View style={styles.modalCompanyInfo}>
                    <Text style={styles.modalCompanyLabel}>Company Name</Text>
                    <Text style={styles.modalCompanyName}>
                      {selectedItem.companyName}
                    </Text>
                  </View>

                  {/* Current Details */}
                  <View style={styles.modalDetailsContainer}>
                    <View style={styles.modalDetailItem}>
                      <Text style={styles.modalDetailLabel}>Credit Limit</Text>
                      <Text style={styles.modalDetailValue}>
                        {formatCurrency(selectedItem.creditLimit)}
                      </Text>
                    </View>

                    <View style={styles.modalDetailItem}>
                      <Text style={styles.modalDetailLabel}>Outstanding</Text>
                      <Text style={styles.modalDetailValue}>
                        {formatCurrency(selectedItem.outstanding)}
                      </Text>
                    </View>

                    <View style={styles.modalDetailItem}>
                      <Text style={styles.modalDetailLabel}>
                        Current Order Intake
                      </Text>
                      <Text style={styles.modalDetailValue}>
                        {formatCurrency(selectedItem.orderIntake)}
                      </Text>
                    </View>

                    <View style={styles.modalDetailItem}>
                      <Text style={styles.modalDetailLabel}>Pending Order</Text>
                      <Text style={styles.modalDetailValue}>
                        {formatCurrency(selectedItem.pendingOrder)}
                      </Text>
                    </View>

                    <View style={styles.modalDetailItem}>
                      <Text style={styles.modalDetailLabel}>Credit Hold</Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedItem.creditHold ? "Yes" : "No"}
                      </Text>
                    </View>
                  </View>

                  {/* Input Field */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      Enter new order intake value
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={newOrderIntake}
                      onChangeText={setNewOrderIntake}
                      placeholder="0.00"
                      placeholderTextColor={colors?.textSecondary}
                      keyboardType="numeric"
                      editable={!updating}
                    />
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalBackButton}
                      onPress={closeUpdateModal}
                      disabled={updating}
                    >
                      <Text style={styles.modalBackButtonText}>BACK</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modalUpdateButton,
                        updating && styles.modalUpdateButtonDisabled,
                      ]}
                      onPress={handleUpdateOrderIntake}
                      disabled={updating}
                    >
                      {updating ? (
                        <View style={styles.loadingContainer}>
                          <Text style={styles.modalUpdateButtonText}>
                            UPDATING...
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.modalUpdateButtonText}>UPDATE</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>
          </View>
        </Modal>
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
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.surface,
      marginHorizontal: isTablet ? 20 : 16,
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors?.border,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 14,
      color: colors?.text,
    },
    clearButton: {
      padding: 4,
    },
    content: {
      flex: 1,
      padding: isTablet ? 20 : 16,
    },
    creditLimitContainer: {
      gap: 16,
    },
    creditCard: {
      backgroundColor: colors?.surface,
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors?.border,
    },
    companyHeader: {
      marginBottom: 16,
    },
    companyTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    companyName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors?.primary,
      flex: 1,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
    detailsGrid: {
      gap: 12,
      marginBottom: 16,
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
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors?.text,
    },
    creditHoldContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    creditHoldText: {
      fontSize: 14,
      fontWeight: "600",
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors?.cardBackground,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors?.border,
      gap: 8,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors?.primary,
      letterSpacing: 0.5,
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
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: colors?.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.9,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors?.text,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalContent: {
      padding: 20,
    },
    modalCompanyInfo: {
      backgroundColor: colors?.primary + "20",
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    modalCompanyLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors?.primary,
      marginBottom: 4,
    },
    modalCompanyName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors?.primary,
    },
    modalDetailsContainer: {
      backgroundColor: colors?.cardBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      gap: 12,
    },
    modalDetailItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalDetailLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: colors?.textSecondary,
      flex: 1,
    },
    modalDetailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors?.text,
      textAlign: "right",
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors?.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors?.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: colors?.text,
      backgroundColor: colors?.surface,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 30,
    },
    modalBackButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors?.border,
      alignItems: "center",
      backgroundColor: colors?.cardBackground,
    },
    modalBackButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors?.textSecondary,
    },
    modalUpdateButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: colors?.primary,
    },
    modalUpdateButtonDisabled: {
      backgroundColor: colors?.textSecondary,
    },
    modalUpdateButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#ffffff",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
