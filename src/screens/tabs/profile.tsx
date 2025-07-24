import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Pressable, Switch, ActivityIndicator } from 'react-native';
import { ProfileLayout } from '~/components/ui/ScreenLayout';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Text } from '~/components/ui/text';
import { Avatar } from '~/components/ui/avatar';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from 'expo-haptics';
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

export default function ProfileScreen() {
  // ===== AUTHENTICATION: Check first =====
  const { signOut, isSignedIn } = useAuth();
  const { user, isLoaded } = useUserSafe();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguageSwitcher();

  // Theme management
  const themePreference = useTheme();
  const currentTheme = useCurrentTheme();
  const toggleTheme = useToggleTheme();

  // ===== CONVEX: Server data (move hooks before any early returns) =====
  const createUser = useMutation(api.users.createUser);
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn && isLoaded ? {} : 'skip'
  );

  // Move all hooks before any early returns
  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return; // Prevent multiple sign-out attempts

    try {
      setIsSigningOut(true);
      notificationAsync(NotificationFeedbackType.Warning);

      // Small delay to ensure UI state is stable before auth changes
      await new Promise((resolve) => setTimeout(resolve, 150));

      await signOut();
      // Let the automatic navigation in index.tsx and tab layout handle routing
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsSigningOut(false); // Reset on error
    }
  }, [isSigningOut, signOut]);

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

  const toggleNotifications = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleToggleLanguage = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    toggleLanguage();
  };

  const handleToggleTheme = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: t('profile.sections.account'),
      items: [
        {
          id: 'edit-profile',
          title: t('profile.settings.editProfile'),
          subtitle: t('profile.settings.editProfileSubtitle'),
          iconName: 'person.circle',
          iconColor: '#3B82F6',
          action: () => console.log('Edit profile'),
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
      ],
    },
    {
      title: t('profile.sections.preferences'),
      items: [
        {
          id: 'privacy',
          title: t('profile.settings.privacy'),
          subtitle: t('profile.settings.privacySubtitle'),
          iconName: 'shield.fill',
          iconColor: '#10B981',
          action: () => console.log('Privacy settings'),
        },
      ],
    },
    {
      title: t('profile.sections.support'),
      items: [
        {
          id: 'help',
          title: t('profile.settings.help'),
          subtitle: t('profile.settings.helpSubtitle'),
          iconName: 'questionmark.circle',
          iconColor: '#06B6D4',
          action: () => console.log('Help'),
        },
        {
          id: 'crisis',
          title: t('profile.settings.crisis'),
          subtitle: t('profile.settings.crisisSubtitle'),
          iconName: 'heart.fill',
          iconColor: '#EF4444',
          action: () => console.log('Crisis resources'),
        },
      ],
    },
  ];

  // Flatten settings for FlashList optimization
  const flattenedSettings = useMemo(() => {
    const items: { type: 'header' | 'item'; data: any; id: string }[] = [];

    settingsSections.forEach((section, sectionIndex) => {
      // Add section header
      items.push({
        type: 'header',
        data: { title: section.title, sectionIndex },
        id: `header-${sectionIndex}`,
      });

      // Add section items
      section.items.forEach((item, itemIndex) => {
        items.push({
          type: 'item',
          data: item,
          id: `${sectionIndex}-${itemIndex}`,
        });
      });
    });

    return items;
  }, [settingsSections]);

  // FlashList render functions
  const renderSettingItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (item.type === 'header') {
        return (
          <View className="mt-6">
            <Text
              variant="subhead"
              className="px-6 mb-3 uppercase text-muted-foreground font-medium"
            >
              {item.data.title}
            </Text>
          </View>
        );
      }

      return (
        <View className="px-6 mb-2">
          <View className="bg-white/80 rounded-2xl overflow-hidden shadow-sm">
            <SettingRow
              item={item.data}
              isLast={
                index === flattenedSettings.length - 1 ||
                flattenedSettings[index + 1]?.type === 'header'
              }
            />
          </View>
        </View>
      );
    },
    [flattenedSettings]
  );

  // User info card component (stats section)
  const userInfoCard = user ? (
    <Animated.View entering={FadeInDown.springify()}>
      <View className="bg-white/80 rounded-2xl p-6 shadow-sm">
        <View className="flex-row items-center">
          <Avatar alt={user.fullName || 'User'} className="h-20 w-20 mr-4">
            <Avatar.Image source={{ uri: user.imageUrl }} />
            <Avatar.Fallback>
              <Text variant="title3">
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
            <Text variant="title3" className="mb-1">
              {user.fullName || 'Anonymous User'}
            </Text>
            <Text variant="muted">
              {user.emailAddresses?.[0]?.emailAddress}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around mt-6 pt-6 border-t border-border/50">
          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <SymbolView name="award.fill" size={16} tintColor="#2196F3" />
              <Text variant="title3">7</Text>
            </View>
            <Text variant="footnote" className="text-muted-foreground">
              {t('profile.stats.dayStreak')}
            </Text>
          </View>
          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <SymbolView name="heart.fill" size={16} tintColor="#2196F3" />
              <Text variant="title3">24</Text>
            </View>
            <Text variant="footnote" className="text-muted-foreground">
              {t('profile.stats.sessions')}
            </Text>
          </View>
          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <Text className="text-primary mr-1">🧘</Text>
              <Text variant="title3">3.5h</Text>
            </View>
            <Text variant="footnote" className="text-muted-foreground">
              {t('profile.stats.totalTime')}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  ) : null;

  return (
    <ProfileLayout title={t('profile.title')} statsSection={userInfoCard}>
      {/* Settings Sections */}
      <View>
        {flattenedSettings.map((item, index) => (
          <View key={item.id}>{renderSettingItem({ item, index })}</View>
        ))}
      </View>

      {/* Sign Out Button */}
      <Animated.View entering={FadeInDown.springify()} className="mt-8">
        <Pressable
          onPress={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            'rounded-xl px-6 py-4 flex-row items-center justify-center',
            isSigningOut ? 'bg-gray-400' : 'bg-destructive'
          )}
        >
          {isSigningOut ? (
            <>
              <ActivityIndicator size="small" color="white" className="mr-2" />
              <Text className="text-white font-medium">
                {t('profile.signingOut') || 'Signing Out...'}
              </Text>
            </>
          ) : (
            <>
              <SymbolView
                name="power"
                size={20}
                tintColor="white"
                className="mr-2"
              />
              <Text className="text-white font-medium">
                {t('profile.signOut') || 'Sign Out'}
              </Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      {/* Version Info */}
      <View className="items-center" style={{ paddingBottom: 80 }}>
        <Text variant="footnote" className="text-muted-foreground">
          {t('profile.version')}
        </Text>
      </View>
    </ProfileLayout>
  );
}

interface SettingRowProps {
  item: SettingItem;
  isLast: boolean;
}

function SettingRow({ item, isLast }: SettingRowProps) {
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
        <SymbolView name={item.iconName} size={20} tintColor={item.iconColor} />
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
