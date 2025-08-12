import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { MessageCircle, Heart, Activity, User } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { MorphingTabBar } from '~/components/navigation';
import { useColors } from '~/hooks/useColors';

export default function TabsLayout() {
  const colors = useColors();
  const activeColor = colors.primary;

  // Centralized auth guard - prevents hook order issues in individual screens
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();

  // Redirect on auth state change - prevents hook execution during transitions
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Use replace to prevent navigation stack issues
      router.replace('/auth/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // All tabs now load upfront for instant switching performance
  // No preloading needed - tabs load directly when app starts

  // Show loading until auth is resolved
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={activeColor} />
          <Text variant="body" className="text-muted-foreground mt-4">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render tabs if not authenticated - redirect will happen in useEffect
  if (!isSignedIn || !user) {
    return null;
  }

  return (
    <View className="flex-1 bg-background">
      <Tabs
        tabBar={(props) => <MorphingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          lazy: false,
        }}
      >
        <Tabs.Screen
          name="chat"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <MessageCircle
                size={28}
                color={color}
                fill={focused ? color : 'none'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="mood"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <Heart size={28} color={color} fill={focused ? color : 'none'} />
            ),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <Activity
                size={28}
                color={color}
                fill={focused ? color : 'none'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <User size={28} color={color} fill={focused ? color : 'none'} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
