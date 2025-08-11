import React, { useState, useCallback, useEffect } from 'react';
import { View, Pressable, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Avatar } from '~/components/ui/avatar';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useUserSafe } from '~/lib/useUserSafe';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function EditProfileModal() {
  const { user, isLoaded } = useUserSafe();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user && isLoaded) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.emailAddresses?.[0]?.emailAddress || '');
    }
  }, [user, isLoaded]);

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || isSaving) return;

    try {
      setIsSaving(true);
      impactAsync(ImpactFeedbackStyle.Medium);

      // Update user profile with Clerk
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      // Update email if changed (requires verification)
      const currentEmail = user.emailAddresses?.[0]?.emailAddress;
      if (email.trim() !== currentEmail && email.trim()) {
        await user.createEmailAddress({ email: email.trim() });
      }

      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Update Failed',
        'There was an error updating your profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  }, [user, firstName, lastName, email, isSaving]);

  const hasChanges = useCallback(() => {
    if (!user) return false;
    return (
      firstName.trim() !== (user.firstName || '') ||
      lastName.trim() !== (user.lastName || '') ||
      email.trim() !== (user.emailAddresses?.[0]?.emailAddress || '')
    );
  }, [user, firstName, lastName, email]);

  if (!isLoaded || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text variant="body" className="text-muted-foreground">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={handleBack} className="mr-4">
          <SymbolView name="arrow.left" size={24} tintColor="#5A4A3A" />
        </Pressable>
        <View className="flex-1">
          <Text variant="title2" className="text-[#2D3748] font-bold">
            Edit Profile
          </Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges() || isSaving}
          className={`px-4 py-2 rounded-xl ${
            hasChanges() && !isSaving
              ? 'bg-[#5A4A3A]'
              : 'bg-gray-300 opacity-50'
          }`}
        >
          <Text
            variant="callout"
            className={`font-semibold ${
              hasChanges() && !isSaving ? 'text-white' : 'text-gray-500'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 p-6">
        {/* Profile Avatar Section */}
        <Animated.View
          entering={FadeInDown.springify()}
          className="items-center mb-8"
        >
          <Avatar alt={user.fullName || 'User'} className="h-32 w-32 mb-4">
            <Avatar.Image source={{ uri: user.imageUrl }} />
            <Avatar.Fallback>
              <Text variant="title1" className="text-2xl">
                {firstName.charAt(0) ||
                  user.firstName?.charAt(0) ||
                  email.charAt(0).toUpperCase() ||
                  'U'}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <Pressable
            onPress={() => {
              impactAsync(ImpactFeedbackStyle.Light);
              // TODO: Implement image picker
              Alert.alert(
                'Change Avatar',
                'Avatar change functionality will be available soon.',
                [{ text: 'OK' }]
              );
            }}
            className="flex-row items-center px-4 py-2 bg-gray-100 rounded-xl"
          >
            <SymbolView
              name="camera.fill"
              size={16}
              tintColor="#5A4A3A"
              className="mr-2"
            />
            <Text variant="callout" className="text-[#5A4A3A] font-medium">
              Change Photo
            </Text>
          </Pressable>
        </Animated.View>

        {/* Form Fields */}
        <View
          className="rounded-3xl p-6 border border-gray-200 bg-foreground/15"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {/* First Name */}
          <View className="mb-4">
            <Text
              variant="subhead"
              className="text-[#5A4A3A] font-semibold mb-2"
            >
              First Name
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor="#8B7355"
              className="bg-white rounded-xl p-4 border border-gray-200"
              style={{
                fontSize: 16,
                color: '#2D3748',
                fontFamily: 'CrimsonPro-Regular',
              }}
            />
          </View>

          {/* Last Name */}
          <View className="mb-4">
            <Text
              variant="subhead"
              className="text-[#5A4A3A] font-semibold mb-2"
            >
              Last Name
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor="#8B7355"
              className="bg-white rounded-xl p-4 border border-gray-200"
              style={{
                fontSize: 16,
                color: '#2D3748',
                fontFamily: 'CrimsonPro-Regular',
              }}
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text
              variant="subhead"
              className="text-[#5A4A3A] font-semibold mb-2"
            >
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor="#8B7355"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white rounded-xl p-4 border border-gray-200"
              style={{
                fontSize: 16,
                color: '#2D3748',
                fontFamily: 'CrimsonPro-Regular',
              }}
            />
            <Text variant="caption1" className="text-gray-500 mt-1">
              Changing your email requires verification
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View className="mt-6 p-4 rounded-2xl border border-gray-200 bg-blue-400/10">
          <View className="flex-row items-center mb-2">
            <Text style={{ fontSize: 20, marginRight: 8 }}>👤</Text>
            <Text variant="body" className="text-[#5A4A3A] font-semibold">
              Profile Information
            </Text>
          </View>
          <Text variant="caption1" className="text-gray-600 leading-5">
            Your profile information is used to personalize your experience and
            is kept secure and private. Only you can see your full profile
            details.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
