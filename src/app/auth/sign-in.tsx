import React from 'react';
import { Link } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AuthLayout } from '~/components/auth/AuthLayout';
import { SocialAuthButtons } from '~/components/auth/SocialAuthButtons';
import { FormField } from '~/components/ui/FormField';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useAuthForm } from '~/hooks/useAuthForm';
import { useTranslation } from '~/hooks/useTranslation';

export default function SignInScreen() {
  const { t } = useTranslation();
  const {
    form,
    errors,
    loading,
    isLoaded,
    updateForm,
    handleSubmit,
    validation,
    shakeStyle,
  } = useAuthForm({ mode: 'signin' });

  if (!isLoaded) return null;

  return (
    <AuthLayout
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
      footerContent={
        <>
          <Text className="text-muted-foreground">
            {t('auth.dontHaveAccount')}
          </Text>
          <Link href="/auth/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-primary font-medium">
                {t('common.signUp')}
              </Text>
            </TouchableOpacity>
          </Link>
        </>
      }
    >
      <View className="mt-6">
        {/* Social Auth Buttons */}
        <SocialAuthButtons />

        {/* Email/Password Form */}
        <Animated.View style={shakeStyle} className="gap-4">
          <FormField
            label={t('auth.email')}
            placeholder={t('auth.placeholders.enterEmail')}
            value={form.email}
            onChangeText={(text) => updateForm('email', text)}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={errors.email}
          />

          <FormField
            label={t('auth.password')}
            placeholder={t('auth.placeholders.enterPassword')}
            value={form.password}
            onChangeText={(text) => updateForm('password', text)}
            secureTextEntry
            autoComplete="password"
            error={errors.password}
          />

          <Button
            onPress={handleSubmit}
            disabled={loading || !validation.isValid}
            size="lg"
            className="mt-4 rounded-xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text className="text-primary-foreground text-base font-semibold">
              {loading ? t('auth.buttons.signingIn') : t('common.signIn')}
            </Text>
          </Button>
        </Animated.View>
      </View>
    </AuthLayout>
  );
}
