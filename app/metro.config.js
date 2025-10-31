const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite on web
config.resolver.assetExts.push('wasm');

// Ensure WASM files are treated as assets
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'wasm');

module.exports = withNativeWind(config, { input: './global.css' });
