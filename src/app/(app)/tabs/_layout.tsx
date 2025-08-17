import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { CustomBottomNavigation } from '~/components/navigation/CustomBottomNavigation';
import { useColors } from '~/hooks/useColors';

export default function TabsLayout() {
  const colors = useColors();
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while auth is being determined
  if (!isLoaded) {
    return null;
  }

  // Redirect to auth if not signed in (extra security layer)
  if (!isSignedIn) {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
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
  );
}
