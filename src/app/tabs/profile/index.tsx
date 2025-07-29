import React, { useEffect, useState, useCallback } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ProfileLayout } from '~/components/ui/ScreenLayout';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
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
import { useTranslation } from '~/hooks/useTranslation';

// Quick Action Card Component
function QuickActionCard({
  title,
  subtitle,
  iconName,
  iconColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  iconName: string;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white/80 rounded-2xl p-4 shadow-sm mb-3"
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: iconColor + '20' }}
        >
          <SymbolView name={iconName} size={20} tintColor={iconColor} />
        </View>

        <View className="flex-1">
          <Text variant="callout" className="font-semibold mb-1">
            {title}
          </Text>
          <Text variant="body" className="text-muted-foreground">
            {subtitle}
          </Text>
        </View>

        <SymbolView name="chevron.right" size={20} tintColor="#9CA3AF" />
      </View>
    </Pressable>
  );
}

export default function ProfileIndex() {
  // ===== AUTHENTICATION: Check first =====
  const { signOut, isSignedIn } = useAuth();
  const { user, isLoaded } = useUserSafe();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { t } = useTranslation();

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

  // Navigation handlers
  const handleAccountSettings = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/tabs/profile/account-settings');
  }, []);

  const handlePrivacySettings = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/tabs/profile/privacy-settings');
  }, []);

  const handleSupport = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/tabs/profile/support');
  }, []);

  const handleEditProfile = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/tabs/profile/edit-profile');
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
      {/* Quick Actions */}
      <View className="px-6">
        <Text
          variant="subhead"
          className="mb-4 uppercase text-muted-foreground font-medium"
        >
          {t('profile.sections.quickActions') || 'Quick Actions'}
        </Text>

        <QuickActionCard
          title={t('profile.sections.account')}
          subtitle="Manage notifications, language, theme settings"
          iconName="person.circle"
          iconColor="#3B82F6"
          onPress={handleAccountSettings}
        />

        <QuickActionCard
          title="Edit Profile"
          subtitle="Update your personal information and preferences"
          iconName="pencil.circle"
          iconColor="#10B981"
          onPress={handleEditProfile}
        />

        <QuickActionCard
          title={t('profile.sections.preferences')}
          subtitle="Privacy settings and data management"
          iconName="shield.fill"
          iconColor="#8B5CF6"
          onPress={handlePrivacySettings}
        />

        <QuickActionCard
          title={t('profile.sections.support')}
          subtitle="Get help, access crisis resources, and feedback"
          iconName="questionmark.circle"
          iconColor="#06B6D4"
          onPress={handleSupport}
        />
      </View>

      {/* Sign Out Button */}
      <Animated.View entering={FadeInDown.springify()} className="mt-8 px-6">
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
      <View className="items-center px-6" style={{ paddingBottom: 80 }}>
        <Text variant="footnote" className="text-muted-foreground">
          {t('profile.version')}
        </Text>
      </View>
    </ProfileLayout>
  );
}
