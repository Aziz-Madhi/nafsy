// CRITICAL: RTL bootstrap MUST be imported first to prevent style caching issues
import '~/lib/rtl-bootstrap';
import '../polyfills';
import '../../global.css';
import '~/lib/theme-bootstrap';
import 'expo-dev-client';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { useAuth } from '@clerk/clerk-expo';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '~/providers/AppProviders';
import { SafeErrorBoundary } from '~/components/SafeErrorBoundary';
import { useCurrentTheme } from '~/store/useAppStore';
import { useColors } from '~/hooks/useColors';
import { Text } from '~/components/ui/text';
import { useTranslation } from '~/hooks/useTranslation';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Splash screen component
function Splash() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text variant="body" className="text-muted-foreground mt-4">
        {t('common.loading')}
      </Text>
    </View>
  );
}

// Auth-aware navigation component (inside providers)
function AuthAwareNavigation({ fontsReady }: { fontsReady: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const currentTheme = useCurrentTheme();

  // Show splash while auth or fonts are loading
  if (!isLoaded || !fontsReady) {
    return <Splash />;
  }

  // Debug logging only in dev mode
  if (__DEV__) {
    console.log('🔐 Auth state:', { isLoaded, isSignedIn });
  }

  return (
    <SafeErrorBoundary>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

      {/* Use a stable Stack and pick initial route based on auth */}
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName={isSignedIn ? '(app)' : 'auth'}
      >
        <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(app)" />
      </Stack>
    </SafeErrorBoundary>
  );
}

export default function RootLayout() {
  // Load AveriaSerif fonts for English content and Arabic fonts for multilingual support
  const [fontsLoaded, fontError] = useFonts({
    // Arabic font support - RubikArabic family
    'RubikArabic-Light': require('../../assets/fonts/RubikArabic/Rubik-Light.ttf'),
    'RubikArabic-Regular': require('../../assets/fonts/RubikArabic/Rubik-Regular.ttf'),
    'RubikArabic-Medium': require('../../assets/fonts/RubikArabic/Rubik-Medium.ttf'),
    'RubikArabic-SemiBold': require('../../assets/fonts/RubikArabic/Rubik-SemiBold.ttf'),
    'RubikArabic-Bold': require('../../assets/fonts/RubikArabic/Rubik-Bold.ttf'),

    // AveriaSerif font family - base variants
    'AveriaSerif-Light': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Light.ttf'),
    'AveriaSerif-Regular': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Regular.ttf'),
    'AveriaSerif-Bold': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Bold.ttf'),

    // AveriaSerif font family - backward compatibility with Inter naming
    'Inter-Light': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Light.ttf'),
    'Inter-Regular': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Regular.ttf'), // No medium, use regular
    'Inter-SemiBold': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Bold.ttf'), // Map to bold for distinction
    'Inter-Bold': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Bold.ttf'),

    // AveriaSerif font family - 24pt variants (same files, different names for compatibility)
    'Inter-Regular-24pt': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Regular.ttf'),
    'Inter-SemiBold-24pt': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Bold.ttf'),
    'Inter-Bold-24pt': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Bold.ttf'),

    // AveriaSerif font family - 28pt variants (same files, different names for compatibility)
    'Inter-Bold-28pt': require('../../assets/fonts/AveriaSerif/AveriaSerifLibre-Bold.ttf'),
  });

  // Handle font loading completion
  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const fontsReady = !!(fontsLoaded || fontError);

  return (
    <AppProviders>
      <AuthAwareNavigation fontsReady={fontsReady} />
    </AppProviders>
  );
}
