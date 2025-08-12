import { Appearance } from 'react-native';
import { NativeWindStyleSheet } from 'nativewind';

// Unified helpers for setting NativeWind scheme. Avoids forcing RN Appearance globally.
export const setNativeWindTheme = (theme: 'light' | 'dark') => {
  NativeWindStyleSheet.setColorScheme(theme);
};

export const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  const resolved =
    theme === 'system' ? Appearance.getColorScheme() || 'light' : theme;
  setNativeWindTheme(resolved);
  return resolved;
};
