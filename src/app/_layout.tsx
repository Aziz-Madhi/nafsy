import '../../global.css';
import 'expo-dev-client';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '~/providers/AppProviders';
import { SafeErrorBoundary } from '~/components/SafeErrorBoundary';
import {
  markAppStart,
  markFirstRender,
  markInteractive,
  recordMemory,
} from '~/lib/performance-monitor';

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
  // Mark app start for performance monitoring
  React.useEffect(() => {
    markAppStart();
    recordMemory('app_start');

    // Mark first render
    setTimeout(markFirstRender, 0);

    // Mark interactive after brief delay
    setTimeout(() => {
      markInteractive();
      recordMemory('app_interactive');
    }, 1000);
  }, []);

  return (
    <AppProviders>
      <SafeErrorBoundary>
        <NavigationStack />
      </SafeErrorBoundary>
    </AppProviders>
  );
}
