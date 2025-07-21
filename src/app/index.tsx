import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { Text } from '~/components/ui/text';

export default function Index() {
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      // Use requestAnimationFrame to ensure navigation happens after render
      requestAnimationFrame(() => {
        if (isSignedIn && user) {
          router.replace('/tabs/chat');
        } else {
          router.replace('/auth/sign-in');
        }
      });
    }
  }, [isLoaded, isSignedIn, user]);

  // Always show loading state
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <ActivityIndicator size="large" className="text-primary mb-4" />
      <Text variant="body" className="text-muted-foreground">
        {!isLoaded ? 'Initializing...' : 'Loading...'}
      </Text>
    </View>
  );
}
