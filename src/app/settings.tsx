import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { Text } from '~/components/ui/text';
import { Avatar } from '~/components/ui/avatar';
import {
  Globe,
  Moon,
  Smartphone,
  Volume2,
  HelpCircle,
  Heart,
  MessageSquare,
  Shield,
  LogOut,
  ChevronRight,
  X,
  User,
  Bell,
  Lock,
  FileText,
  Info,
  Mail,
} from 'lucide-react-native';
import {
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppStore } from '~/store/app-store';
import { useColors } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { cn } from '~/lib/cn';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// Section Header Component
function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-muted-foreground mb-2 mt-6 px-4 uppercase tracking-wide font-medium text-[13px]">
      {title}
    </Text>
  );
}

// Setting Row Component - iOS native style
function SettingRow({
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
          !isLast && 'border-b border-border/10'
        )}
        disabled={type === 'switch'}
      >
        {Icon && (
          <View
            className="w-7 h-7 rounded-md items-center justify-center mr-3"
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
        <Text
          className={cn(
            'flex-1 text-[17px]',
            destructive && 'text-error'
          )}
        >
          {label}
        </Text>
        {type === 'navigation' ? (
          <View className="flex-row items-center">
            {value && (
              <Text className="text-muted-foreground mr-2 text-[15px]">
                {value}
              </Text>
            )}
            <ChevronRight size={16} color={colors.mutedForeground} />
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
}

export default function SettingsScreen() {
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUserSafe();
  const { t, language, setLanguage } = useTranslation();
  const colors = useColors();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // State management
  const theme = useAppStore((state) => state.settings.theme);
  const notificationsEnabled = useAppStore(
    (state) => state.settings.notificationsEnabled
  );
  const setTheme = useAppStore((state) => state.setTheme);
  const updateSettings = useAppStore((state) => state.updateSettings);

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

  // Navigation handlers
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

  const handleClose = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
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

  // App version
  const appVersion = '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/10">
        <View className="w-10" />
        <Text className="text-[17px] font-semibold text-foreground">
          Settings
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
        {/* User Info - Compact */}
        {user && (
          <Animated.View
            entering={FadeInDown.springify()}
            className="px-4 py-4 flex-row items-center border-b border-border/10"
          >
            <Avatar alt={user.fullName || 'User'} className="h-12 w-12 mr-3">
              <Avatar.Image source={{ uri: user.imageUrl }} />
              <Avatar.Fallback className="bg-gradient-to-br from-primary to-primary/80">
                <Text className="text-primary-foreground text-lg font-semibold">
                  {user.fullName?.charAt(0) ||
                    user.firstName?.charAt(0) ||
                    'U'}
                </Text>
              </Avatar.Fallback>
            </Avatar>
            <View className="flex-1">
              <Text className="text-[16px] font-semibold text-foreground">
                {user.fullName || 'Anonymous User'}
              </Text>
              <Text className="text-[14px] text-muted-foreground">
                {user.emailAddresses?.[0]?.emailAddress}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ACCOUNT Section */}
        <SectionHeader title="ACCOUNT" />
        <View className="mx-4 rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
          <SettingRow
            icon={Mail}
            label="Email"
            value={user?.emailAddresses?.[0]?.emailAddress}
            type="navigation"
            isFirst
            iconColor={colors.primary}
            iconBgColor={colors.primary}
          />
          <SettingRow
            icon={User}
            label="Subscription"
            value="Free Plan"
            type="navigation"
            isLast
            iconColor={colors.warning}
            iconBgColor={colors.warning}
          />
        </View>

        {/* APP Section */}
        <SectionHeader title="APP" />
        <View className="mx-4 rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
          <SettingRow
            icon={Globe}
            label={t('profile.settings.language')}
            value={language === 'en' ? 'English' : 'العربية'}
            onPress={handleLanguageChange}
            isFirst
            iconColor={colors.info}
            iconBgColor={colors.info}
          />
          <SettingRow
            icon={Moon}
            label="Appearance"
            value={t(`profile.themes.${theme}`)}
            onPress={handleThemeChange}
            iconColor={colors.primary}
            iconBgColor={colors.primary}
          />
          <SettingRow
            icon={Smartphone}
            label="Haptic Feedback"
            type="switch"
            switchValue={true}
            onSwitchChange={() => {}}
            iconColor={colors.success}
            iconBgColor={colors.success}
          />
          <SettingRow
            icon={Bell}
            label="Notifications"
            type="switch"
            switchValue={notificationsEnabled}
            onSwitchChange={handleNotificationsToggle}
            isLast
            iconColor={colors.warning}
            iconBgColor={colors.warning}
          />
        </View>

        {/* SPEECH Section */}
        <SectionHeader title="SPEECH" />
        <View className="mx-4 rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
          <SettingRow
            icon={Globe}
            label="Main Language"
            value={language === 'en' ? 'English' : 'Arabic'}
            type="navigation"
            isFirst
            isLast
            iconColor={colors.info}
            iconBgColor={colors.info}
          />
        </View>

        {/* VOICE MODE Section */}
        <SectionHeader title="VOICE MODE" />
        <View className="mx-4 rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
          <SettingRow
            icon={Volume2}
            label="Voice"
            value="Coming Soon"
            type="navigation"
            isFirst
            isLast
            iconColor={colors.muted}
            iconBgColor={colors.muted}
          />
        </View>

        {/* ABOUT Section */}
        <SectionHeader title="ABOUT" />
        <View className="mx-4 rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
          <SettingRow
            icon={HelpCircle}
            label={t('profile.support.helpCenter')}
            onPress={handleHelpCenter}
            isFirst
            iconColor={colors.success}
            iconBgColor={colors.success}
          />
          <SettingRow
            icon={Heart}
            label={t('profile.support.crisisResources')}
            onPress={handleCrisisResources}
            iconColor={colors.error}
            iconBgColor={colors.error}
          />
          <SettingRow
            icon={MessageSquare}
            label={t('profile.support.feedback')}
            onPress={handleFeedback}
            iconColor={colors.warning}
            iconBgColor={colors.warning}
          />
          <SettingRow
            icon={FileText}
            label="Terms of Use"
            type="navigation"
            iconColor={colors.mutedForeground}
            iconBgColor={colors.muted}
          />
          <SettingRow
            icon={Shield}
            label="Privacy Policy"
            type="navigation"
            iconColor={colors.mutedForeground}
            iconBgColor={colors.muted}
          />
          <SettingRow
            icon={Info}
            label="Nafsy for iOS"
            value={appVersion}
            type="navigation"
            isLast
            iconColor={colors.mutedForeground}
            iconBgColor={colors.muted}
          />
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
                  className="w-7 h-7 rounded-md items-center justify-center mr-3"
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
                      className="mr-2"
                    />
                    <Text className="text-error text-[17px]">
                      {t('profile.signingOut') || 'Signing Out...'}
                    </Text>
                  </>
                ) : (
                  <Text className="text-error text-[17px]">
                    {t('profile.signOut') || 'Log out'}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}