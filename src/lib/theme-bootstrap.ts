import { Appearance } from 'react-native';
import { colorScheme } from 'nativewind';

// Synchronously set NativeWind's color scheme before any components render.
// This prevents an initial "light" pass and avoids white flashes on first mount.
try {
  const system = Appearance.getColorScheme();
  colorScheme.set(system === 'dark' ? 'dark' : 'light');
} catch {}
export {};
