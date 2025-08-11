import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { colorScheme } from 'nativewind';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const [currentScheme, setCurrentScheme] = useState(() => {
    try {
      return colorScheme.get() || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    console.log('🎨 ThemeWrapper mounted');
    
    // Poll nativewind colorScheme every 100ms to catch changes
    const interval = setInterval(() => {
      try {
        const scheme = colorScheme.get();
        if (scheme !== currentScheme) {
          console.log('🎨 NativeWind scheme changed from', currentScheme, 'to', scheme);
          setCurrentScheme(scheme);
        }
      } catch (error) {
        console.log('🎨 Error checking nativewind scheme:', error);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentScheme]);

  console.log('🎨 ThemeWrapper rendering with scheme:', currentScheme);
  const isDark = currentScheme === 'dark';

  // Apply dark class based on current scheme
  return (
    <View className={`flex-1 bg-background ${isDark ? 'dark' : ''}`}>
      {children}
    </View>
  );
}
