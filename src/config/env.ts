import Constants from 'expo-constants';

// Type-safe environment configuration
interface AppConfig {
  clerk: {
    publishableKey: string;
  };
  convex: {
    url: string;
  };
  app: {
    name: string;
    version: string;
  };
}

function getConfig(): AppConfig {
  // In development, use process.env
  // In production, use expo-constants
  const isDev = __DEV__;

  const clerkKey = isDev
    ? process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
    : Constants.expoConfig?.extra?.clerkPublishableKey;

  const convexUrl = isDev
    ? process.env.EXPO_PUBLIC_CONVEX_URL
    : Constants.expoConfig?.extra?.convexUrl;

  if (!clerkKey) {
    throw new Error(
      'Clerk publishable key not found. Please check your environment configuration.'
    );
  }

  if (!convexUrl) {
    throw new Error(
      'Convex URL not found. Please check your environment configuration.'
    );
  }

  return {
    clerk: {
      publishableKey: clerkKey,
    },
    convex: {
      url: convexUrl,
    },
    app: {
      name: Constants.expoConfig?.name || 'Nafsy',
      version: Constants.expoConfig?.version || '1.0.0',
    },
  };
}

export const config = getConfig();
