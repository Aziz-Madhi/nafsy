import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useColors } from '~/hooks/useColors';

export default function AppLayout() {
  const colors = useColors();
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while auth is being determined
  if (!isLoaded) {
    return null;
  }

  // Redirect to auth if not signed in (extra security layer)
  if (!isSignedIn) {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
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
      <Stack.Screen name="crisis-resources" options={{ headerShown: false }} />
      <Stack.Screen name="feedback" options={{ headerShown: false }} />
      <Stack.Screen name="help-center" options={{ headerShown: false }} />
    </Stack>
  );
}
