/**
 * Simplified App Store - Fixed version
 * Uses standard Zustand patterns with MMKV persistence
 */

import { createPersistedStore } from '~/lib/store-factory';
import { AppSettings } from './types';
import { Appearance } from 'react-native';
import { changeLanguage } from '~/lib/i18n';
import {
  isRTLLanguage,
  resolveLanguage,
  type SupportedLanguage,
  type LanguagePreference,
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
  pendingLanguage: null, // Language to apply after restart
  languageChangeRequested: false, // Flag for restart prompt
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
  isRTL: boolean;
  isLoading: boolean;
  error: string | null;

  // Language Change State
  pendingLanguage: SupportedLanguage | null;
  languageChangeRequested: boolean;

  // Settings
  settings: AppSettings;

  // Actions
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: LanguagePreference) => void;
  setLanguagePreference: (language: LanguagePreference) => void;
  toggleTheme: () => void;
  applySystemTheme: () => void;
  applySystemLanguage: () => void;
  reset: () => void;

  // New Deferred Language Actions
  requestLanguageChange: (language: LanguagePreference) => void;
  cancelLanguageChange: () => void;
  applyPendingLanguage: () => Promise<void>;
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
    isRTL: isRTLLanguage(resolveLanguage(defaultSettings.language)),
    isLoading: false,
    error: null,

    // Language Change State
    pendingLanguage: null,
    languageChangeRequested: false,

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
        const isRTL = isRTLLanguage(newLanguage);

        stateUpdate.currentLanguage = newLanguage;
        stateUpdate.isSystemLanguage = isSystemLanguage;
        stateUpdate.isRTL = isRTL;

        // DO NOT apply language change immediately - this should only be for preference storage
        // Language changes that need immediate effect should use changeLanguage() directly
        console.warn(
          'updateSettings changed language preference but did not apply it immediately. Use changeLanguage() for immediate effect.'
        );
      }

      set(stateUpdate);
    },

    setTheme: (theme: 'light' | 'dark' | 'system') => {
      get().updateSettings({ theme });
    },

    setLanguage: (language: LanguagePreference) => {
      // DEPRECATED: Use requestLanguageChange() for proper deferred switching
      // This method is kept for backward compatibility but should not be used
      console.warn(
        'setLanguage is deprecated. Use requestLanguageChange() instead.'
      );
      get().updateSettings({ language });
    },

    setLanguagePreference: (language: LanguagePreference) => {
      // Store language preference only - no immediate application
      set({
        settings: {
          ...get().settings,
          language,
        },
      });
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

    applySystemLanguage: () => {
      const { settings } = get();
      if (settings.language === 'system') {
        const systemLanguage = resolveLanguage('system');
        const isRTL = isRTLLanguage(systemLanguage);

        set({
          currentLanguage: systemLanguage,
          isRTL,
        });

        changeLanguage(systemLanguage).catch(console.error);
      }
    },

    reset: () => {
      const resetLanguage = resolveLanguage(defaultSettings.language);

      set({
        activeTab: 'mood',
        currentTheme: resolveCurrentTheme(defaultSettings.theme),
        currentLanguage: resetLanguage,
        isSystemTheme: defaultSettings.theme === 'system',
        isSystemLanguage: defaultSettings.language === 'system',
        isRTL: isRTLLanguage(resetLanguage),
        isLoading: false,
        error: null,
        pendingLanguage: null,
        languageChangeRequested: false,
        settings: defaultSettings,
      });

      // Apply language change
      changeLanguage(resetLanguage).catch(console.error);
    },

    // New Deferred Language Actions
    requestLanguageChange: (language: LanguagePreference) => {
      const resolvedLanguage = resolveLanguage(language);
      const currentLanguage = get().currentLanguage;

      if (resolvedLanguage === currentLanguage) {
        return; // No change needed
      }

      console.log('🎯 Store: Requesting language change to:', resolvedLanguage);

      // Store the pending language without applying it
      set({
        pendingLanguage: resolvedLanguage,
        languageChangeRequested: true,
        settings: {
          ...get().settings,
          pendingLanguage: resolvedLanguage,
          languageChangeRequested: true,
        },
      });

      console.log('🎯 Store: Pending language saved to store');
    },

    cancelLanguageChange: () => {
      set({
        pendingLanguage: null,
        languageChangeRequested: false,
        settings: {
          ...get().settings,
          pendingLanguage: null,
          languageChangeRequested: false,
        },
      });
    },

    applyPendingLanguage: async () => {
      const { pendingLanguage } = get();

      if (!pendingLanguage) return;

      try {
        console.log(
          '🎯 Store: Clearing pending language after i18n handled it:',
          pendingLanguage
        );

        // i18n.ts already applied the language and RTL during initialization
        // We just need to update the store state and clear the pending language
        set({
          currentLanguage: pendingLanguage,
          isRTL: isRTLLanguage(pendingLanguage),
          pendingLanguage: null,
          languageChangeRequested: false,
          settings: {
            ...get().settings,
            language: pendingLanguage,
            pendingLanguage: null,
            languageChangeRequested: false,
          },
        });

        console.log('🎯 Store: Pending language cleared, store state updated');
      } catch (error) {
        console.error('Failed to clear pending language state:', error);
        // Reset pending state on error
        get().cancelLanguageChange();
      }
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
export const useIsRTL = () => useAppStore((state) => state.isRTL);
export const useSettings = () => useAppStore((state) => state.settings);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);

// Convenience selectors
export const useTheme = () => useAppStore((state) => state.settings.theme);
export const useLanguage = () =>
  useAppStore((state) => state.settings.language);
export const useToggleTheme = () => useAppStore((state) => state.toggleTheme);
export const useNotificationsEnabled = () =>
  useAppStore((state) => state.settings.notificationsEnabled);

// Action selectors - removed shallow comparison to fix TypeScript error
export const useAppActions = () =>
  useAppStore((state) => ({
    setActiveTab: state.setActiveTab,
    updateSettings: state.updateSettings,
    setTheme: state.setTheme,
    setLanguage: state.setLanguage,
    setLanguagePreference: state.setLanguagePreference,
    toggleTheme: state.toggleTheme,
    applySystemTheme: state.applySystemTheme,
    applySystemLanguage: state.applySystemLanguage,
    setLoading: state.setLoading,
    setError: state.setError,
    reset: state.reset,
    requestLanguageChange: state.requestLanguageChange,
    cancelLanguageChange: state.cancelLanguageChange,
    applyPendingLanguage: state.applyPendingLanguage,
  }));
