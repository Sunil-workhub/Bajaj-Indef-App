import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard"; // ✅ [web:1]
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  searchAdditionalPassword,
  searchAssetMaster,
  updateAdditionalPassword,
  updateAdminPassword,
  updateAvAdminPassword,
  updateAvLockPassword,
} from "../../api/passwordRetrieverApi";
import type { AdditionalPasswordData, AssetMasterData } from "../../api/types";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

type PasswordType = "admin" | "avAdmin" | "avLock";
type ViewMode = "assetMaster" | "additionalPassword";

// ✅ helper: mask with exact same length
const maskPassword = (value?: string, maskChar = "•") => {
  const str = String(value ?? "");
  return str.length ? maskChar.repeat(str.length) : "";
};

export default function PasswordRetrievalScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);
  const [loading, setLoading] = useState(false);

  const [assetMasterList, setAssetMasterList] = useState<AssetMasterData[]>([]);
  const [additionalPasswordList, setAdditionalPasswordList] = useState<
    AdditionalPasswordData[]
  >([]);

  const [selectedAssetUser, setSelectedAssetUser] =
    useState<AssetMasterData | null>(null);
  const [selectedAdditionalUser, setSelectedAdditionalUser] =
    useState<AdditionalPasswordData | null>(null);

  const [changePasswordModalVisible, setChangePasswordModalVisible] =
    useState(false);
  const [additionalPasswordModalVisible, setAdditionalPasswordModalVisible] =
    useState(false);

  const [selectedPasswordType, setSelectedPasswordType] =
    useState<PasswordType | null>(null);

  const [passwordVisibility, setPasswordVisibility] = useState({
    admin: false,
    avAdmin: false,
    avLock: false,
    additional: false,
  });

  const handleBackPress = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else router.push("/(tabs)/" as any);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a search query");
      return;
    }

    setLoading(true);
    setViewMode(null);
    setAssetMasterList([]);
    setAdditionalPasswordList([]);
    setSelectedAssetUser(null);
    setSelectedAdditionalUser(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetMasterData = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a search query first");
      return;
    }

    setLoading(true);
    try {
      const list = await searchAssetMaster(searchQuery);
      setAssetMasterList(list);
      setSelectedAssetUser(null);
      setViewMode("assetMaster");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to fetch asset master data",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalPasswordData = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a search query first");
      return;
    }

    setLoading(true);
    try {
      const list = await searchAdditionalPassword(searchQuery);
      setAdditionalPasswordList(list);
      setSelectedAdditionalUser(null);
      setViewMode("additionalPassword");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to fetch additional password data",
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (type: keyof typeof passwordVisibility) => {
    setPasswordVisibility((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const openAssetChangePasswordModal = (
    user: AssetMasterData,
    type: PasswordType,
  ) => {
    setSelectedAssetUser(user);
    setSelectedPasswordType(type);
    setChangePasswordModalVisible(true);
  };

  const openAdditionalChangePasswordModal = (user: AdditionalPasswordData) => {
    setSelectedAdditionalUser(user);
    setAdditionalPasswordModalVisible(true);
  };

  // ✅ onSubmit returns boolean so modal can show success UI
  const handleChangeAssetPassword = async (
    newPassword: string,
  ): Promise<boolean> => {
    if (!selectedAssetUser || !selectedPasswordType) return false;

    try {
      setLoading(true);
      let response;

      switch (selectedPasswordType) {
        case "admin":
          response = await updateAdminPassword(
            newPassword,
            selectedAssetUser.empId,
          );
          break;
        case "avAdmin":
          response = await updateAvAdminPassword(
            newPassword,
            selectedAssetUser.empId,
          );
          break;
        case "avLock":
          response = await updateAvLockPassword(
            newPassword,
            selectedAssetUser.empId,
          );
          break;
        default:
          throw new Error("Invalid password type");
      }

      if (response.success) {
        await fetchAssetMasterData();
        return true;
      } else {
        Alert.alert("Error", response.message || "Failed to change password");
        return false;
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ onSubmit returns boolean so modal can show success UI
  const handleChangeAdditionalPassword = async (
    newPassword: string,
  ): Promise<boolean> => {
    if (!selectedAdditionalUser) return false;

    try {
      setLoading(true);
      const response = await updateAdditionalPassword(
        newPassword,
        selectedAdditionalUser.empId,
      );

      if (response.success) {
        await fetchAdditionalPasswordData();
        return true;
      } else {
        Alert.alert("Error", response.message || "Failed to change password");
        return false;
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(String(text ?? "")); // ✅ [web:1]
      Alert.alert("Copied", `${label} copied to clipboard`);
    } catch {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const selectedAssetCurrentPassword = useMemo(() => {
    if (!selectedAssetUser || !selectedPasswordType) return "";
    if (selectedPasswordType === "admin")
      return selectedAssetUser.adminPassword ?? "";
    if (selectedPasswordType === "avAdmin")
      return selectedAssetUser.avAdminPassword ?? "";
    return selectedAssetUser.avLockPassword ?? "";
  }, [selectedAssetUser, selectedPasswordType]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password Retrieval</Text>
        <View style={styles.logoContainer}>
          <MaterialIcons name="vpn-key" size={24} color="#ffffff" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search</Text>
          <View style={styles.searchContainer}>
            <MaterialIcons
              name="search"
              size={24}
              color={colors?.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter asset name or code"
              placeholderTextColor={colors?.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons
                  name="close"
                  size={20}
                  color={colors?.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <MaterialIcons name="search" size={20} color="#ffffff" />
                <Text style={styles.searchButtonText}>Search</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {!viewMode && searchQuery.trim().length > 0 && !loading && (
          <View style={styles.typeSelectionSection}>
            <Text style={styles.sectionTitle}>Select Type</Text>
            <View style={styles.typeButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: colors?.cardBackground },
                ]}
                onPress={fetchAssetMasterData}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name="devices"
                  size={32}
                  color={colors?.iconBlue}
                />
                <Text style={styles.typeButtonText}>Asset Master</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: colors?.cardBackground },
                ]}
                onPress={fetchAdditionalPasswordData}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name="lock"
                  size={32}
                  color={colors?.iconGreen}
                />
                <Text style={styles.typeButtonText}>Additional Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {viewMode === "assetMaster" && (
          <View style={styles.dataSection}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="devices"
                size={28}
                color={colors?.iconBlue}
              />
              <Text style={styles.cardTitle}>Asset Master</Text>
            </View>

            {assetMasterList.length === 0 ? (
              <View style={styles.dataCard}>
                <Text style={styles.infoValue}>No records found.</Text>
              </View>
            ) : (
              assetMasterList.map((u, idx) => (
                <View
                  key={`${u.empId}-${u.code}-${idx}`}
                  style={styles.dataCard}
                >
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{u.empName}</Text>
                  </View>

                  <View style={styles.divider} />

                  <PasswordRow
                    label="Admin Password"
                    password={u.adminPassword}
                    visible={passwordVisibility.admin}
                    onToggleVisibility={() => togglePasswordVisibility("admin")}
                    onCopy={() =>
                      copyToClipboard(u.adminPassword, "Admin Password")
                    }
                    colors={colors}
                    maskChar="•"
                  />

                  <PasswordRow
                    label="AV Admin Password"
                    password={u.avAdminPassword}
                    visible={passwordVisibility.avAdmin}
                    onToggleVisibility={() =>
                      togglePasswordVisibility("avAdmin")
                    }
                    onCopy={() =>
                      copyToClipboard(u.avAdminPassword, "AV Admin Password")
                    }
                    colors={colors}
                    maskChar="•"
                  />

                  <PasswordRow
                    label="AV Lock Password"
                    password={u.avLockPassword}
                    visible={passwordVisibility.avLock}
                    onToggleVisibility={() =>
                      togglePasswordVisibility("avLock")
                    }
                    onCopy={() =>
                      copyToClipboard(u.avLockPassword, "AV Lock Password")
                    }
                    colors={colors}
                    maskChar="•"
                  />

                  <View style={styles.divider} />

                  <Text style={styles.changePasswordTitle}>
                    Change Password
                  </Text>
                  <View style={styles.changePasswordButtons}>
                    <TouchableOpacity
                      style={[
                        styles.changePasswordBtn,
                        { backgroundColor: colors?.primary },
                      ]}
                      onPress={() => openAssetChangePasswordModal(u, "admin")}
                    >
                      <MaterialIcons
                        name="admin-panel-settings"
                        size={20}
                        color="#ffffff"
                      />
                      <Text style={styles.changePasswordBtnText}>Admin</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.changePasswordBtn,
                        { backgroundColor: colors?.secondary },
                      ]}
                      onPress={() => openAssetChangePasswordModal(u, "avAdmin")}
                    >
                      <MaterialIcons
                        name="security"
                        size={20}
                        color="#ffffff"
                      />
                      <Text style={styles.changePasswordBtnText}>AV Admin</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.changePasswordBtn,
                        { backgroundColor: colors?.accent },
                      ]}
                      onPress={() => openAssetChangePasswordModal(u, "avLock")}
                    >
                      <MaterialIcons name="lock" size={20} color="#ffffff" />
                      <Text style={styles.changePasswordBtnText}>AV Lock</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {viewMode === "additionalPassword" && (
          <View style={styles.dataSection}>
            {additionalPasswordList.length === 0 ? (
              <View style={styles.dataCard}>
                <Text style={styles.infoValue}>No records found.</Text>
              </View>
            ) : (
              additionalPasswordList.map((u, idx) => (
                <View
                  key={`${u.empId}-${u.username}-${idx}`}
                  style={styles.dataCard}
                >
                  <View style={styles.cardHeader}>
                    <MaterialIcons
                      name="lock"
                      size={28}
                      color={colors?.iconGreen}
                    />
                    <Text style={styles.cardTitle}>Additional Password</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Employee ID:</Text>
                    <Text style={styles.infoValue}>{u.empId}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{u.empName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Username:</Text>
                    <Text style={styles.infoValue}>{u.username}</Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(u.username, "Username")}
                    >
                      <MaterialIcons
                        name="content-copy"
                        size={20}
                        color={colors?.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>URL:</Text>
                    <Text
                      style={[styles.infoValue, styles.urlText]}
                      numberOfLines={1}
                    >
                      {u.url}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(u.url, "URL")}
                    >
                      <MaterialIcons
                        name="content-copy"
                        size={20}
                        color={colors?.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  <PasswordRow
                    label="Password"
                    password={u.password}
                    visible={passwordVisibility.additional}
                    onToggleVisibility={() =>
                      togglePasswordVisibility("additional")
                    }
                    onCopy={() => copyToClipboard(u.password, "Password")}
                    colors={colors}
                    maskChar="•"
                  />

                  <View style={styles.divider} />

                  <TouchableOpacity
                    style={[
                      styles.fullWidthButton,
                      { backgroundColor: colors?.primary },
                    ]}
                    onPress={() => openAdditionalChangePasswordModal(u)}
                  >
                    <MaterialIcons name="vpn-key" size={20} color="#ffffff" />
                    <Text style={styles.fullWidthButtonText}>
                      Change Password
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Asset modal */}
      <ChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)}
        onSubmit={handleChangeAssetPassword}
        passwordType={selectedPasswordType}
        colors={colors}
        userData={
          selectedAssetUser
            ? {
                empId: selectedAssetUser.empId,
                empName: selectedAssetUser.empName,
                currentPassword: selectedAssetCurrentPassword,
              }
            : null
        }
      />

      {/* Additional modal */}
      <ChangePasswordModal
        visible={additionalPasswordModalVisible}
        onClose={() => setAdditionalPasswordModalVisible(false)}
        onSubmit={handleChangeAdditionalPassword}
        passwordType="additional"
        colors={colors}
        userData={
          selectedAdditionalUser
            ? {
                empId: selectedAdditionalUser.empId,
                empName: selectedAdditionalUser.empName,
                currentPassword: selectedAdditionalUser.password ?? "",
              }
            : null
        }
      />
    </SafeAreaView>
  );
}

// Password Row
interface PasswordRowProps {
  label: string;
  password: string;
  visible: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
  colors: any;
  maskChar?: string;
}

const PasswordRow: React.FC<PasswordRowProps> = ({
  label,
  password,
  visible,
  onToggleVisibility,
  onCopy,
  colors,
  maskChar = "•",
}) => {
  const styles = createStyles(colors);

  return (
    <View style={styles.passwordRow}>
      <View style={styles.passwordLabelContainer}>
        <Text style={styles.passwordLabel}>{label}</Text>
      </View>
      <View style={styles.passwordValueContainer}>
        <Text style={styles.passwordValue} numberOfLines={1}>
          {visible ? String(password ?? "") : maskPassword(password, maskChar)}
        </Text>

        <TouchableOpacity
          onPress={onToggleVisibility}
          style={styles.iconButton}
        >
          <MaterialIcons
            name={visible ? "visibility" : "visibility-off"}
            size={20}
            color={colors?.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onCopy} style={styles.iconButton}>
          <MaterialIcons
            name="content-copy"
            size={20}
            color={colors?.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Change Password Modal
interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<boolean>;
  passwordType: PasswordType | "additional" | null;
  colors: any;
  userData?: {
    empId: number;
    empName: string;
    currentPassword?: string;
  } | null;
}

type SuccessStep = "none" | "saving" | "done";

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSubmit,
  passwordType,
  colors,
  userData,
}) => {
  const styles = createStyles(colors);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successStep, setSuccessStep] = useState<SuccessStep>("none"); // ✅
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setShowCurrentPassword(false);
      setError("");
      setLoading(false);
      setSuccessStep("none");
    } else {
      setError("");
      setShowCurrentPassword(false);
      setSuccessStep("none");
    }
  }, [visible]);

  const getModalTitle = () => {
    if (passwordType === "admin") return "Change Admin Password";
    if (passwordType === "avAdmin") return "Change AV Admin Password";
    if (passwordType === "avLock") return "Change AV Lock Password";
    return "Change Password";
  };

  const handleSubmit = async () => {
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      // ✅ show saving overlay while api runs
      setSuccessStep("saving");

      const ok = await onSubmit(newPassword);

      if (ok) {
        // ✅ switch to tick/thumb state
        setSuccessStep("done");
        await new Promise((r) => setTimeout(r, 1000));
        setSuccessStep("none");
        onClose();
      } else {
        setSuccessStep("none");
      }
    } finally {
      setLoading(false);
    }
  };

  const overlayVisible = successStep !== "none";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading || overlayVisible}
            >
              <MaterialIcons name="close" size={24} color={colors?.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {userData && (
              <View style={styles.userInfoSection}>
                <View style={styles.userInfoRow}>
                  <Text style={styles.userInfoLabel}>User Name:</Text>
                  <Text style={styles.userInfoValue}>{userData.empName}</Text>
                </View>

                <View style={styles.userInfoRow}>
                  <Text style={styles.userInfoLabel}>Current Password:</Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Text style={styles.userInfoValue}>
                      {showCurrentPassword
                        ? String(userData.currentPassword ?? "")
                        : maskPassword(userData.currentPassword, "•")}
                    </Text>

                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword((p) => !p)}
                      disabled={loading || overlayVisible}
                    >
                      <MaterialIcons
                        name={
                          showCurrentPassword ? "visibility" : "visibility-off"
                        }
                        size={18}
                        color={colors?.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalDivider} />
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors?.textSecondary}
                editable={!loading && !overlayVisible}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword((p) => !p)}
                disabled={loading || overlayVisible}
              >
                <MaterialIcons
                  name={showNewPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={colors?.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors?.textSecondary}
                editable={!loading && !overlayVisible}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((p) => !p)}
                disabled={loading || overlayVisible}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={colors?.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading || overlayVisible}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.submitButton,
                { backgroundColor: colors?.primary },
              ]}
              onPress={handleSubmit}
              disabled={loading || overlayVisible}
            >
              <Text style={styles.submitButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Success / Saving Overlay */}
          <Modal visible={overlayVisible} transparent animationType="fade">
            <View style={styles.successOverlay}>
              <View style={styles.successBox}>
                {successStep === "saving" ? (
                  <>
                    <ActivityIndicator size="large" color={colors?.primary} />
                    <Text style={styles.successText}>Updating password...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons
                      name="thumb-up" // ✅ thumb mark [web:50]
                      size={56}
                      color={colors?.primary}
                    />
                    <Text style={styles.successText}>
                      Password has been updated
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors?.background },

    header: {
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
      fontSize: isTablet ? 24 : 18,
      fontWeight: "bold",
      color: colors?.text,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    logoContainer: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },

    content: { flex: 1, padding: isTablet ? 24 : 16 },

    searchSection: { marginBottom: 24 },
    sectionTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: "bold",
      color: colors?.text,
      marginBottom: 12,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, fontSize: isTablet ? 18 : 16, color: colors?.text },

    searchButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors?.primary,
      paddingVertical: isTablet ? 16 : 14,
      borderRadius: 12,
      gap: 8,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.13,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    searchButtonText: {
      color: "#ffffff",
      fontSize: isTablet ? 18 : 16,
      fontWeight: "bold",
    },

    typeSelectionSection: { marginBottom: 24 },
    typeButtonsContainer: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
    typeButton: {
      flex: 1,
      minWidth: isTablet ? 200 : 150,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isTablet ? 32 : 28,
      paddingHorizontal: 16,
      borderRadius: 14,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.13,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      gap: 12,
    },
    typeButtonText: {
      color: colors?.text,
      fontSize: isTablet ? 18 : 16,
      fontWeight: "bold",
      textAlign: "center",
    },

    dataSection: { marginBottom: 24 },
    dataCard: {
      backgroundColor: colors?.cardBackground,
      borderRadius: 14,
      padding: isTablet ? 24 : 20,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.13,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      marginBottom: 14,
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      gap: 12,
    },
    cardTitle: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: "bold",
      color: colors?.text,
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      gap: 12,
    },
    infoLabel: {
      fontSize: isTablet ? 16 : 14,
      color: colors?.textSecondary,
      fontWeight: "600",
      minWidth: isTablet ? 120 : 100,
    },
    infoValue: {
      flex: 1,
      fontSize: isTablet ? 16 : 14,
      color: colors?.text,
      fontWeight: "500",
    },
    urlText: { color: colors?.primary, textDecorationLine: "underline" },

    divider: { height: 1, backgroundColor: colors?.border, marginVertical: 16 },

    passwordRow: { marginBottom: 16 },
    passwordLabelContainer: { marginBottom: 8 },
    passwordLabel: {
      fontSize: isTablet ? 16 : 14,
      color: colors?.textSecondary,
      fontWeight: "600",
    },
    passwordValueContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    passwordValue: {
      flex: 1,
      fontSize: isTablet ? 16 : 14,
      color: colors?.text,
      fontWeight: "500",
    },
    iconButton: { padding: 4 },

    changePasswordTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: "bold",
      color: colors?.text,
      marginBottom: 12,
    },
    changePasswordButtons: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    changePasswordBtn: {
      flex: 1,
      minWidth: isTablet ? 120 : 100,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isTablet ? 14 : 12,
      paddingHorizontal: isTablet ? 16 : 12,
      borderRadius: 10,
      gap: 6,
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    changePasswordBtnText: {
      color: "#ffffff",
      fontSize: isTablet ? 14 : 12,
      fontWeight: "bold",
    },

    fullWidthButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isTablet ? 16 : 14,
      borderRadius: 12,
      gap: 8,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.13,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    fullWidthButtonText: {
      color: "#ffffff",
      fontSize: isTablet ? 18 : 16,
      fontWeight: "bold",
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors?.cardBackground,
      borderRadius: 16,
      width: "100%",
      maxWidth: isTablet ? 600 : 400,
      maxHeight: "90%",
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border,
    },
    modalTitle: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: "bold",
      color: colors?.text,
      flex: 1,
    },
    modalBody: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      maxHeight: isTablet ? 500 : 400,
    },

    userInfoSection: { marginBottom: 16 },
    userInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    userInfoLabel: {
      fontSize: isTablet ? 14 : 12,
      color: colors?.textSecondary,
      fontWeight: "600",
    },
    userInfoValue: {
      fontSize: isTablet ? 14 : 12,
      color: colors?.text,
      fontWeight: "500",
    },
    modalDivider: {
      height: 1,
      backgroundColor: colors?.border,
      marginTop: 8,
      marginBottom: 8,
    },

    errorText: {
      color: "#ff4d4f",
      marginBottom: 8,
      fontSize: isTablet ? 14 : 12,
      fontWeight: "600",
    },

    inputLabel: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: "600",
      color: colors?.text,
      marginBottom: 8,
      marginTop: 12,
    },
    passwordInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors?.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors?.border,
    },
    passwordInput: {
      flex: 1,
      fontSize: isTablet ? 16 : 14,
      color: colors?.text,
      paddingVertical: 10,
    },

    modalFooter: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors?.border,
    },
    modalButton: {
      flex: 1,
      paddingVertical: isTablet ? 14 : 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    cancelButton: { backgroundColor: colors?.border },
    cancelButtonText: {
      color: colors?.text,
      fontSize: isTablet ? 16 : 14,
      fontWeight: "bold",
    },
    submitButton: { backgroundColor: colors?.primary },
    submitButtonText: {
      color: "#ffffff",
      fontSize: isTablet ? 16 : 14,
      fontWeight: "bold",
    },

    // ✅ overlay styles
    successOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    successBox: {
      width: "100%",
      maxWidth: 320,
      backgroundColor: colors?.cardBackground,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 16,
      alignItems: "center",
      gap: 12,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    successText: {
      color: colors?.text,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
  });
