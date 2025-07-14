import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { Text } from '~/components/ui/text';

export default function Index() {
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Add a small delay before redirecting to ensure Clerk is fully initialized
    if (isLoaded) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Show loading state while authentication status is being determined
  if (!isLoaded || !shouldRedirect) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" className="text-primary mb-4" />
        <Text variant="body" className="text-muted-foreground">
          {!isLoaded ? 'Initializing...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Redirect to appropriate route based on authentication status
  if (isSignedIn && user) {
    return <Redirect href="/tabs/chat" />;
  } else {
    return <Redirect href="/auth/sign-in" />;
  }
}