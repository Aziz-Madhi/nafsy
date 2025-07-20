import React from 'react';
import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Alert, View, Text, TextInput, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { optimizedHaptic } from '~/lib/haptic-optimizer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  // Worklet-optimized validation animations
  const shakeX = useSharedValue(0);
  
  const shakeStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: shakeX.value }],
    };
  });
  
  const triggerErrorShake = () => {
    optimizedHaptic.error();
    shakeX.value = withSpring(-10, {}, () => {
      shakeX.value = withSpring(10, {}, () => {
        shakeX.value = withSpring(0);
      });
    });
  };

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    // Trim whitespace
    const trimmedEmail = emailAddress.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      triggerErrorShake();
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const completeSignIn = await signIn.create({
        identifier: trimmedEmail,
        password: trimmedPassword,
      });

      await setActive({ session: completeSignIn.createdSessionId });
      router.replace('/tabs/chat');
    } catch (err: any) {
      console.error('Sign in error:', err);
      triggerErrorShake();
      const errorMessage = err.errors?.[0]?.message || err.message || 'Failed to sign in. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 p-6 justify-center gap-6">
          <View className="gap-3 items-center">
            <Text className="text-4xl font-bold text-foreground text-center">
              Welcome Back
            </Text>
            <Text className="text-muted-foreground text-center text-base">
              Sign in to continue your mental wellness journey
            </Text>
          </View>

          <Animated.View style={shakeStyle} className="gap-4 mt-6">
            <View className="gap-2">
              <Text className="text-sm text-muted-foreground">
                Email
              </Text>
              <TextInput
                className="border border-border rounded-lg px-4 py-3 text-base text-foreground bg-input"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm text-muted-foreground">
                Password
              </Text>
              <TextInput
                className="border border-border rounded-lg px-4 py-3 text-base text-foreground bg-input"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              className="bg-primary rounded-lg px-6 py-4 mt-2"
              onPress={onSignInPress}
            >
              <Text className="text-primary-foreground text-base font-semibold text-center">
                Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View className="flex-row gap-2 justify-center mt-4">
            <Text className="text-muted-foreground">Don't have an account?</Text>
            <Link href="/auth/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-medium">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}