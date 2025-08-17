// CRITICAL: RTL bootstrap MUST be imported first to prevent style caching issues
import '~/lib/rtl-bootstrap';
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
  // Load custom fonts
  const [fontsLoaded, fontError] = useFonts({
    'CrimsonPro-Regular': require('../../assets/fonts/CrimsonPro-Regular.ttf'),
    'CrimsonPro-Bold': require('../../assets/fonts/CrimsonPro-Bold.ttf'),
    'CrimsonPro-Italic': require('../../assets/fonts/CrimsonPro-Italic.ttf'),
    'CrimsonPro-VariableFont': require('../../assets/fonts/CrimsonPro-VariableFont_wght.ttf'),
    'CrimsonPro-Italic-VariableFont': require('../../assets/fonts/CrimsonPro-Italic-VariableFont_wght.ttf'),
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
