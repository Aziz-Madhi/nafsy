import React from 'react';
import { Tabs } from 'expo-router';
import { CustomBottomNavigation } from '~/components/navigation/CustomBottomNavigation';
import { AuthGuard } from '~/components/auth/AuthGuard';

export default function TabsLayout() {
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 100,
          lazy: true,
          unmountOnBlur: false,
        }}
        tabBar={(props) => <CustomBottomNavigation {...props} />}
      >
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
          }}
        />
        <Tabs.Screen
          name="mood"
          options={{
            title: 'Mood',
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: 'Exercises',
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
