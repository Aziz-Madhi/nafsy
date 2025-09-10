import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Nafsy',
  slug: 'naf',
  owner: 'azizred',
  scheme: 'nafsy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.nafsy.app',
    // deploymentTarget: '18.0', // Removed as it's not a valid iOS config property
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    package: 'com.nafsy.app',
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-font',
      {
        fonts: [
          // AveriaSerif font family
          './assets/fonts/AveriaSerif/AveriaSerifLibre-Light.ttf',
          './assets/fonts/AveriaSerif/AveriaSerifLibre-Regular.ttf',
          './assets/fonts/AveriaSerif/AveriaSerifLibre-Bold.ttf',
          './assets/fonts/AveriaSerif/AveriaSerifLibre-Italic.ttf',
          './assets/fonts/AveriaSerif/AveriaSerifLibre-LightItalic.ttf',
          './assets/fonts/AveriaSerif/AveriaSerifLibre-BoldItalic.ttf',
          // Arabic font support - RubikArabic family
          './assets/fonts/RubikArabic/Rubik-Regular.ttf',
          './assets/fonts/RubikArabic/Rubik-Bold.ttf',
          './assets/fonts/RubikArabic/Rubik-Medium.ttf',
          './assets/fonts/RubikArabic/Rubik-SemiBold.ttf',
          './assets/fonts/RubikArabic/Rubik-Light.ttf',
        ],
      },
    ],
    'expo-localization',
    'expo-updates',
    'expo-sqlite',
    'expo-audio',
  ],
  updates: {
    fallbackToCacheTimeout: 0,
    checkAutomatically: 'ON_ERROR_RECOVERY',
    enabled: true,
  },
  runtimeVersion: '1.0.0',
  assetBundlePatterns: ['assets/fonts/*'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Environment variables for production builds
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
    eas: {
      projectId: '5d6b098c-1f34-4e04-b6c3-64efd9f9af74',
    },
  },
});
