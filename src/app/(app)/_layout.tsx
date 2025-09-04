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

export default function AppLayout() {
  const colors = useColors();
  const { isSignedIn, isLoaded } = useAuth();
  const currentUser = useCurrentUser();
  const { user: clerkUser } = useUserSafe();
  const upsertUser = useMutation(api.auth.upsertUser);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

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
    const createOrUpdateUser = async () => {
      if (clerkUser?.id && !isCreatingUser) {
        setIsCreatingUser(true);
        try {
          await upsertUser({
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.firstName || undefined,
            avatarUrl: clerkUser.imageUrl || undefined,
          });
        } catch (error) {
          console.error('Failed to upsert user:', error);
        } finally {
          setIsCreatingUser(false);
        }
      }
    };

    // If current user is null (not found in Convex), create it
    if (currentUser === null) {
      createOrUpdateUser();
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

  // Redirect to auth if not signed in (extra security layer)
  if (!isSignedIn) {
    return <Redirect href="/auth/sign-in" />;
  }

  // Show loading while creating user in database
  // This should rarely happen now since OAuth callback handles user creation
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
