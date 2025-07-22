import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createMMKVPersist, PersistStoreMutators } from '~/lib/mmkv-zustand';
import { AppSettings } from './types';
import { Appearance } from 'react-native';

interface AppState {
  // UI State
  activeTab: string;
  isLoading: boolean;

  // Theme state (computed from settings)
  currentTheme: 'light' | 'dark';
  isSystemTheme: boolean;

  // Settings
  settings: AppSettings;

  // Actions
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetStore: () => void;

  // Theme-specific actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  applySystemTheme: () => void;

  // Persist methods (added by middleware)
  persist: {
    hasHydrated: () => boolean;
    rehydrate: () => Promise<void>;
    clearStorage: () => void;
    getHydrationState: () => any;
  };
}

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

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    createMMKVPersist(
      (set, get) => {
        // Initialize theme state
        const initialTheme = resolveCurrentTheme(defaultSettings.theme);

        return {
          // Initial state
          activeTab: 'mood',
          isLoading: false,
          currentTheme: initialTheme,
          isSystemTheme: defaultSettings.theme === 'system',
          settings: defaultSettings,

          // Actions
          setActiveTab: (tab) => set({ activeTab: tab }),

          setLoading: (loading) => set({ isLoading: loading }),

          updateSettings: (newSettings) => {
            const currentSettings = get().settings;
            const updatedSettings = { ...currentSettings, ...newSettings };

            // Handle language updates
            if (
              newSettings.language &&
              newSettings.language !== currentSettings.language
            ) {
              import('~/lib/i18n')
                .then(({ setLocale }) => {
                  setLocale(newSettings.language);
                })
                .catch((error) => {
                  console.warn('Failed to update i18n locale:', error);
                });
            }

            // Handle theme updates
            if (
              newSettings.theme &&
              newSettings.theme !== currentSettings.theme
            ) {
              const newCurrentTheme = resolveCurrentTheme(newSettings.theme);
              set({
                settings: updatedSettings,
                currentTheme: newCurrentTheme,
                isSystemTheme: newSettings.theme === 'system',
              });
            } else {
              set({ settings: updatedSettings });
            }
          },

          // Theme-specific actions
          setTheme: (theme) => {
            const currentState = get();
            const newCurrentTheme = resolveCurrentTheme(theme);

            set({
              settings: { ...currentState.settings, theme },
              currentTheme: newCurrentTheme,
              isSystemTheme: theme === 'system',
            });
          },

          toggleTheme: () => {
            const currentState = get();
            const newTheme =
              currentState.currentTheme === 'light' ? 'dark' : 'light';

            set({
              settings: { ...currentState.settings, theme: newTheme },
              currentTheme: newTheme,
              isSystemTheme: false,
            });
          },

          applySystemTheme: () => {
            const currentState = get();
            if (currentState.isSystemTheme) {
              const systemTheme = resolveCurrentTheme('system');
              if (systemTheme !== currentState.currentTheme) {
                set({ currentTheme: systemTheme });
              }
            }
          },

          resetStore: () => {
            const initialTheme = resolveCurrentTheme(defaultSettings.theme);

            set({
              activeTab: 'mood',
              isLoading: false,
              currentTheme: initialTheme,
              isSystemTheme: defaultSettings.theme === 'system',
              settings: defaultSettings,
            });

            // Reset i18n to default language
            import('~/lib/i18n')
              .then(({ setLocale }) => {
                setLocale(defaultSettings.language);
              })
              .catch((error) => {
                console.warn('Failed to reset i18n locale:', error);
              });
          },
        };
      },
      {
        name: 'nafsy-app-store',
        partialize: (state) => ({
          // Only persist settings and activeTab, not loading states
          activeTab: state.activeTab,
          settings: state.settings,
        }),
        version: 1,
        // Initialize i18n when store hydrates
        onFinishHydration: (state) => {
          import('~/lib/i18n')
            .then(({ setLocale, getCurrentLocale }) => {
              const currentLocale = getCurrentLocale();
              const storeLocale = state.settings.language;

              // Sync i18n with store settings
              if (currentLocale !== storeLocale) {
                setLocale(storeLocale);
              }
            })
            .catch((error) => {
              console.warn(
                'Failed to sync i18n with store on hydration:',
                error
              );
            });
        },
      }
    )
  )
);

// Selectors for optimized subscriptions
export const useActiveTab = () => useAppStore((state) => state.activeTab);

export const useIsLoading = () => useAppStore((state) => state.isLoading);

export const useSettings = () => useAppStore((state) => state.settings);

// Theme selectors
export const useTheme = () => useAppStore((state) => state.settings.theme);

export const useCurrentTheme = () => useAppStore((state) => state.currentTheme);

export const useIsSystemTheme = () =>
  useAppStore((state) => state.isSystemTheme);

// Individual theme action selectors to avoid object recreation
export const useSetTheme = () => useAppStore((state) => state.setTheme);
export const useToggleTheme = () => useAppStore((state) => state.toggleTheme);
export const useApplySystemTheme = () =>
  useAppStore((state) => state.applySystemTheme);

// Language selectors
export const useLanguage = () =>
  useAppStore((state) => state.settings.language);
