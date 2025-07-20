import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function TabsLayout() {
  const activeColor = '#2196F3'; // design primary blue
  const inputBarColor = 'rgba(255, 255, 255, 0.4)'; // Exact match to bg-white/40

  // Removed useAuth check - let individual screens handle auth
  // This might be causing the navigation context error

  return (
    <View style={{ flex: 1, backgroundColor: '#F2FAF9' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: '#9CA3AF',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderTopWidth: 0,
            height: 90, // Increased height for better proportions
            paddingBottom: 30, // More padding for home indicator
            paddingTop: 10,
          },
          // Restore original slide transition
          animation: 'shift',
        }}
      >
        <Tabs.Screen
          name="chat"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <SymbolView 
                name={focused ? "bubble.left.fill" : "bubble.left"} 
                size={28} 
                tintColor={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="mood"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <SymbolView 
                name={focused ? "heart.fill" : "heart"} 
                size={28} 
                tintColor={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <SymbolView 
                name={focused ? "leaf.fill" : "leaf"} 
                size={28} 
                tintColor={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <SymbolView 
                name={focused ? "person.fill" : "person"} 
                size={28} 
                tintColor={color} 
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}