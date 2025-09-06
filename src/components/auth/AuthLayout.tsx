import React from 'react';
import { View, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text } from '~/components/ui/text';
import { useColors } from '~/hooks/useColors';

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
  const colors = useColors();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1 px-6 py-5">
            {/* Illustration - match Welcome screen */}
            <View className="w-full mb-2 items-center">
              <Image
                // Reuse the same illustration from the Welcome screen
                source={require('../../../assets/welcome Illustration..png')}
                style={{ width: '100%', height: 200, resizeMode: 'contain' }}
              />
            </View>

            {/* Title Section */}
            <View className="items-center mb-6">
              <Text
                style={{
                  // Unify with subtitle font for Arabic consistency
                  fontFamily: 'System',
                  fontWeight: '700',
                  fontSize: 28,
                  lineHeight: 34,
                  color: colors.foreground,
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                {title}
              </Text>
              <Text
                className="text-muted-foreground text-center"
                style={{ fontSize: 16, lineHeight: 22, paddingHorizontal: 4 }}
              >
                {subtitle}
              </Text>
            </View>

            {/* Main Content Area */}
            <View className="max-w-sm w-full mx-auto">{children}</View>

            {/* Footer */}
            {footerContent && (
              <View className="flex-row gap-2 justify-center mt-6">
                {footerContent}
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
