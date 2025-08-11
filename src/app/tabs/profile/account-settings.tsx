import React, { useState, useCallback } from 'react';
import { View, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { cn } from '~/lib/cn';
import { useTranslation, useLanguageSwitcher } from '~/hooks/useTranslation';
import { useTheme, useCurrentTheme, useToggleTheme } from '~/store';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  iconName: string;
  iconColor: string;
  action?: () => void;
  rightElement?: React.ReactNode;
}

function SettingRow({ item, isLast }: { item: SettingItem; isLast: boolean }) {
  const handlePress = () => {
    if (item.action) {
      impactAsync(ImpactFeedbackStyle.Light);
      item.action();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!item.action && !item.rightElement}
      className={cn(
        'flex-row items-center p-4',
        !isLast && 'border-b border-border/50'
      )}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: item.iconColor + '20' }}
      >
        <SymbolView
          name={item.iconName as any}
          size={20}
          tintColor={item.iconColor}
        />
      </View>

      <View className="flex-1">
        <Text variant="callout">{item.title}</Text>
        {item.subtitle && (
          <Text variant="body" className="text-muted-foreground mt-0.5">
            {item.subtitle}
          </Text>
        )}
      </View>

      {item.rightElement ||
        (item.action && (
          <SymbolView name="chevron.right" size={20} tintColor="#9CA3AF" />
        ))}
    </Pressable>
  );
}

export default function AccountSettingsModal() {
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguageSwitcher();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Theme management
  const themePreference = useTheme();
  const currentTheme = useCurrentTheme();
  const toggleTheme = useToggleTheme();

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const toggleNotifications = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    setNotificationsEnabled(!notificationsEnabled);
  }, [notificationsEnabled]);

  const handleToggleLanguage = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    toggleLanguage();
  }, [toggleLanguage]);

  const handleToggleTheme = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    toggleTheme();
  }, [toggleTheme]);

  const handleEditProfile = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/tabs/profile/edit-profile');
  }, []);

  const accountSettings: SettingItem[] = [
    {
      id: 'edit-profile',
      title: t('profile.settings.editProfile'),
      subtitle: t('profile.settings.editProfileSubtitle'),
      iconName: 'person.circle',
      iconColor: '#3B82F6',
      action: handleEditProfile,
    },
    {
      id: 'notifications',
      title: t('profile.settings.notifications'),
      subtitle: t('profile.settings.notificationsSubtitle'),
      iconName: 'bell.fill',
      iconColor: '#F59E0B',
      rightElement: (
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: '#767577', true: '#4ADE80' }}
          thumbColor="#ffffff"
        />
      ),
    },
    {
      id: 'language',
      title: t('profile.settings.language'),
      subtitle:
        currentLanguage === 'en'
          ? t('profile.languages.english')
          : t('profile.languages.arabic'),
      iconName: 'globe',
      iconColor: '#8B5CF6',
      action: handleToggleLanguage,
    },
    {
      id: 'theme',
      title: 'Theme',
      subtitle: `${currentTheme} (${themePreference === 'system' ? 'Auto' : 'Manual'})`,
      iconName: currentTheme === 'dark' ? 'moon.fill' : 'sun.max.fill',
      iconColor: currentTheme === 'dark' ? '#4F46E5' : '#F59E0B',
      action: handleToggleTheme,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={handleBack} className="mr-4">
          <SymbolView name="arrow.left" size={24} tintColor="#5A4A3A" />
        </Pressable>
        <Text variant="title2" className="text-[#2D3748] font-bold">
          {t('profile.sections.account')}
        </Text>
      </View>

      <View className="flex-1 p-6">
        <View
          className="rounded-3xl overflow-hidden border border-gray-200 bg-card"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {accountSettings.map((item, index) => (
            <SettingRow
              key={item.id}
              item={item}
              isLast={index === accountSettings.length - 1}
            />
          ))}
        </View>

        {/* Info Card */}
        <View className="mt-6 p-4 rounded-2xl border border-gray-200 bg-blue-400/10">
          <View className="flex-row items-center mb-2">
            <Text style={{ fontSize: 20, marginRight: 8 }}>ℹ️</Text>
            <Text variant="body" className="text-[#5A4A3A] font-semibold">
              Account Settings
            </Text>
          </View>
          <Text variant="caption1" className="text-gray-600 leading-5">
            Manage your account preferences, notifications, and appearance
            settings. Changes are saved automatically.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
