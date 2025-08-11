import { Appearance } from 'react-native';
import { NativeWindStyleSheet } from 'nativewind';

export const initializeTheme = (theme: 'light' | 'dark') => {
  // Set Appearance for React Native components
  Appearance.setColorScheme(theme);

  // Set Nativewind color scheme
  NativeWindStyleSheet.setColorScheme(theme);
};

export const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  const resolvedTheme =
    theme === 'system' ? Appearance.getColorScheme() || 'light' : theme;

  initializeTheme(resolvedTheme);
  return resolvedTheme;
};
