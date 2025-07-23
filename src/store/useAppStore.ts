/**
 * Simplified App Store - Fixed version
 * Uses standard Zustand patterns with MMKV persistence
 */

import { shallow } from 'zustand/shallow';
import { createPersistedStore } from '~/lib/store-factory';
import { AppSettings } from './types';
import { Appearance } from 'react-native';

// Helper function to resolve current theme
const resolveCurrentTheme = (
  themePreference: 'light' | 'dark' | 'system'
): 'light' | 'dark' => {
  if (themePreference === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return themePreference;
};

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  moodRemindersEnabled: true,
  moodReminderTime: '09:00',
};

// App store state and actions interface
interface AppStoreState {
  // UI State
  activeTab: string;
  currentTheme: 'light' | 'dark';
  isSystemTheme: boolean;
  isLoading: boolean;
  error: string | null;

  // Settings
  settings: AppSettings;

  // Actions
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  applySystemTheme: () => void;
  reset: () => void;
}

export const useAppStore = createPersistedStore<AppStoreState>(
  'app-store',
  (set: any, get: any) => ({
    // Initial state
    activeTab: 'mood',
    currentTheme: resolveCurrentTheme(defaultSettings.theme),
    isSystemTheme: defaultSettings.theme === 'system',
    isLoading: false,
    error: null,
    settings: defaultSettings,

    // Actions
    setActiveTab: (tab: string) => set({ activeTab: tab }),

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    setError: (error: string | null) => set({ error }),

    updateSettings: (newSettings: Partial<AppSettings>) => {
      const currentSettings = get().settings;
      const updatedSettings = { ...currentSettings, ...newSettings };

      // Handle language updates
      if (
        newSettings.language &&
        newSettings.language !== currentSettings.language
      ) {
        import('~/lib/i18n')
          .then(({ setLocale }) => setLocale(newSettings.language!))
          .catch((error) =>
            console.warn('Failed to update i18n locale:', error)
          );
      }

      // Handle theme updates
      if (newSettings.theme && newSettings.theme !== currentSettings.theme) {
        const newTheme = resolveCurrentTheme(newSettings.theme);
        const isSystem = newSettings.theme === 'system';

        set({
          settings: updatedSettings,
          currentTheme: newTheme,
          isSystemTheme: isSystem,
        });
      } else {
        set({ settings: updatedSettings });
      }
    },

    setTheme: (theme: 'light' | 'dark' | 'system') => {
      get().updateSettings({ theme });
    },

    toggleTheme: () => {
      const { currentTheme } = get();
      get().setTheme(currentTheme === 'light' ? 'dark' : 'light');
    },

    applySystemTheme: () => {
      const { settings } = get();
      if (settings.theme === 'system') {
        const systemTheme = resolveCurrentTheme('system');
        set({ currentTheme: systemTheme });
      }
    },

    reset: () => {
      set({
        activeTab: 'mood',
        currentTheme: resolveCurrentTheme(defaultSettings.theme),
        isSystemTheme: defaultSettings.theme === 'system',
        isLoading: false,
        error: null,
        settings: defaultSettings,
      });
    },
  })
);

// Typed selectors for common use cases
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useCurrentTheme = () => useAppStore((state) => state.currentTheme);
export const useIsSystemTheme = () =>
  useAppStore((state) => state.isSystemTheme);
export const useSettings = () => useAppStore((state) => state.settings);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);

// Convenience selectors
export const useTheme = () => useAppStore((state) => state.settings.theme);
export const useToggleTheme = () => useAppStore((state) => state.toggleTheme);
export const useLanguage = () =>
  useAppStore((state) => state.settings.language);
export const useNotificationsEnabled = () =>
  useAppStore((state) => state.settings.notificationsEnabled);

// Action selectors with shallow comparison
export const useAppActions = () =>
  useAppStore(
    (state) => ({
      setActiveTab: state.setActiveTab,
      updateSettings: state.updateSettings,
      setTheme: state.setTheme,
      toggleTheme: state.toggleTheme,
      applySystemTheme: state.applySystemTheme,
      setLoading: state.setLoading,
      setError: state.setError,
      reset: state.reset,
    }),
    shallow
  );
