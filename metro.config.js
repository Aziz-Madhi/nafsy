const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for WASM files (required for Skia web support)
config.resolver.assetExts.push('wasm');

// Support importing SVGs as React components via react-native-svg-transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg'
);
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

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
  input: './global.css',
  cssInteropEnabled: true, // Enable CSS interop for better hot reload
});
