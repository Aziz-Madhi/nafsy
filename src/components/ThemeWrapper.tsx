import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { colorScheme: currentScheme } = useColorScheme();

  // Apply dark class based on current scheme
  return (
    <View
      className={`flex-1 bg-background ${currentScheme === 'dark' ? 'dark' : ''}`}
    >
      {children}
    </View>
  );
}
