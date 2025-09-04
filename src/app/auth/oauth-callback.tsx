import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { OAuthLoadingScreen } from '~/components/auth/OAuthLoadingScreen';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const upsertUser = useMutation(api.auth.upsertUser);
  const [isCreating, setIsCreating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Query for the current user to verify they exist in Convex
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    clerkUser?.id && !isCreating ? {} : 'skip'
  );

  useEffect(() => {
    const createUserAndRedirect = async () => {
      // Wait for Clerk to be loaded and user to be available
      if (!clerkLoaded || !clerkUser?.id) {
        // Retry a few times if Clerk user is not ready yet
        if (retryCount < 10) {
          setTimeout(() => setRetryCount((prev) => prev + 1), 500);
        } else {
          // After 5 seconds, redirect to sign-in if user still not available
          console.error('Clerk user not available after retries');
          router.replace('/auth/sign-in');
        }
        return;
      }

      // If user already exists in Convex, redirect immediately
      if (currentUser) {
        router.replace('/tabs/chat');
        return;
      }

      // Create user in Convex if they don't exist
      if (!isCreating && currentUser === null) {
        setIsCreating(true);

        try {
          // Create/update user in Convex
          await upsertUser({
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.firstName || undefined,
            avatarUrl: clerkUser.imageUrl || undefined,
          });

          // Wait a moment for the user to be created and indexed
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Navigate to the main app
          router.replace('/tabs/chat');
        } catch (error) {
          console.error('Failed to create user in Convex:', error);

          // Try to proceed anyway - the AppLayout will handle retry
          router.replace('/tabs/chat');
        } finally {
          setIsCreating(false);
        }
      }
    };

    createUserAndRedirect();
  }, [
    clerkLoaded,
    clerkUser,
    currentUser,
    isCreating,
    retryCount,
    upsertUser,
    router,
  ]);

  return <OAuthLoadingScreen />;
}
