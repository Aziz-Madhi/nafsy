import { useAppStore } from './useAppStore';

// Re-export everything from useAppStore for compatibility
export { useAppStore };

// Export commonly used selectors
export const useTheme = () => useAppStore((state) => state.settings.theme);
export const useLanguage = () =>
  useAppStore((state) => state.settings.language);
export const useNotificationsEnabled = () =>
  useAppStore((state) => state.settings.notificationsEnabled);
export const useSetTheme = () => useAppStore((state) => state.setTheme);
export const useSetLanguage = () =>
  useAppStore((state) => state.updateSettings);
export const useSetNotificationsEnabled = () =>
  useAppStore((state) => state.updateSettings);
