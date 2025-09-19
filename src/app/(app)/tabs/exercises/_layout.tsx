import React from 'react';
import { Stack } from 'expo-router';
import { useColors } from '~/hooks/useColors';

export default function ExercisesLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Use standard card transitions to avoid stacking multiple modals
        presentation: 'card',
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Main exercises tab screen */}
      <Stack.Screen name="index" />

      {/* Category list as a normal pushed screen (not modal) */}
      <Stack.Screen
        name="category/[id]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
          contentStyle: { backgroundColor: colors.background },
        }}
      />

      {/* Exercise detail route removed; tap plays audio immediately */}
    </Stack>
  );
}
