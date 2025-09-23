import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../../../lib/haptics';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { Text } from '~/components/ui/text';
import {
  Globe,
  Moon,
  Smartphone,
  HelpCircle,
  Heart,
  MessageSquare,
  Shield,
  LogOut,
  ChevronRight,
  X,
  User,
  FileText,
  Mail,
} from 'lucide-react-native';
// haptics handled via safeHaptics wrapper and store toggle
import { useColors } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { cn } from '~/lib/cn';
import { useTranslation } from '~/hooks/useTranslation';
import {
  useCurrentLanguage,
  useSettings,
  useToggleLanguage,
  useAppStore,
} from '~/store/useAppStore';
import { resetAllStores } from '~/store';
import { clearLocalFirstDB } from '~/lib/local-first/sqlite';
import { useLanguageClass } from '~/lib/rtl-utils';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { RTLIcon } from '~/components/ui/RTLIcon';

// Section Header Component
const SectionHeader = React.memo(function SectionHeader({
  title,
}: {
  title: string;
}) {
  return (
    <Text className="text-muted-foreground mb-2 mt-6 px-4 uppercase tracking-wide font-medium text-[13px]">
      {title}
    </Text>
  );
});

// Setting Row Component - iOS native style
const SettingRow = React.memo(function SettingRow({
  icon: Icon,
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
  icon?: any;
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
  const colors = useColors();
  const scale = useSharedValue(1);
  const flexDirection = useLanguageClass('flex-row', 'flex-row-reverse');
  const iconMargin = useLanguageClass('me-3', 'ms-3');
  const valueMargin = useLanguageClass('me-2', 'ms-2');

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
          'px-4 py-3.5 items-center',
          flexDirection,
          !isLast && 'border-b border-border/10'
        )}
        disabled={type === 'switch'}
      >
        {Icon && (
          <View
            className={cn(
              'w-7 h-7 rounded-md items-center justify-center',
              iconMargin
            )}
            style={{
              backgroundColor: destructive
                ? withOpacity(colors.error, 0.15)
                : iconBgColor
                  ? withOpacity(iconBgColor, 0.15)
                  : withOpacity(colors.primary, 0.15),
            }}
          >
            <Icon
              size={16}
              color={destructive ? colors.error : iconColor || colors.primary}
            />
          </View>
        )}
        <Text className={cn('flex-1 text-[17px]', destructive && 'text-error')}>
          {label}
        </Text>
        {type === 'navigation' ? (
          <View className="flex-row items-center">
            {value && (
              <Text
                className={cn('text-muted-foreground text-[15px]', valueMargin)}
              >
                {value}
              </Text>
            )}
            <RTLIcon>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </RTLIcon>
          </View>
        ) : (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{
              false: withOpacity(colors.muted, 0.3),
              true: colors.success,
            }}
            thumbColor="white"
          />
        )}
      </Pressable>
    </Animated.View>
  );
});

const SettingsScreen = React.memo(function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUserSafe();
  const colors = useColors();
  // Add back store selectors one by one to identify the problematic one
  const currentLanguage = useCurrentLanguage();
  const settings = useSettings();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { t } = useTranslation();

  // Extract from settings
  const theme = settings.theme;
  // const notificationsEnabled = settings.notificationsEnabled;

  // Simplified store selectors
  const setTheme = useAppStore((state) => state.setTheme);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const toggleLanguage = useToggleLanguage();

  // Settings handlers

  const handleThemeChange = useCallback(() => {
    safeHaptics.impact();
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  const handleLanguageChange = useCallback(async () => {
    safeHaptics.impact();

    try {
      // Simple toggle - handles everything internally
      await toggleLanguage();
      console.log('🌐 Language toggled successfully');
    } catch (error) {
      console.error('🌐 Failed to toggle language:', error);
      Alert.alert(
        'Language Change Failed',
        'There was an error changing the language. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [toggleLanguage]);

  const getThemeDisplayName = (theme: string) => {
    switch (theme) {
      case 'light':
        return t('profile.themes.light');
      case 'dark':
        return t('profile.themes.dark');
      case 'system':
        return t('profile.themes.system');
      default:
        return t('profile.themes.system');
    }
  };

  const getLanguageDisplayName = (language: string) => {
    switch (language) {
      case 'en':
        return t('profile.languages.english');
      case 'ar':
        return t('profile.languages.arabic');
      default:
        return t('profile.languages.english');
    }
  };

  // Notifications toggle removed

  const hapticFeedbackEnabled = settings.hapticFeedbackEnabled !== false;

  const handleHapticsToggle = useCallback(
    (value: boolean) => {
      updateSettings({ hapticFeedbackEnabled: value });
      if (value) {
        // play a sample to confirm it's on
        safeHaptics.selection();
      }
    },
    [updateSettings]
  );

  // Navigation handlers
  const handleHelpCenter = useCallback(() => {
    safeHaptics.impact();
    router.push('/help-center');
  }, []);

  const handleGetHelp = useCallback(() => {
    safeHaptics.impact();
    Linking.openURL('https://www.iasp.info/crisis-centres-helplines/');
  }, []);

  const handleFeedback = useCallback(() => {
    safeHaptics.impact();
    router.push('/feedback');
  }, []);

  const handleClose = useCallback(() => {
    safeHaptics.impact();
    router.back();
  }, []);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Warning);
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Sign out from Clerk
      await signOut();

      // Hard-wipe local SQLite data to prevent cross-account leakage
      try {
        await clearLocalFirstDB();
      } catch {}

      // Clear all client state
      resetAllStores();

      // Add if using React Query:
      // queryClient.clear();

      // Add if using WebSockets:
      // ws?.close();

      // Navigate to welcome after sign-out
      router.replace('/welcome');
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsSigningOut(false);
    }
  }, [isSigningOut, signOut]);

  // App version
  const appVersion = '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/10">
        <View className="w-10" />
        <Text className="text-[17px] font-semibold text-foreground">
          {t('tabs.profile')}
        </Text>
        <Pressable
          onPress={handleClose}
          className="w-10 h-10 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.05]"
        >
          <X size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* User Info - Highlighted Card */}
        {user && (
          <Animated.View
            entering={FadeInDown.springify()}
            className="px-4 mt-4"
          >
            <View className="rounded-2xl p-4 bg-black/[0.03] dark:bg-white/[0.03] flex-row items-center">
              <View className="h-12 w-12 me-3 rounded-full items-center justify-center bg-primary/15">
                <Text className="text-primary text-lg font-semibold">
                  {user.fullName?.charAt(0) || user.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-foreground">
                  {user.fullName || t('profile.settings.anonymousUser')}
                </Text>
                <Text className="text-[14px] text-muted-foreground">
                  {user.emailAddresses?.[0]?.emailAddress}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ACCOUNT Section */}
        <SectionHeader title={t('profile.sections.account')} />
        <View className="mx-4 rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
          <SettingRow
            icon={Mail}
            label={t('profile.settings.email')}
            value={user?.emailAddresses?.[0]?.emailAddress}
            type="navigation"
            isFirst
            iconColor={colors.primary}
            iconBgColor={colors.primary}
          />
          <SettingRow
            icon={User}
            label={t('profile.settings.subscription')}
            value={t('profile.subscription.freePlan')}
            type="navigation"
            isLast
            iconColor={colors.warning}
            iconBgColor={colors.warning}
          />
        </View>

        {/* APP Section */}
        <SectionHeader title={t('profile.sections.app')} />
        <View className="mx-4 rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
          <SettingRow
            icon={Moon}
            label={t('profile.settings.appearance')}
            value={getThemeDisplayName(theme)}
            onPress={handleThemeChange}
            isFirst
            iconColor={colors.primary}
            iconBgColor={colors.primary}
          />
          <SettingRow
            icon={Globe}
            label={t('profile.settings.language')}
            value={getLanguageDisplayName(currentLanguage)}
            onPress={handleLanguageChange}
            iconColor={colors.primary}
            iconBgColor={colors.primary}
          />
          <SettingRow
            icon={Smartphone}
            label={t('profile.settings.hapticFeedback')}
            type="switch"
            switchValue={hapticFeedbackEnabled}
            onSwitchChange={handleHapticsToggle}
            isLast
            iconColor={colors.success}
            iconBgColor={colors.success}
          />
        </View>

        {/* Voice Mode section removed */}

        {/* ABOUT Section */}
        <SectionHeader title={t('profile.sections.about')} />
        <View className="mx-4 rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
          <SettingRow
            icon={HelpCircle}
            label={t('profile.settings.helpCenter')}
            onPress={handleHelpCenter}
            isFirst
            iconColor={colors.success}
            iconBgColor={colors.success}
          />
          <SettingRow
            icon={MessageSquare}
            label={t('profile.settings.feedback')}
            onPress={handleFeedback}
            iconColor={colors.warning}
            iconBgColor={colors.warning}
          />
          <SettingRow
            icon={FileText}
            label={t('profile.settings.termsOfUse')}
            type="navigation"
            iconColor={colors.mutedForeground}
            iconBgColor={colors.muted}
          />
          <SettingRow
            icon={Shield}
            label={t('profile.settings.privacyPolicy')}
            type="navigation"
            isLast
            iconColor={colors.mutedForeground}
            iconBgColor={colors.muted}
          />
        </View>

        {/* Prominent Get Help CTA */}
        <View className="mx-4 mt-4">
          <Pressable
            onPress={handleGetHelp}
            className="rounded-2xl overflow-hidden"
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <View className="bg-red-600">
              <View className="px-4 py-4 flex-row items-center justify-center">
                <Text className="text-white text-[17px] font-semibold">
                  {t('profile.settings.getHelp')}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Log Out Button */}
        <View className="mx-4 mt-6">
          <Pressable
            onPress={handleSignOut}
            disabled={isSigningOut}
            className="rounded-2xl overflow-hidden"
          >
            <View className="bg-black/[0.03] dark:bg-white/[0.03]">
              <View className="px-4 py-3.5 flex-row items-center">
                <View
                  className="w-7 h-7 rounded-md items-center justify-center me-3"
                  style={{
                    backgroundColor: withOpacity(colors.error, 0.15),
                  }}
                >
                  <LogOut size={16} color={colors.error} />
                </View>
                {isSigningOut ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color={colors.error}
                      className="me-2"
                    />
                    <Text className="text-error text-[17px]">
                      Signing Out...
                    </Text>
                  </>
                ) : (
                  <Text className="text-error text-[17px]">Log out</Text>
                )}
              </View>
            </View>
          </Pressable>
        </View>

        {/* App version footer */}
        <View className="mx-4 mt-3 items-center">
          <Text className="text-muted-foreground text-[12px]">
            Nafsy for iOS • v{appVersion}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

export default SettingsScreen;
