import React, { useEffect, useState } from 'react';
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
import { ThemeToggle } from '~/components/ui/theme-toggle';
import { 
  ChevronRight, 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  Moon,
  Globe,
  Heart,
  Award,
  Settings
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '~/lib/utils';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  action?: () => void;
  rightElement?: React.ReactNode;
}

export default function ProfileScreen() {
  const { signOut, isSignedIn } = useAuth();
  const { user, isLoaded } = useUserSafe();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  
  // Show loading state if Clerk hasn't loaded yet
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">Please sign in to continue</Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await signOut();
    router.replace('/auth/sign-in');
  };

  const toggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(!notificationsEnabled);
  };

  const toggleLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: User,
          iconColor: '#3B82F6',
          action: () => console.log('Edit profile'),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Manage your notification preferences',
          icon: Bell,
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
          title: 'Language',
          subtitle: language === 'en' ? 'English' : 'العربية',
          icon: Globe,
          iconColor: '#8B5CF6',
          action: toggleLanguage,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'theme',
          title: 'Appearance',
          subtitle: 'Light, Dark, or System',
          icon: Moon,
          iconColor: '#6366F1',
          rightElement: <ThemeToggle />,
        },
        {
          id: 'privacy',
          title: 'Privacy & Security',
          subtitle: 'Manage your data and privacy',
          icon: Shield,
          iconColor: '#10B981',
          action: () => console.log('Privacy settings'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help with the app',
          icon: HelpCircle,
          iconColor: '#06B6D4',
          action: () => console.log('Help'),
        },
        {
          id: 'crisis',
          title: 'Crisis Resources',
          subtitle: 'Emergency mental health support',
          icon: Heart,
          iconColor: '#EF4444',
          action: () => console.log('Crisis resources'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text variant="title1" className="mb-2">
            Profile
          </Text>
        </View>

        {/* User Info Card */}
        {user && (
          <Animated.View
            entering={FadeInDown.springify()}
            className="px-6 mt-4"
          >
            <Card className="p-6">
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
                    <Award size={16} className="text-primary mr-1" />
                    <Text variant="title3">7</Text>
                  </View>
                  <Text variant="muted" className="text-xs">
                    Day Streak
                  </Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-center mb-1">
                    <Heart size={16} className="text-primary mr-1" />
                    <Text variant="title3">24</Text>
                  </View>
                  <Text variant="muted" className="text-xs">
                    Sessions
                  </Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-primary mr-1">🧘</Text>
                    <Text variant="title3">3.5h</Text>
                  </View>
                  <Text variant="muted" className="text-xs">
                    Total Time
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay((sectionIndex + 1) * 100).springify()}
            className="mt-6"
          >
            <Text variant="muted" className="px-6 mb-3 text-sm uppercase">
              {section.title}
            </Text>
            
            <View className="px-6">
              <Card className="overflow-hidden">
                {section.items.map((item, index) => (
                  <SettingRow
                    key={item.id}
                    item={item}
                    isLast={index === section.items.length - 1}
                  />
                ))}
              </Card>
            </View>
          </Animated.View>
        ))}

        {/* Sign Out Button */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          className="px-6 mt-8 mb-6"
        >
          <Pressable
            onPress={handleSignOut}
            className="bg-destructive rounded-xl px-6 py-4 flex-row items-center justify-center"
          >
            <LogOut size={20} className="text-destructive-foreground mr-2" />
            <Text variant="body" className="text-destructive-foreground font-medium">
              Sign Out
            </Text>
          </Pressable>
        </Animated.View>

        {/* Version Info */}
        <View className="items-center mb-8">
          <Text variant="muted" className="text-xs">
            Nafsy v1.0.0
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

  const Icon = item.icon;

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
        <Icon size={22} style={{ color: item.iconColor }} />
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
        item.action && <ChevronRight size={20} className="text-muted-foreground" />
      )}
    </Pressable>
  );
}