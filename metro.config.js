// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("pdf");

// Alias react-native-vector-icons to Expo’s @expo/vector-icons
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "react-native-vector-icons": path.resolve(
    __dirname,
    "node_modules/@expo/vector-icons"
  ),
};

module.exports = config;
