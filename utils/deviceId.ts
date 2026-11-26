import * as Application from "expo-application";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "app_device_id";
const FIXED_DESKTOP_DEVICE_ID = "ed375cd3-0a49-48ca-892b-4dcf";

export async function getDeviceId(): Promise<string> {
  try {
    // Desktop / Web: Return the fixed device ID
    if (
      Platform.OS === "web" ||
      Platform.OS === "windows" ||
      Platform.OS === "macos"
    ) {
      // console.log("Desktop/Web Device ID:", FIXED_DESKTOP_DEVICE_ID);
      return FIXED_DESKTOP_DEVICE_ID;
    }

    // Android: use actual ANDROID_ID
    if (Platform.OS === "android") {
      const androidId = Application.getAndroidId();

      if (androidId && androidId.trim().length > 0) {
        console.log("Android Device ID:", androidId);
        return androidId;
      }
    }

    // iOS and other fallback mobile environments:
    // Store our own installation-specific ID securely.
    return await getOrCreateFallbackId();
  } catch (error) {
    console.error("Failed to get device ID:", error);

    return await getOrCreateFallbackId();
  }
}

async function getOrCreateFallbackId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (existing) {
      console.log("Existing fallback device ID:", existing);
      return existing;
    }

    const generated = uuidv4();

    await SecureStore.setItemAsync(DEVICE_ID_KEY, generated);

    console.log("Generated fallback device ID:", generated);

    return generated;
  } catch (error) {
    console.error("SecureStore device ID error:", error);

    // Last-resort ID.
    return uuidv4();
  }
}

export async function getDeviceMeta() {
  const deviceId = await getDeviceId();

  const brand = Device.brand || Device.manufacturer || "Unknown";

  const model = Device.modelName || Device.deviceName || "Device";

  const deviceLabel = `${brand} ${model}`;

  const meta = {
    deviceId,
    platform: Platform.OS,
    deviceLabel,
  };

  console.log("Device Meta:", meta);

  return meta;
}
