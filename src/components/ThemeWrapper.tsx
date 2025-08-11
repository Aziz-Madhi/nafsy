import React from 'react';
import { View } from 'react-native';
// ThemeWrapper no longer depends on store directly

interface ThemeWrapperProps {
  children: React.ReactNode;
}

// Simple wrapper that provides a consistent background using Tailwind tokens.
// Dark mode is handled globally by NativeWind's color scheme, not by a local "dark" class.
export function ThemeWrapper({ children }: ThemeWrapperProps) {
  return <View className="flex-1 bg-background">{children}</View>;
}
