import React, { useEffect, useState } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';
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
import { Text } from '~/components/ui/text';
import { useRef } from 'react';

export default function AppLayout() {
  const colors = useColors();
  const { isSignedIn, isLoaded } = useAuth();
  const currentUser = useCurrentUser();
  const { user: clerkUser } = useUserSafe();
  const upsertUser = useMutation(api.auth.upsertUser);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const lastUpsertClerkIdRef = useRef<string | null>(null);
  const lastUpsertAtRef = useRef<number>(0);

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

    // Create/update user if doesn't exist or needs update
    const createOrUpdateUser = async (
      opts?: { markOnboardingPending?: boolean }
    ): Promise<boolean> => {
      if (clerkUser?.id && !isCreatingUser) {
        // Debounce duplicate attempts for the same user id
        const now = Date.now();
        if (
          lastUpsertClerkIdRef.current === clerkUser.id &&
          now - lastUpsertAtRef.current < 15000 // 15s window
        ) {
          return false;
        }
        lastUpsertClerkIdRef.current = clerkUser.id;
        lastUpsertAtRef.current = now;
        setIsCreatingUser(true);
        try {
          await upsertUser({
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.firstName || undefined,
            avatarUrl: clerkUser.imageUrl || undefined,
            ...(opts?.markOnboardingPending ? { onboardingCompleted: false } : {}),
          } as any);
        } catch (error) {
          console.error('Failed to upsert user:', error);
        } finally {
          setIsCreatingUser(false);
        }
        return true;
      }
      return false;
    };

    // If current user is null (not found in Convex), create it
    if (currentUser === null) {
      // Kick off creation; keep UI blocked until user doc exists
      (async () => {
        await createOrUpdateUser({ markOnboardingPending: true });
      })();
    }
    // Also update if Clerk user data has changed
    else if (currentUser && clerkUser?.id) {
      const clerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress || '';
      const clerkName = clerkUser.fullName || clerkUser.firstName || '';
      const clerkAvatar = clerkUser.imageUrl || '';

      // Check if any data has changed
      if (
        currentUser.email !== clerkEmail ||
        currentUser.name !== clerkName ||
        currentUser.avatarUrl !== clerkAvatar
      ) {
        createOrUpdateUser();
      }
    }
  }, [
    isSignedIn,
    isLoaded,
    currentUser,
    clerkUser?.id,
    clerkUser?.emailAddresses,
    clerkUser?.fullName,
    clerkUser?.firstName,
    clerkUser?.imageUrl,
    upsertUser,
  ]);

  // Show loading while auth is being determined
  if (!isLoaded) {
    return null;
  }

  // While currentUser is undefined, the Convex query is still loading.
  // Do NOT render the app content yet to avoid flashing protected screens.
  if (isSignedIn && currentUser === undefined) {
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
        <Text className="text-muted-foreground mt-4">Loading your account…</Text>
      </View>
    );
  }

  // Redirect to auth if not signed in (extra security layer)
  if (!isSignedIn) {
    return <Redirect href="/welcome" />;
  }

  // If user exists but hasn't completed onboarding, send to onboarding flow
  if (currentUser && (currentUser as any).onboardingCompleted === false) {
    return <Redirect href="/onboarding/profile" />;
  }

  // Show loading while creating user in database or while user doc is absent
  // Security: Do not render app content if the Convex user record doesn't exist yet
  if (isCreatingUser || (isSignedIn && currentUser === null && clerkUser?.id)) {
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
        <Text className="text-muted-foreground mt-4">
          Setting up your account...
        </Text>
      </View>
    );
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
