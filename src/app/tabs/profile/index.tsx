import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      className="text-[#6B7280] mb-3 mt-6 px-4 uppercase tracking-wide font-semibold text-[13px]"
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
  iconColor,
  iconBgColor,
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
  iconColor?: string;
  iconBgColor?: string;
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
          !isLast && 'border-b border-gray-100'
        )}
        disabled={type === 'switch'}
      >
        {icon && (
          <View
            className="w-8 h-8 rounded-lg items-center justify-center mr-3"
            style={{
              backgroundColor: destructive 
                ? '#FF3B30' + '15' 
                : iconBgColor 
                  ? iconBgColor + '15' 
                  : '#007AFF15'
            }}
          >
            <SymbolView
              name={icon as any}
              size={20}
              tintColor={destructive ? '#FF3B30' : iconColor || '#007AFF'}
            />
          </View>
        )}
        <Text
          variant="body"
          className={cn(
            'flex-1 text-[17px] font-medium',
            destructive && 'text-[#FF3B30]'
          )}
        >
          {label}
        </Text>
        {type === 'navigation' ? (
          <View className="flex-row items-center">
            {value && (
              <Text variant="body" className="text-[#8E8E93] mr-2 text-[16px]">
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
  const insets = useSafeAreaInsets();

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
      {/* User Info Card */}
      <View
        className="mx-4 mb-4 rounded-2xl shadow-sm"
        style={{
          backgroundColor: 'rgba(90, 74, 58, 0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        }}
      >
        <View className="px-4 py-5 flex-row items-center">
          <Avatar alt={user.fullName || 'User'} className="h-16 w-16 mr-4">
            <Avatar.Image source={{ uri: user.imageUrl }} />
            <Avatar.Fallback className="bg-gradient-to-br from-purple-500 to-purple-600">
              <Text variant="body" className="text-white text-xl font-semibold">
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
            <Text className="text-[19px] font-semibold text-black mb-1">
              {user.fullName || 'Anonymous User'}
            </Text>
            <Text className="text-[15px] text-[#6B7280]">
              {user.emailAddresses?.[0]?.emailAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        className="mx-4 mb-4"
      >
        <Text className="text-[15px] font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
          Usage Statistics
        </Text>
        <View
          className="rounded-2xl shadow-sm p-5"
          style={{
            backgroundColor: 'rgba(90, 74, 58, 0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }}
        >
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <View className="bg-[#FF9500]/10 w-14 h-14 rounded-full items-center justify-center mb-3">
                <SymbolView name="flame.fill" size={24} tintColor="#FF9500" />
              </View>
              <Text className="text-[26px] font-bold text-black mb-1">7</Text>
              <Text className="text-[13px] text-[#6B7280] text-center font-medium">
                {t('profile.stats.dayStreak')}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <View className="bg-[#007AFF]/10 w-14 h-14 rounded-full items-center justify-center mb-3">
                <SymbolView
                  name="bubble.left.fill"
                  size={24}
                  tintColor="#007AFF"
                />
              </View>
              <Text className="text-[26px] font-bold text-black mb-1">24</Text>
              <Text className="text-[13px] text-[#6B7280] text-center font-medium">
                {t('profile.stats.sessions')}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <View className="bg-[#34C759]/10 w-14 h-14 rounded-full items-center justify-center mb-3">
                <SymbolView name="clock.fill" size={24} tintColor="#34C759" />
              </View>
              <Text className="text-[26px] font-bold text-black mb-1">
                3.5h
              </Text>
              <Text className="text-[13px] text-[#6B7280] text-center font-medium">
                {t('profile.stats.totalTime')}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  ) : null;

  return (
    <ProfileLayout title={t('profile.title')}>
      <ScrollView
        className="flex-1 bg-[#F4F1ED]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 40 // Safe area + reduced tab bar clearance
        }}
      >
        {/* Account Section */}
        {AccountSection}

        {/* Settings Section */}
        <SectionHeader title={t('profile.sections.settings')} />
        <View
          className="mx-4 mb-4 rounded-2xl shadow-sm overflow-hidden"
          style={{
            backgroundColor: 'rgba(90, 74, 58, 0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }}
        >
          <SettingRow
            icon="globe.americas.fill"
            label={t('profile.settings.language')}
            value={language === 'en' ? 'English' : 'العربية'}
            onPress={handleLanguageChange}
            isFirst={true}
            iconColor="#007AFF"
            iconBgColor="#007AFF"
          />
          <SettingRow
            icon="moon.fill"
            label={t('profile.settings.theme')}
            value={t(`profile.themes.${theme}`)}
            onPress={handleThemeChange}
            isLast={true}
            iconColor="#5856D6"
            iconBgColor="#5856D6"
          />
        </View>

        {/* Support Section */}
        <SectionHeader title={t('profile.sections.support')} />
        <View
          className="mx-4 mb-6 rounded-2xl shadow-sm overflow-hidden"
          style={{
            backgroundColor: 'rgba(90, 74, 58, 0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }}
        >
          <SettingRow
            icon="questionmark.circle.fill"
            label={t('profile.support.helpCenter')}
            onPress={handleHelpCenter}
            isFirst={true}
            iconColor="#34C759"
            iconBgColor="#34C759"
          />
          <SettingRow
            icon="heart.fill"
            label={t('profile.support.crisisResources')}
            onPress={handleCrisisResources}
            iconColor="#FF3B30"
            iconBgColor="#FF3B30"
          />
          <SettingRow
            icon="envelope.fill"
            label={t('profile.support.feedback')}
            onPress={handleFeedback}
            isLast={true}
            iconColor="#FF9500"
            iconBgColor="#FF9500"
          />
        </View>

        {/* Sign Out Button */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Pressable
            onPress={async () => {
              impactAsync(ImpactFeedbackStyle.Medium);
              await handleSignOut();
            }}
            disabled={isSigningOut}
            className="mx-4 mb-8 bg-red-500 rounded-2xl p-4 flex-row items-center justify-center shadow-sm active:scale-95 transition-transform"
            style={{
              shadowColor: '#FF3B30',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          >
            {isSigningOut ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="white"
                  className="mr-2"
                />
                <Text className="text-white text-[17px] font-semibold">
                  {t('profile.signingOut') || 'Signing Out...'}
                </Text>
              </>
            ) : (
              <>
                <SymbolView
                  name="rectangle.portrait.and.arrow.right"
                  size={20}
                  tintColor="white"
                  className="mr-2"
                />
                <Text className="text-white text-[17px] font-semibold">
                  {t('profile.signOut') || 'Sign Out'}
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </ProfileLayout>
  );
}
