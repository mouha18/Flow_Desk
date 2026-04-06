const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude expo-sqlite web worker from bundling since it requires WASM
config.resolver.blockList = [
  /node_modules\/expo-sqlite\/web\/.*/,
];

module.exports = config;
