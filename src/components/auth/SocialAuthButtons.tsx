import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Apple } from 'lucide-react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useTranslation } from '~/hooks/useTranslation';
import { useSocialAuth, useWarmUpBrowser } from '~/hooks/useSocialAuth';
import { GoogleIcon } from './GoogleIcon';

export function SocialAuthButtons() {
  const { t } = useTranslation();
  useWarmUpBrowser();
  const { handleSocialAuth, loading } = useSocialAuth();

  return (
    <View className="gap-4">
      {/* Social Auth Buttons */}
      <View className="gap-3">
        {/* Google Sign In Button */}
        <Button
          variant="filled"
          size="lg"
          onPress={() => handleSocialAuth('oauth_google')}
          disabled={loading}
          className="flex-row items-center justify-center gap-3 rounded-xl"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" />
          ) : (
            <GoogleIcon size={20} />
          )}
          <Text className="text-foreground text-base font-semibold">
            {t('auth.continueWithGoogle')}
          </Text>
        </Button>

        {/* Apple Sign In Button - Only show on iOS */}
        {Platform.OS === 'ios' && (
          <Button
            variant="filled"
            size="lg"
            onPress={() => handleSocialAuth('oauth_apple')}
            disabled={loading}
            className="flex-row items-center justify-center gap-3 rounded-xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Apple size={20} color="#000" strokeWidth={2} />
            )}
            <Text className="text-foreground text-base font-semibold">
              {t('auth.continueWithApple')}
            </Text>
          </Button>
        )}
      </View>

      {/* Improved Divider */}
      <View className="flex-row items-center gap-4 my-2">
        <View className="flex-1 h-px bg-border opacity-50" />
        <Text className="text-muted-foreground text-sm font-normal">
          {t('auth.orContinueWith')}
        </Text>
        <View className="flex-1 h-px bg-border opacity-50" />
      </View>
    </View>
  );
}
