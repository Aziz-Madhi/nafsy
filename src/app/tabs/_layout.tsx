import React, { useEffect } from 'react';
import { Slot, router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { CustomBottomNavigation } from '~/components/navigation/CustomBottomNavigation';

export default function TabsLayout() {
  // Centralized auth guard - prevents hook order issues in individual screens
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();

  // Redirect on auth state change - prevents hook execution during transitions
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Use replace to prevent navigation stack issues
      router.replace('/auth/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // All tabs now load upfront for instant switching performance
  // No preloading needed - tabs load directly when app starts

  // Show loading until auth is resolved
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text variant="body" className="text-muted-foreground mt-4">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render tabs if not authenticated - redirect will happen in useEffect
  if (!isSignedIn || !user) {
    return null;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Tab content area */}
      <Slot />

      {/* Custom bottom navigation */}
      <CustomBottomNavigation />
    </View>
  );
}
