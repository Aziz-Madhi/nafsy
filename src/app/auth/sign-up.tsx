import React from 'react';
import { Link } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { AuthLayout } from '~/components/auth/AuthLayout';
import { FormField } from '~/components/ui/FormField';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useAuthForm } from '~/hooks/useAuthForm';
import { useTranslation } from '~/hooks/useTranslation';

export default function SignUpScreen() {
  const { t } = useTranslation();
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
  } = useAuthForm({ mode: 'signup' });

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
        <Animated.View style={shakeStyle} className="gap-4 mt-6">
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
            className="mt-2"
          >
            <Text className="text-primary-foreground text-base font-semibold">
              {loading ? t('auth.buttons.creatingAccount') : t('common.signUp')}
            </Text>
          </Button>
        </Animated.View>
      ) : (
        <Animated.View style={shakeStyle} className="gap-4 mt-6">
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
            className="mt-2"
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
