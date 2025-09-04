import React from 'react';
import { Stack, Redirect, usePathname } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const isOAuthCallback = pathname?.startsWith('/auth/oauth-callback');

  if (!isLoaded) return null;
  // Allow the OAuth callback screen to render even when signed in,
  // so it can finish Convex user creation reliably.
  if (isSignedIn && !isOAuthCallback) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // Prevent backing into empty tree
      }}
      initialRouteName="sign-in"
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="oauth-callback" />
    </Stack>
  );
}
