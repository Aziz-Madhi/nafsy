import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useTranslation } from '~/hooks/useTranslation';
import { useSocialAuth, useWarmUpBrowser } from '~/hooks/useSocialAuth';
import { GoogleIcon } from './GoogleIcon';
import { SymbolView } from 'expo-symbols';

interface SocialAuthButtonsProps {
  showDivider?: boolean;
}

export function SocialAuthButtons({ showDivider = true }: SocialAuthButtonsProps) {
  const { t } = useTranslation();
  useWarmUpBrowser();
  const { handleSocialAuth, loading } = useSocialAuth();

  return (
    <View className="gap-4">
      {/* Social Auth Buttons */}
      <View className="gap-3">
        {/* Google Button (Aligned layout) */}
        <Button
          variant="ghost"
          size="lg"
          onPress={() => handleSocialAuth('oauth_google')}
          disabled={loading}
          className="h-12 rounded-2xl overflow-hidden self-center w-9/12 p-0 bg-white web:bg-white"
          accessibilityLabel={t('auth.continueWithGoogle')}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
            borderRadius: 16,
          }}
        >
          <View className="w-full h-full flex-row items-center justify-center px-5">
            <View className="absolute left-4">
              {loading ? (
                <ActivityIndicator size="small" />
              ) : (
                <GoogleIcon size={22} />
              )}
            </View>
            <Text className="text-foreground text-base font-semibold">
              {t('auth.continueWithGoogle')}
            </Text>
          </View>
        </Button>

        {/* Apple SFG Button - Only iOS */}
        {Platform.OS === 'ios' && (
          <Button
            variant="ghost"
            size="lg"
            onPress={() => handleSocialAuth('oauth_apple')}
            disabled={loading}
            className="h-12 rounded-2xl overflow-hidden self-center w-9/12 p-0 bg-black web:bg-black"
            accessibilityLabel={t('auth.continueWithApple')}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
              borderRadius: 16,
            }}
          >
            <View className="w-full h-full flex-row items-center justify-center px-5">
              <View className="absolute left-4">
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <SymbolView
                    name="apple.logo"
                    width={22}
                    height={22}
                    tintColor="#fff"
                    resizeMode="scaleAspectFit"
                  />
                )}
              </View>
              <Text className="text-white text-base font-semibold">
                {t('auth.continueWithApple')}
              </Text>
            </View>
          </Button>
        )}
      </View>

      {showDivider && (
        <View className="flex-row items-center gap-4 my-2">
          <View className="flex-1 h-px bg-border opacity-50" />
          <Text className="text-muted-foreground text-sm font-normal">
            {t('auth.orContinueWith')}
          </Text>
          <View className="flex-1 h-px bg-border opacity-50" />
        </View>
      )}
    </View>
  );
}
