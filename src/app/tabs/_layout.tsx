import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const colorScheme = useColorScheme();
  
  const activeColor = '#3b82f6'; // primary blue
  const isDark = colorScheme === 'dark';

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={activeColor} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        headerShown: false,
        tabBarStyle: {
          paddingTop: 4,
          borderTopWidth: 1,
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderTopColor: isDark ? '#374151' : '#E5E7EB',
        },
      }}
    >
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mood"
          options={{
            title: 'Mood',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: 'Exercises',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="fitness" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
  );
}