const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for WASM files (required for Skia web support)
config.resolver.assetExts.push('wasm');

// Add support for TypeScript
config.resolver.sourceExts.push('ts', 'tsx');

// Configure path aliases
config.resolver.alias = {
  '~': path.resolve(__dirname, 'src'),
};

// Suppress Reanimated plugin warnings more effectively
if (process.env.NODE_ENV === 'development') {
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('react-native-worklets/plugin') ||
      message.includes('Seems like you are using a Babel plugin')
    ) {
      return; // Suppress these specific warnings
    }
    originalConsoleWarn(...args);
  };
  
  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('[Reanimated]') && message.includes('worklets')) {
      return; // Suppress Reanimated worklets logs too
    }
    originalConsoleLog(...args);
  };
}

module.exports = withNativeWind(config, {
  input: './global.css'
});