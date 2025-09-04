import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { AppLogo } from './AppLogo';
import { useColors } from '~/hooks/useColors';

export function OAuthLoadingScreen() {
  const colors = useColors();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-8 px-6">
        <AppLogo size="large" />

        <View className="items-center gap-4">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-foreground text-lg font-semibold">
            Setting up your account...
          </Text>
          <Text className="text-muted-foreground text-center">
            This will only take a moment
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
