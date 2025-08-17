import { Appearance } from 'react-native';
import { colorScheme } from 'nativewind';
import { storage } from './mmkv-storage';

// Synchronously set NativeWind's color scheme before any components render.
// Prefer the persisted theme (if available), otherwise fall back to system.
try {
  let initial: 'light' | 'dark' | 'system' = 'system';

  // Read persisted app store from MMKV (Zustand persist key: 'app-store')
  const raw = storage.getString('app-store');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Zustand may store either the plain state or { state, version }
      const state = parsed?.state ?? parsed;
      const themePref = state?.settings?.theme ?? state?.theme;
      if (
        themePref === 'light' ||
        themePref === 'dark' ||
        themePref === 'system'
      ) {
        initial = themePref;
      }
    } catch {}
  }

  const resolved =
    initial === 'system'
      ? Appearance.getColorScheme() === 'dark'
        ? 'dark'
        : 'light'
      : (initial as 'light' | 'dark');

  colorScheme.set(resolved);
} catch {}
export {};
