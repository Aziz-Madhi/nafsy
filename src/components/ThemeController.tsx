import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { colorScheme } from 'nativewind';

export function ThemeController() {
  useEffect(() => {
    // Initialize with system theme for now
    const systemTheme = Appearance.getColorScheme() || 'light';
    colorScheme.set(systemTheme);

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(
      ({ colorScheme: newScheme }) => {
        const resolvedScheme = newScheme || 'light';
        colorScheme.set(resolvedScheme);
      }
    );

    return () => subscription.remove();
  }, []);

  return null;
}
