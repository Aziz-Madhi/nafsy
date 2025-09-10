import React from 'react';
import { Stack } from 'expo-router';
import { useColors } from '~/hooks/useColors';

export default function OnboardingLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
      initialRouteName="profile"
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="mood" />
      <Stack.Screen name="preferences" />
      <Stack.Screen
        name="complete"
        options={{
          // keep its own transition for the final page
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
