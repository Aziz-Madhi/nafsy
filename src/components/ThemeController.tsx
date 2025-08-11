import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { colorScheme } from 'nativewind';
import { useAppStore } from '~/store/useAppStore';

export function ThemeController() {
  const settings = useAppStore((state) => state.settings);

  useEffect(() => {
    if (settings.theme === 'system') {
      // Follow system preference
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
    } else {
      // Manual theme selection
      colorScheme.set(settings.theme);
    }
  }, [settings.theme]);

  return null;
}
