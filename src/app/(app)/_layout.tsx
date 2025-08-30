import React, { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useColors } from '~/hooks/useColors';
import { OfflineIndicator } from '~/components/ui/OfflineIndicator';
import {
  initializeOfflineData,
  cleanupOfflineData,
} from '~/hooks/useOfflineData';
import { useCurrentUser } from '~/hooks/useSharedData';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AppLayout() {
  const colors = useColors();
  const { isSignedIn, isLoaded } = useAuth();
  const currentUser = useCurrentUser();
  const { user: clerkUser } = useUserSafe();
  const upsertUser = useMutation(api.auth.upsertUser);

  // Initialize offline data system
  useEffect(() => {
    if (currentUser?._id) {
      initializeOfflineData(currentUser._id);
    }

    // Cleanup on unmount
    return () => {
      cleanupOfflineData();
    };
  }, [currentUser?._id]);

  // Ensure Convex user doc exists once signed in
  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;
    // If query returned null, create/update user once
    if (currentUser === null && clerkUser?.id) {
      upsertUser({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || undefined,
        avatarUrl: clerkUser.imageUrl || undefined,
      }).catch(() => {});
    }
  }, [isSignedIn, isLoaded, currentUser, clerkUser?.id]);

  // Show loading while auth is being determined
  if (!isLoaded) {
    return null;
  }

  // Redirect to auth if not signed in (extra security layer)
  if (!isSignedIn) {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
    <>
      <OfflineIndicator />
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
        <Stack.Screen
          name="crisis-resources"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="feedback" options={{ headerShown: false }} />
        <Stack.Screen name="help-center" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
