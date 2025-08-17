import React from 'react';
import { Tabs } from 'expo-router';
import { CustomBottomNavigation } from '~/components/navigation/CustomBottomNavigation';
import { AuthGuard } from '~/components/auth/AuthGuard';
import { useColors } from '~/hooks/useColors';

export default function TabsLayout() {
  const colors = useColors();
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 100,
          lazy: false, // mount all tabs to prevent first-switch flicker
          detachInactiveScreens: false,
          unmountOnBlur: false,
          sceneContainerStyle: { backgroundColor: colors.background },
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
