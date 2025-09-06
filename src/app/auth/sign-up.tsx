import React from 'react';
import { Link, router } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AuthLayout } from '~/components/auth/AuthLayout';
import { SocialAuthButtons } from '~/components/auth/SocialAuthButtons';
import { FormField } from '~/components/ui/FormField';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useAuthForm } from '~/hooks/useAuthForm';
import { useOnboardingStore } from '~/store/useOnboardingStore';
import { useTranslation } from '~/hooks/useTranslation';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const setOnboardingField = useOnboardingStore((s) => s.setField);
  const {
    form,
    errors,
    loading,
    isLoaded,
    pendingVerification,
    verificationCode,
    setVerificationCode,
    updateForm,
    handleSubmit,
    handleVerification,
    validation,
    shakeStyle,
  } = useAuthForm({
    mode: 'signup',
    onSuccess: () => {
      if (form.name) setOnboardingField('name', form.name);
      // Route new users to onboarding
      // Existing users will land in tabs via (app) layout
      try {
        // Small delay to allow Clerk state to settle
        setTimeout(() => {
          // Start onboarding flow
          // Use replace to avoid back navigation to auth
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          (router as any)?.replace?.('/onboarding/profile');
        }, 50);
      } catch {}
    },
  });

  if (!isLoaded) return null;

  return (
    <AuthLayout
      title={
        !pendingVerification ? t('auth.createAccount') : t('auth.verifyEmail')
      }
      subtitle={
        !pendingVerification
          ? t('auth.signUpSubtitle')
          : t('auth.verificationSubtitle', { email: form.email })
      }
      footerContent={
        !pendingVerification ? (
          <>
            <Text className="text-muted-foreground">
              {t('auth.alreadyHaveAccount')}
            </Text>
            <Link href="/auth/sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-medium">
                  {t('common.signIn')}
                </Text>
              </TouchableOpacity>
            </Link>
          </>
        ) : undefined
      }
    >
      {!pendingVerification ? (
        <View className="mt-2">
          {/* Email/Password Form (moved up) */}
          <Animated.View style={shakeStyle} className="gap-3">
            <FormField
              label={t('auth.name')}
              placeholder={t('auth.placeholders.enterName')}
              value={form.name || ''}
              onChangeText={(text) => updateForm('name', text)}
              autoComplete="name"
              error={errors.name}
            />

            <FormField
              label={t('auth.email')}
              placeholder={t('auth.placeholders.enterEmail')}
              value={form.email}
              onChangeText={(text) => updateForm('email', text)}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              error={errors.email}
            />

            <FormField
              label={t('auth.password')}
              placeholder={t('auth.placeholders.createPassword')}
              value={form.password}
              onChangeText={(text) => updateForm('password', text)}
              secureTextEntry
              autoComplete="password-new"
              error={errors.password}
            />

            <Button
              onPress={handleSubmit}
              disabled={loading || !validation.isValid}
              size="lg"
              className="mt-3 rounded-xl"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text className="text-primary-foreground text-base font-semibold">
                {loading
                  ? t('auth.buttons.creatingAccount')
                  : t('common.signUp')}
              </Text>
            </Button>
          </Animated.View>

          {/* Divider between email and social */}
          <View className="flex-row items-center gap-3 my-3">
            <View className="flex-1 h-px bg-border opacity-50" />
            <Text className="text-muted-foreground text-sm font-normal">
              {t('auth.orContinueWith')}
            </Text>
            <View className="flex-1 h-px bg-border opacity-50" />
          </View>

          {/* Social Auth Buttons (moved down) */}
          <SocialAuthButtons showDivider={false} />
        </View>
      ) : (
        <Animated.View style={shakeStyle} className="gap-3 mt-4">
          <FormField
            label={t('auth.verificationCode')}
            placeholder={t('auth.placeholders.enterCode')}
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            error={errors.general}
          />

          <Button
            onPress={handleVerification}
            disabled={loading || !verificationCode}
            size="lg"
            className="mt-3 rounded-xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text className="text-primary-foreground text-base font-semibold">
              {loading
                ? t('auth.buttons.verifying')
                : t('auth.buttons.verifyEmail')}
            </Text>
          </Button>
        </Animated.View>
      )}
    </AuthLayout>
  );
}
