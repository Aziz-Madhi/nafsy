import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text } from '~/components/ui/text';
import { AppLogo } from './AppLogo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footerContent,
}: AuthLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8 justify-center">
          {/* Logo Section */}
          <View className="items-center mb-8">
            <AppLogo size="large" />
          </View>

          {/* Title Section */}
          <View className="gap-2 items-center mb-10">
            <Text className="text-3xl font-bold text-foreground text-center">
              {title}
            </Text>
            <Text className="text-muted-foreground text-center text-base leading-relaxed px-4">
              {subtitle}
            </Text>
          </View>

          {/* Main Content Area */}
          <View className="max-w-sm w-full mx-auto">{children}</View>

          {/* Footer */}
          {footerContent && (
            <View className="flex-row gap-2 justify-center mt-12">
              {footerContent}
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
