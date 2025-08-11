import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Nafsy',
  slug: 'nafsy',
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
          './assets/fonts/CrimsonPro-Regular.ttf',
          './assets/fonts/CrimsonPro-Bold.ttf',
          './assets/fonts/CrimsonPro-Italic.ttf',
          './assets/fonts/CrimsonPro-VariableFont_wght.ttf',
          './assets/fonts/CrimsonPro-Italic-VariableFont_wght.ttf',
        ],
      },
    ],
  ],
  assetBundlePatterns: ['assets/fonts/*'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Environment variables for production builds
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
  },
});
