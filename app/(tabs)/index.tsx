// app / (tabs) / index.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";

import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CustomHeader from "../../components/CustomHeader";
import { getIconColor } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function HomeScreen() {
  const router = useRouter();

  const { colors } = useTheme();

  const { status, menuAccess, needsOrgSelection, orgAccess, changeOrg } =
    useAuth();

  const styles = createStyles(colors);

  /*
   * This page is already /(tabs).
   *
   * NEVER redirect authenticated
   * users back to /(tabs) from here.
   *
   * That was causing the infinite loop.
   */
  useEffect(() => {
    console.log("HomeScreen Auth State:", {
      status,
      needsOrgSelection,
      menuCount: menuAccess.length,
      menus: menuAccess,
    });

    /*
     * Device check still running.
     */
    if (status === "checking") {
      return;
    }

    /*
     * Not logged in / device
     * not registered.
     */
    if (status === "unauthenticated") {
      router.replace("/(auth)/login");

      return;
    }

    /*
     * Device/user authenticated
     * but has multiple organizations.
     */
    if (status === "authenticated" && needsOrgSelection) {
      router.replace("/(auth)/select-org");

      return;
    }

    /*
     * IMPORTANT:
     *
     * No:
     *
     * router.replace("/(tabs)")
     *
     * here.
     *
     * We are already inside /(tabs).
     */
  }, [status, needsOrgSelection]);

  const goToOrgSelection = useCallback(() => {
    if (orgAccess.length > 1) {
      changeOrg();
      router.replace("/(auth)/select-org");
      return true;
    }

    return false;
  }, [orgAccess.length, changeOrg, router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        goToOrgSelection,
      );

      return () => subscription.remove();
    }, [goToOrgSelection]),
  );

  /*
   * Show loader while device
   * authentication is checked.
   */
  if (status === "checking") {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor: colors?.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color="#2563eb" />

        <Text style={styles.loadingText}>Checking access...</Text>
      </View>
    );
  }

  /*
   * Navigation effect will move
   * unauthenticated users away.
   */
  if (status === "unauthenticated") {
    return null;
  }

  /*
   * Navigation effect will move
   * user to organization screen.
   */
  if (needsOrgSelection) {
    return null;
  }

  const renderCard = (item: (typeof menuAccess)[number], index: number) => {
    const iconColor = getIconColor(index);

    return (
      <TouchableOpacity
        key={item.menuId}
        style={styles.menuItem}
        activeOpacity={0.7}
        onPress={() => {
          console.log("Opening menu:", {
            key: item.key,
            title: item.title,
            route: item.route,
          });

          router.push(item.route as any);
        }}
      >
        <View style={styles.contentWrapper}>
          <MaterialIcons
            name={item.icon as any}
            size={26}
            color={iconColor}
            style={styles.icon}
          />

          <Text
            style={[
              styles.menuText,
              {
                color: colors?.text,
              },
            ]}
          >
            {item.title}
          </Text>

          <MaterialIcons
            name="chevron-right"
            size={24}
            color="#64748b"
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors?.background,
        },
      ]}
    >
      <CustomHeader showBackButton={false} isHomeScreen={true} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuAccess.length > 0 ? (
          <View style={styles.menuContainer}>
            {menuAccess.map((item, index) => renderCard(item, index))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="block" size={44} color="#94a3b8" />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors?.text,
                },
              ]}
            >
              No Menu Access
            </Text>

            <Text style={styles.emptyText}>
              You currently don't have access to any menu. Please contact your
              administrator.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 12,
      color: "#64748b",
      fontSize: 14,
    },

    scrollContainer: {
      flex: 1,
    },

    scrollContent: {
      paddingBottom: 20,
      flexGrow: 1,
    },

    menuContainer: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },

    menuItem: {
      backgroundColor: colors?.cardBackground,

      borderRadius: 12,

      marginBottom: 10,

      elevation: 8,

      shadowColor: "#3b3b3b",

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.5,

      shadowRadius: 8,
    },

    contentWrapper: {
      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 18,

      paddingVertical: 16,

      minHeight: 64,
    },

    icon: {
      marginRight: 16,
    },

    menuText: {
      flex: 1,

      fontSize: 14,

      fontWeight: "500",

      lineHeight: 22,
    },

    chevron: {
      opacity: 0.6,
    },

    emptyContainer: {
      flex: 1,

      justifyContent: "center",

      alignItems: "center",

      paddingHorizontal: 30,

      paddingVertical: 60,
    },

    emptyTitle: {
      fontSize: 18,

      fontWeight: "600",

      marginTop: 14,
    },

    emptyText: {
      fontSize: 14,

      color: "#64748b",

      textAlign: "center",

      lineHeight: 21,

      marginTop: 8,
    },
  });
