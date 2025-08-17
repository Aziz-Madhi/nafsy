// CRITICAL: RTL bootstrap MUST be imported first to prevent style caching issues
import '~/lib/rtl-bootstrap';
import '../../global.css';
import '~/lib/theme-bootstrap';
import 'expo-dev-client';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '~/providers/AppProviders';
import { SafeErrorBoundary } from '~/components/SafeErrorBoundary';
import { useCurrentTheme } from '~/store/useAppStore';
import { useColors } from '~/hooks/useColors';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Navigation stack - expo-router provides NavigationContainer automatically
function NavigationStack() {
  const currentTheme = useCurrentTheme();
  const colors = useColors();
  // RTL layout is now handled at app startup in i18n.ts - no runtime switching

  return (
    <>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="chat-history" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
          }}
        />
      </Stack>
    </>
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

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <SafeErrorBoundary>
        <NavigationStack />
      </SafeErrorBoundary>
    </AppProviders>
  );
}
