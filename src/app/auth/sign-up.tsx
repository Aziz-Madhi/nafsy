import React from 'react';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Alert, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Error', err.errors[0].message);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
      router.replace('/tabs/chat');
    } catch (err: any) {
      Alert.alert('Error', err.errors[0].message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 p-6 justify-center gap-6">
          {!pendingVerification ? (
            <>
              <View className="gap-3 items-center">
                <Text className="text-4xl font-bold text-foreground text-center">
                  Create Account
                </Text>
                <Text className="text-muted-foreground text-center text-base">
                  Start your journey to better mental health
                </Text>
              </View>

              <View className="gap-4 mt-6">
                <View className="gap-2">
                  <Text className="text-sm text-muted-foreground">
                    Name
                  </Text>
                  <TextInput
                    className="border border-border rounded-lg px-4 py-3 text-base text-foreground bg-input"
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                  />
                </View>

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
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password-new"
                  />
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-lg px-6 py-4 mt-2"
                  onPress={onSignUpPress}
                >
                  <Text className="text-primary-foreground text-base font-semibold text-center">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-2 justify-center mt-4">
                <Text className="text-muted-foreground">Already have an account?</Text>
                <Link href="/auth/sign-in" asChild>
                  <TouchableOpacity>
                    <Text className="text-primary font-medium">
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </>
          ) : (
            <>
              <View className="gap-3 items-center">
                <Text className="text-4xl font-bold text-foreground text-center">
                  Verify Email
                </Text>
                <Text className="text-muted-foreground text-center text-base">
                  We've sent a verification code to {emailAddress}
                </Text>
              </View>

              <View className="gap-4 mt-6">
                <View className="gap-2">
                  <Text className="text-sm text-muted-foreground">
                    Verification Code
                  </Text>
                  <TextInput
                    className="border border-border rounded-lg px-4 py-3 text-base text-foreground bg-input"
                    placeholder="Enter code"
                    placeholderTextColor="#9CA3AF"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-lg px-6 py-4 mt-2"
                  onPress={onPressVerify}
                >
                  <Text className="text-primary-foreground text-base font-semibold text-center">
                    Verify Email
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}