/**
 * Simplified App Store - Fixed version
 * Uses standard Zustand patterns with MMKV persistence
 */

import { createPersistedStore } from '~/lib/store-factory';
import { AppSettings } from './types';
import { Appearance } from 'react-native';
import { changeLanguage } from '~/lib/i18n';
import { saveLanguage } from '~/lib/mmkv-storage';
import {
  resolveLanguage,
  type SupportedLanguage,
} from '~/lib/language-utils';

// Helper function to resolve current theme
const resolveCurrentTheme = (
  themePreference: 'light' | 'dark' | 'system'
): 'light' | 'dark' => {
  if (themePreference === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return themePreference;
};

// applyRTLState function removed - RTL is now handled entirely in i18n.ts during initialization

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'system',
  notificationsEnabled: true,
  moodRemindersEnabled: true,
  moodReminderTime: '09:00',
};

// App store state and actions interface
interface AppStoreState {
  // UI State
  activeTab: string;
  currentTheme: 'light' | 'dark';
  currentLanguage: SupportedLanguage;
  isSystemTheme: boolean;
  isSystemLanguage: boolean;
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
  toggleLanguage: () => void;
  applySystemTheme: () => void;
  // Removed applySystemLanguage
  reset: () => void;
}

// RTL state initialization is handled by i18n.ts at startup
// Removed premature RTL application to fix language persistence issues

export const useAppStore = createPersistedStore<AppStoreState>(
  { name: 'app-store' },
  (set, get) => ({
    // Initial state
    activeTab: 'mood',
    currentTheme: resolveCurrentTheme(defaultSettings.theme),
    currentLanguage: resolveLanguage(defaultSettings.language),
    isSystemTheme: defaultSettings.theme === 'system',
    isSystemLanguage: defaultSettings.language === 'system',
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

      let stateUpdate: any = { settings: updatedSettings };

      // Handle theme updates
      if (newSettings.theme && newSettings.theme !== currentSettings.theme) {
        const newTheme = resolveCurrentTheme(newSettings.theme);
        const isSystemTheme = newSettings.theme === 'system';

        stateUpdate.currentTheme = newTheme;
        stateUpdate.isSystemTheme = isSystemTheme;
      }

      // Handle language updates
      if (
        newSettings.language &&
        newSettings.language !== currentSettings.language
      ) {
        const newLanguage = resolveLanguage(newSettings.language);
        const isSystemLanguage = newSettings.language === 'system';

        stateUpdate.currentLanguage = newLanguage;
        stateUpdate.isSystemLanguage = isSystemLanguage;
      }

      set(stateUpdate);
    },

    setTheme: (theme: 'light' | 'dark' | 'system') => {
      get().updateSettings({ theme });
    },

    toggleLanguage: async () => {
      const currentLanguage = get().currentLanguage;
      const nextLanguage: SupportedLanguage = currentLanguage === 'en' ? 'ar' : 'en';

      try {
        // 1) Update i18n immediately
        await changeLanguage(nextLanguage);

        // 2) Update store state
        set({
          currentLanguage: nextLanguage,
          isSystemLanguage: false, // User explicitly chose a language
          settings: {
            ...get().settings,
            language: nextLanguage,
          },
        });

        // 3) Save to MMKV for persistence
        saveLanguage(nextLanguage);

        console.log('🌐 Language toggled to:', nextLanguage);
      } catch (error) {
        console.error('🌐 Failed to toggle language:', error);
      }
    },

    toggleTheme: () => {
      const { currentTheme } = get();
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      get().setTheme(newTheme);
    },

    applySystemTheme: () => {
      const { settings } = get();
      if (settings.theme === 'system') {
        const systemTheme = resolveCurrentTheme('system');
        set({ currentTheme: systemTheme });
      }
    },

    // Removed applySystemLanguage - language changes now handled by toggleLanguage()

    reset: () => {
      const resetLanguage = resolveLanguage(defaultSettings.language);

      set({
        activeTab: 'mood',
        currentTheme: resolveCurrentTheme(defaultSettings.theme),
        currentLanguage: resetLanguage,
        isSystemTheme: defaultSettings.theme === 'system',
        isSystemLanguage: defaultSettings.language === 'system',
        isLoading: false,
        error: null,
        settings: defaultSettings,
      });

      // Apply language change
      changeLanguage(resetLanguage).catch(console.error);
    },
  })
);

// Typed selectors for common use cases
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useCurrentTheme = () => useAppStore((state) => state.currentTheme);
export const useCurrentLanguage = () =>
  useAppStore((state) => state.currentLanguage);
export const useIsSystemTheme = () =>
  useAppStore((state) => state.isSystemTheme);
export const useIsSystemLanguage = () =>
  useAppStore((state) => state.isSystemLanguage);
export const useSettings = () => useAppStore((state) => state.settings);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);

// Convenience selectors
export const useTheme = () => useAppStore((state) => state.settings.theme);
export const useLanguage = () =>
  useAppStore((state) => state.settings.language);
export const useToggleTheme = () => useAppStore((state) => state.toggleTheme);
export const useToggleLanguage = () => useAppStore((state) => state.toggleLanguage);
export const useNotificationsEnabled = () =>
  useAppStore((state) => state.settings.notificationsEnabled);

// Action selectors - simplified to only include current functions
export const useAppActions = () =>
  useAppStore((state) => ({
    setActiveTab: state.setActiveTab,
    updateSettings: state.updateSettings,
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    toggleLanguage: state.toggleLanguage,
    applySystemTheme: state.applySystemTheme,
    // Removed applySystemLanguage
    setLoading: state.setLoading,
    setError: state.setError,
    reset: state.reset,
  }));
