import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { ProfileLayout } from '~/components/ui/ScreenLayout';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Text } from '~/components/ui/text';
import { Avatar } from '~/components/ui/avatar';
import { SymbolView } from 'expo-symbols';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from 'expo-haptics';
import { cn } from '~/lib/cn';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppStore } from '~/store/app-store';
import { router } from 'expo-router';

// Section Header Component - iOS native style
function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      variant="footnote"
      className="text-[#8E8E93] mb-2 mt-4 px-4 uppercase tracking-wide font-medium"
    >
      {title}
    </Text>
  );
}

// Setting Row Component - iOS native list style
function SettingRow({
  icon,
  label,
  value,
  onPress,
  type = 'navigation',
  switchValue,
  onSwitchChange,
  destructive = false,
  isFirst = false,
  isLast = false,
}: {
  icon?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  type?: 'navigation' | 'switch';
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  destructive?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={type === 'navigation' ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          'px-4 py-3.5 flex-row items-center',
          isFirst && 'rounded-t-xl',
          isLast && 'rounded-b-xl',
          !isLast && 'border-b border-gray-200'
        )}
        style={{
          backgroundColor: 'rgba(90, 74, 58, 0.12)',
          ...(isFirst && { 
            borderWidth: 1, 
            borderColor: '#e5e7eb',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 3,
          }),
          ...(isLast && { 
            borderWidth: 1, 
            borderColor: '#e5e7eb',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 3,
          }),
          ...(!isFirst && !isLast && {
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderLeftColor: '#e5e7eb',
            borderRightColor: '#e5e7eb',
          }),
        }}
        disabled={type === 'switch'}
      >
        {icon && (
          <SymbolView
            name={icon as any}
            size={20}
            tintColor={destructive ? '#FF3B30' : '#007AFF'}
            className="mr-3"
          />
        )}
        <Text
          variant="body"
          className={cn('flex-1 text-[17px]', destructive && 'text-[#FF3B30]')}
        >
          {label}
        </Text>
        {type === 'navigation' ? (
          <View className="flex-row items-center">
            {value && (
              <Text variant="body" className="text-[#8E8E93] mr-2 text-[17px]">
                {value}
              </Text>
            )}
            <SymbolView name="chevron.right" size={14} tintColor="#C7C7CC" />
          </View>
        ) : (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#E9E9EA', true: '#34C759' }}
            thumbColor="white"
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileIndex() {
  // ===== AUTHENTICATION: Check first =====
  const { signOut, isSignedIn } = useAuth();
  const { user, isLoaded } = useUserSafe();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  // ===== STATE MANAGEMENT =====
  const theme = useAppStore((state) => state.settings.theme);
  const notificationsEnabled = useAppStore(
    (state) => state.settings.notificationsEnabled
  );
  const setTheme = useAppStore((state) => state.setTheme);
  const updateSettings = useAppStore((state) => state.updateSettings);

  // ===== CONVEX: Server data =====
  const createUser = useMutation(api.users.createUser);
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn && isLoaded ? {} : 'skip'
  );

  useEffect(() => {
    // Auto-create user in Convex if they don't exist
    if (user && currentUser === null) {
      createUser({
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        name: user.fullName || user.firstName || undefined,
        avatarUrl: user.imageUrl || undefined,
      });
    }
  }, [user, currentUser, createUser]);

  // Settings handlers
  const handleLanguageChange = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  }, [language, setLanguage]);

  const handleThemeChange = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  const handleNotificationsToggle = useCallback(
    (value: boolean) => {
      impactAsync(ImpactFeedbackStyle.Light);
      updateSettings({ notificationsEnabled: value });
    },
    [updateSettings]
  );

  // Support handlers
  const handleHelpCenter = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/help-center');
  }, []);

  const handleCrisisResources = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/crisis-resources');
  }, []);

  const handleFeedback = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/feedback');
  }, []);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      notificationAsync(NotificationFeedbackType.Warning);

      await new Promise((resolve) => setTimeout(resolve, 150));
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsSigningOut(false);
    }
  }, [isSigningOut, signOut]);

  // Account Section Component - Clean iOS style
  const AccountSection = user ? (
    <Animated.View entering={FadeInDown.springify()}>
      {/* User Info */}
      <View 
        className="rounded-xl mx-4 mb-2 border border-gray-200"
        style={{
          backgroundColor: 'rgba(90, 74, 58, 0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View className="px-4 py-4 flex-row items-center">
          <Avatar alt={user.fullName || 'User'} className="h-12 w-12 mr-3">
            <Avatar.Image source={{ uri: user.imageUrl }} />
            <Avatar.Fallback>
              <Text variant="body" className="text-white">
                {user.fullName?.charAt(0) ||
                  user.firstName?.charAt(0) ||
                  user.emailAddresses?.[0]?.emailAddress
                    .charAt(0)
                    .toUpperCase() ||
                  'U'}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <View className="flex-1">
            <Text className="text-[17px] font-medium text-black mb-0.5">
              {user.fullName || 'Anonymous User'}
            </Text>
            <Text className="text-[15px] text-[#8E8E93]">
              {user.emailAddresses?.[0]?.emailAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View 
        className="rounded-xl mx-4 mb-2 px-4 py-4 border border-gray-200"
        style={{
          backgroundColor: 'rgba(90, 74, 58, 0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Text className="text-[17px] font-medium text-black mb-4">
          Usage Statistics
        </Text>
        <View className="flex-row justify-between">
          <View className="flex-1 items-center">
            <View className="bg-[#FF9500]/10 w-10 h-10 rounded-full items-center justify-center mb-2">
              <SymbolView name="flame.fill" size={18} tintColor="#FF9500" />
            </View>
            <Text className="text-[22px] font-semibold text-black mb-0.5">
              7
            </Text>
            <Text className="text-[13px] text-[#8E8E93] text-center">
              {t('profile.stats.dayStreak')}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <View className="bg-[#007AFF]/10 w-10 h-10 rounded-full items-center justify-center mb-2">
              <SymbolView
                name="bubble.left.fill"
                size={18}
                tintColor="#007AFF"
              />
            </View>
            <Text className="text-[22px] font-semibold text-black mb-0.5">
              24
            </Text>
            <Text className="text-[13px] text-[#8E8E93] text-center">
              {t('profile.stats.sessions')}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <View className="bg-[#34C759]/10 w-10 h-10 rounded-full items-center justify-center mb-2">
              <SymbolView name="clock.fill" size={18} tintColor="#34C759" />
            </View>
            <Text className="text-[22px] font-semibold text-black mb-0.5">
              3.5h
            </Text>
            <Text className="text-[13px] text-[#8E8E93] text-center">
              {t('profile.stats.totalTime')}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  ) : null;

  return (
    <ProfileLayout title={t('profile.title')}>
      <ScrollView
        className="flex-1 bg-[#F8F9FA]"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Account Section */}
        {AccountSection}

        {/* Settings Section */}
        <SectionHeader title={t('profile.sections.settings')} />
        <View className="mx-4 mb-2">
          <SettingRow
            icon="globe"
            label={t('profile.settings.language')}
            value={language === 'en' ? 'English' : 'العربية'}
            onPress={handleLanguageChange}
            isFirst={true}
          />
          <SettingRow
            icon="moon"
            label={t('profile.settings.theme')}
            value={t(`profile.themes.${theme}`)}
            onPress={handleThemeChange}
            isLast={true}
          />
        </View>

        {/* Support Section */}
        <SectionHeader title={t('profile.sections.support')} />
        <View className="mx-4 mb-2">
          <SettingRow
            icon="questionmark.circle"
            label={t('profile.support.helpCenter')}
            onPress={handleHelpCenter}
            isFirst={true}
          />
          <SettingRow
            icon="heart.circle"
            label={t('profile.support.crisisResources')}
            onPress={handleCrisisResources}
          />
          <SettingRow
            icon="envelope"
            label={t('profile.support.feedback')}
            onPress={handleFeedback}
            isLast={true}
          />
        </View>

        {/* Sign Out Button */}
        <Pressable
          onPress={handleSignOut}
          disabled={isSigningOut}
          className="mx-4 mb-4 bg-red-600 rounded-xl p-4 flex-row items-center justify-center"
        >
          {isSigningOut ? (
            <>
              <ActivityIndicator size="small" color="white" className="mr-2" />
              <Text className="text-white text-[17px] font-bold">
                {t('profile.signingOut') || 'Signing Out...'}
              </Text>
            </>
          ) : (
            <>
              <SymbolView
                name="rectangle.portrait.and.arrow.right"
                size={18}
                tintColor="white"
                className="mr-2"
              />
              <Text className="text-white text-[17px] font-bold">
                {t('profile.signOut') || 'Sign Out'}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </ProfileLayout>
  );
}
