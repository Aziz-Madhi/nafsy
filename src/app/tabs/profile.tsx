import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Text } from '~/components/ui/text';
import { Avatar } from '~/components/ui/avatar';
import { Card } from '~/components/ui/card';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '~/lib/cn';
import { useTranslation, useLanguageSwitcher } from '~/hooks/useTranslation';

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
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguageSwitcher();
  
  // Show loading state if Clerk hasn't loaded yet
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">{t('common.pleaseSignIn')}</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // ===== CONVEX: Server data (after auth check) =====
  const createUser = useMutation(api.users.createUser);
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : 'skip'
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

  const handleSignOut = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await signOut();
      // Use router.push instead of replace to avoid potential navigation stack issues
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback navigation
      router.replace('/auth/sign-in');
    }
  };

  const toggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleToggleLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLanguage();
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
          subtitle: currentLanguage === 'en' ? t('profile.languages.english') : t('profile.languages.arabic'),
          iconName: 'globe',
          iconColor: '#8B5CF6',
          action: handleToggleLanguage,
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
    const items: Array<{ type: 'header' | 'item'; data: any; id: string }> = [];
    
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
  const renderSettingItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (item.type === 'header') {
      return (
        <View className="mt-6">
          <Text variant="muted" className="px-6 mb-3 text-sm uppercase">
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
            isLast={index === flattenedSettings.length - 1 || flattenedSettings[index + 1]?.type === 'header'} 
          />
        </View>
      </View>
    );
  }, [flattenedSettings]);

  const keyExtractor = useCallback((item: any) => item.id, []);
  const getItemType = useCallback((item: any) => item.type, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text variant="title1" className="text-[#5A4A3A] font-bold mb-2">
            {t('profile.title')}
          </Text>
        </View>

        {/* User Info Card */}
        {user && (
          <Animated.View
            entering={FadeInDown.springify()}
            className="px-6 mt-4"
          >
            <View className="bg-white/80 rounded-2xl p-6 shadow-sm">
              <View className="flex-row items-center">
                <Avatar alt={user.fullName || 'User'} className="h-20 w-20 mr-4">
                  <Avatar.Image source={{ uri: user.imageUrl }} />
                  <Avatar.Fallback>
                    <Text className="text-2xl">
                      {user.fullName?.charAt(0) || user.firstName?.charAt(0) || user.emailAddresses?.[0]?.emailAddress.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                
                <View className="flex-1">
                  <Text variant="title3" className="mb-1">
                    {user.fullName || 'Anonymous User'}
                  </Text>
                  <Text variant="muted" className="text-sm">
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
                  <Text variant="muted" className="text-xs">
                    {t('profile.stats.dayStreak')}
                  </Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-center mb-1">
                    <SymbolView name="heart.fill" size={16} tintColor="#2196F3" />
                    <Text variant="title3">24</Text>
                  </View>
                  <Text variant="muted" className="text-xs">
                    {t('profile.stats.sessions')}
                  </Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-primary mr-1">🧘</Text>
                    <Text variant="title3">3.5h</Text>
                  </View>
                  <Text variant="muted" className="text-xs">
                    {t('profile.stats.totalTime')}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Settings Sections */}
        <View>
          {flattenedSettings.map((item, index) => (
            <View key={item.id}>
              {renderSettingItem({ item, index })}
            </View>
          ))}
        </View>

        {/* Sign Out Button */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          className="px-6 mt-8 mb-6"
        >
          <Pressable
            onPress={handleSignOut}
            className="bg-destructive rounded-xl px-6 py-4 flex-row items-center justify-center"
          >
            <SymbolView name="rectangle.portrait.and.arrow.right" size={20} tintColor="white" />
            <Text variant="body" className="text-destructive-foreground font-medium">
              {t('common.signOut')}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Version Info */}
        <View className="items-center mb-8">
          <Text variant="muted" className="text-xs">
            {t('profile.version')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingRowProps {
  item: SettingItem;
  isLast: boolean;
}

function SettingRow({ item, isLast }: SettingRowProps) {
  const handlePress = () => {
    if (item.action) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <Text variant="body" className="font-medium">
          {item.title}
        </Text>
        {item.subtitle && (
          <Text variant="muted" className="text-sm mt-0.5">
            {item.subtitle}
          </Text>
        )}
      </View>
      
      {item.rightElement || (
        item.action && <SymbolView name="chevron.right" size={20} tintColor="#9CA3AF" />
      )}
    </Pressable>
  );
}