import React, { useLayoutEffect } from 'react';
import { Appearance } from 'react-native';
import { colorScheme } from 'nativewind';
import { useTheme } from '~/store/useAppStore';

// Single source of truth for NativeWind's color scheme.
// Syncs NativeWind with user preference (light/dark/system) and system changes.
export const ThemeController = React.memo(function ThemeController() {
  const themePreference = useTheme();

  useLayoutEffect(() => {
    const resolve = () => {
      const system = Appearance.getColorScheme() || 'light';
      return themePreference === 'system'
        ? system === 'dark'
          ? 'dark'
          : 'light'
        : themePreference;
    };

    // Initialize
    colorScheme.set(resolve());

    // React to system theme changes when in system mode
    const subscription = Appearance.addChangeListener(() => {
      if (themePreference === 'system') {
        colorScheme.set(resolve());
      }
    });

    return () => subscription.remove();
  }, [themePreference]);

  return null;
});
