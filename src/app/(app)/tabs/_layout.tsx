import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { FloatingTabBar } from '~/components/navigation/FloatingTabBar';
import { useColors } from '~/hooks/useColors';

// Create the ref outside the component so it can be exported
export const sendMessageRef = {
  current: null as ((message: string) => void) | null,
};

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
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          // Wrap to always read latest ref value at send time
          onSendMessage={(message: string) => {
            try {
              sendMessageRef.current?.(message);
            } catch {
              // No-op; chat screen may not be mounted yet
            }
          }}
        />
      )}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
        }}
        listeners={{
          focus: () => {
            // Hook will be set by the chat screen
          },
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
