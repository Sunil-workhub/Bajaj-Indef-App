import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

interface CustomHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: string;
  isHomeScreen?: boolean;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightIcon = "more-vert",
  isHomeScreen = false,
}) => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { colors } = useTheme();

  const { selectedOrg, orgAccess, changeOrg } = useAuth();

  /*
   * Organization switching is available only
   * when the user has access to multiple organizations.
   */
  const canChangeOrganization = orgAccess.length > 1;

  /*
   * Display current organization name.
   */
  const currentOrgName = selectedOrg?.name || selectedOrg?.code || "";

  /*
   * HOME SCREEN:
   * Navigate to organization selection.
   *
   * Clear only the selected organization.
   * Keep the user authenticated.
   */
  const handleHomeBackPress = () => {
    if (!canChangeOrganization) {
      return;
    }

    changeOrg();

    router.replace("/(auth)/select-org");
  };

  /*
   * NORMAL SCREEN:
   * Preserve existing back navigation.
   */
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    router.replace("/(tabs)" as any);
  };

  const dynamicHeaderHeight = Math.max(60, 44 + insets.top);

  /*
   * ============================
   * HOME SCREEN HEADER
   * ============================
   */
  if (isHomeScreen) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
          translucent={false}
        />

        <View
          style={[
            styles.homeHeaderContainer,
            {
              backgroundColor: colors.background,
              height: dynamicHeaderHeight,
              paddingTop:
                Platform.OS === "ios" ? Math.max(8, insets.top / 2) : 8,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.homeContentContainer}>
            {/* LEFT SIDE */}

            <View style={styles.homeLeftSection}>
              {canChangeOrganization && (
                <TouchableOpacity
                  onPress={handleHomeBackPress}
                  style={styles.homeBackButton}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Change organization"
                  hitSlop={{
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10,
                  }}
                >
                  <MaterialIcons
                    name="arrow-back"
                    size={23}
                    color={colors.text}
                  />
                </TouchableOpacity>
              )}

              <Image
                source={require("../assets/images/indef1.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* RIGHT SIDE - ORGANIZATION */}

            <TouchableOpacity
              style={styles.homeRightSection}
              onPress={handleHomeBackPress}
              disabled={!canChangeOrganization}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Select organization"
            >
              {currentOrgName ? (
                <>
                  <MaterialIcons
                    name="business"
                    size={18}
                    color="#64748b"
                    style={styles.orgIcon}
                  />

                  <View style={styles.orgTextContainer}>
                    <Text style={styles.orgLabel}>Organization</Text>

                    <Text
                      style={[
                        styles.orgName,
                        {
                          color: colors.text,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {currentOrgName}
                    </Text>
                  </View>

                  {canChangeOrganization && (
                    <MaterialIcons
                      name="keyboard-arrow-down"
                      size={20}
                      color={colors.text}
                      style={styles.orgDropdownIcon}
                    />
                  )}
                </>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  /*
   * ============================
   * NORMAL SCREEN HEADER
   * ============================
   */
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.surface}
        translucent={false}
      />

      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            height: Math.max(
              56,
              44 + (Platform.OS === "android" ? 0 : insets.top),
            ),
            paddingTop: Platform.OS === "ios" ? Math.max(8, insets.top / 2) : 8,
          },
        ]}
      >
        <View style={styles.headerContentContainer}>
          {/* LEFT SECTION */}

          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10,
                }}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* CENTER SECTION */}

          <View style={styles.centerSection}>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>

          {/* RIGHT SECTION */}

          <View style={styles.rightSection}>
            <View style={styles.iconButton}>
              <MaterialIcons
                name={rightIcon as any}
                size={24}
                color={colors.text}
              />
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  /*
   * ============================
   * HOME HEADER
   * ============================
   */

  homeHeaderContainer: {
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },

  homeContentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  homeLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  homeBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  logo: {
    width: 42,
    height: 42,
  },

  /*
   * Organization section
   */

  homeRightSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginLeft: 14,
  },

  orgIcon: {
    marginRight: 7,
  },

  orgTextContainer: {
    flexShrink: 1,
    alignItems: "flex-end",
  },

  orgLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 1,
  },

  orgName: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 190,
    textAlign: "right",
  },

  orgDropdownIcon: {
    marginLeft: 4,
  },

  /*
   * ============================
   * NORMAL HEADER
   * ============================
   */

  headerContainer: {
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 1000,
  },

  headerContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    flex: 1,
  },

  leftSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  centerSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  rightSection: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  backButton: {
    padding: 8,
    borderRadius: 20,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
});

export default CustomHeader;
