import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppSettings } from './types';

interface AppState {
  // UI State
  activeTab: string;
  isLoading: boolean;
  
  // Settings
  settings: AppSettings;
  
  // Actions
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetStore: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  moodRemindersEnabled: true,
  moodReminderTime: '09:00',
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    activeTab: 'mood',
    isLoading: false,
    settings: defaultSettings,

    // Actions
    setActiveTab: (tab) =>
      set({ activeTab: tab }),

    setLoading: (loading) =>
      set({ isLoading: loading }),

    updateSettings: (newSettings) =>
      set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

    resetStore: () =>
      set({
        activeTab: 'mood',
        isLoading: false,
        settings: defaultSettings,
      }),
  }))
);

// Selectors for optimized subscriptions
export const useActiveTab = () =>
  useAppStore((state) => state.activeTab);

export const useIsLoading = () =>
  useAppStore((state) => state.isLoading);

export const useSettings = () =>
  useAppStore((state) => state.settings);

export const useTheme = () =>
  useAppStore((state) => state.settings.theme);

export const useLanguage = () =>
  useAppStore((state) => state.settings.language);