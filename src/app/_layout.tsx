import '../../global.css';
import 'expo-dev-client';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '~/providers/AppProviders';
import { SafeErrorBoundary } from '~/components/SafeErrorBoundary';
import { colorScheme } from 'nativewind';
import { Appearance } from 'react-native';

// Initialize with system color scheme
colorScheme.set(Appearance.getColorScheme() || 'light');

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Navigation stack - expo-router provides NavigationContainer automatically
function NavigationStack() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="chat-history" options={{ headerShown: false }} />
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
