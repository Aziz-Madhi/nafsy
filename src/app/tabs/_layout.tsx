import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  
  const activeColor = '#2196F3'; // design primary blue
  const inputBarColor = '#8D6E63';

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: '#D2BD96' }}>
        <ActivityIndicator size="large" color={activeColor} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#D2BD96' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: '#9CA3AF',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: inputBarColor,
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