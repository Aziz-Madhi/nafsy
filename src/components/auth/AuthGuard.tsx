import React, { useEffect, ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { Text } from '~/components/ui/text';
import { useTranslation } from '~/hooks/useTranslation';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Simple authentication guard component
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { t } = useTranslation();
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();

  // Handle authentication redirects
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/auth/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Show loading while auth is resolving
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text variant="body" className="text-muted-foreground mt-4">
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render if not authenticated
  if (!isSignedIn || !user) {
    return null;
  }

  return <>{children}</>;
}
