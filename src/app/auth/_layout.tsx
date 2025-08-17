import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (isSignedIn) {
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
    </Stack>
  );
}
