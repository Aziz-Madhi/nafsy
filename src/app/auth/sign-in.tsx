import React from 'react';
import { Link } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { AuthLayout } from '~/components/auth/AuthLayout';
import { FormField } from '~/components/ui/FormField';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useAuthForm } from '~/hooks/useAuthForm';

export default function SignInScreen() {
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
      title="Welcome Back"
      subtitle="Sign in to continue your mental wellness journey"
      footerContent={
        <>
          <Text className="text-muted-foreground">
            Don&apos;t have an account?
          </Text>
          <Link href="/auth/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-primary font-medium">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </>
      }
    >
      <Animated.View style={shakeStyle} className="gap-4 mt-6">
        <FormField
          label="Email"
          placeholder="Enter your email"
          value={form.email}
          onChangeText={(text) => updateForm('email', text)}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          error={errors.email}
        />

        <FormField
          label="Password"
          placeholder="Enter your password"
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
          className="mt-2"
        >
          <Text className="text-primary-foreground text-base font-semibold">
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </Button>
      </Animated.View>
    </AuthLayout>
  );
}
