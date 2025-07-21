import React from 'react';
import { Link } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { AuthLayout } from '~/components/auth/AuthLayout';
import { FormField } from '~/components/ui/FormField';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useAuthForm } from '~/hooks/useAuthForm';

export default function SignUpScreen() {
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
      title={!pendingVerification ? 'Create Account' : 'Verify Email'}
      subtitle={
        !pendingVerification
          ? 'Start your journey to better mental health'
          : `We've sent a verification code to ${form.email}`
      }
      footerContent={
        !pendingVerification ? (
          <>
            <Text className="text-muted-foreground">
              Already have an account?
            </Text>
            <Link href="/auth/sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-medium">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </>
        ) : undefined
      }
    >
      {!pendingVerification ? (
        <Animated.View style={shakeStyle} className="gap-4 mt-6">
          <FormField
            label="Name"
            placeholder="Enter your name"
            value={form.name || ''}
            onChangeText={(text) => updateForm('name', text)}
            autoComplete="name"
            error={errors.name}
          />

          <FormField
            label="Email"
            placeholder="Enter your email"
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
            label="Password"
            placeholder="Create a password"
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </Button>
        </Animated.View>
      ) : (
        <Animated.View style={shakeStyle} className="gap-4 mt-6">
          <FormField
            label="Verification Code"
            placeholder="Enter code"
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
              {loading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </Button>
        </Animated.View>
      )}
    </AuthLayout>
  );
}
