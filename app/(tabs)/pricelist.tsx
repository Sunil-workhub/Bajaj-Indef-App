// screens/priceListScreen.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

export default function PriceListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string>("");
  const webViewRef = useRef<WebView>(null);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  // PDF Configuration
  const PDF_URL = `https://ecom.indef.com/download/PriceList.pdf`;

  const initializePdf = useCallback(() => {
    setLoading(true);

    let finalUrl = "";

    if (Platform.OS === "ios") {
      // iOS WebView displays PDF natively perfectly
      finalUrl = PDF_URL;
    } else {
      // Android & Web: Use Google Viewer to force INLINE display
      // instead of downloading or using the brittle PDF.js github link
      finalUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(PDF_URL)}`;
    }

    console.log("Loading PDF via:", finalUrl);
    setPdfViewerUrl(finalUrl);

    // Small delay for UI smoothness
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [PDF_URL]);

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/(tabs)/" as any);
    }
  }, [navigation, router]);

  const handleRefresh = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      initializePdf();
    }, [initializePdf])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: Platform.OS !== "web", // Native driver only for mobile
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors?.text || "#fff"}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Price List</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
          >
            <MaterialIcons
              name="refresh"
              size={24}
              color={colors?.text || "#fff"}
            />
          </TouchableOpacity>
        </View>

        {/* Integrated Viewer */}
        <View style={styles.viewerContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: pdfViewerUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true} // Critical for PDF scaling
            mixedContentMode="always"
            onLoadEnd={() => setLoading(false)}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <LoadingSpinner message="Opening Price List..." />
              </View>
            )}
            // Standard UserAgent to prevent "Unsupported Browser" errors
            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          />
        </View>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors?.cardBackground || "#222",
      paddingHorizontal: 16,
      height: 60,
      elevation: 4,
    },
    backButton: { padding: 8 },
    headerTitle: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: "bold",
      color: colors?.text || "#fff",
      flex: 1,
      textAlign: "center",
    },
    refreshButton: { padding: 8 },
    viewerContainer: {
      flex: 1,
      backgroundColor: "#fff",
    },
    webview: {
      flex: 1,
    },
    webviewLoading: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors?.background,
      zIndex: 1,
    },
  });
