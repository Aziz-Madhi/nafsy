import { create } from 'zustand';
import type { AppSettings } from '~/store/types';

/**
 * Fallback storage mechanism when MMKV is not available
 */
class FallbackStorage {
  private storage: Map<string, string> = new Map();

  get(key: string): string | null {
    return this.storage.get(key) || null;
  }

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  clear(): void {
    this.storage.clear();
  }
}

const fallbackStorage = new FallbackStorage();

/**
 * Default app settings for fallback scenarios
 */
export const defaultAppSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  moodRemindersEnabled: true,
  moodReminderTime: '09:00',
};

/**
 * Default chat UI state for fallback scenarios
 */
export const defaultChatUIState = {
  isFloatingChatVisible: false,
  floatingChatInput: '',
  floatingChatIsTyping: false,
  mainChatInput: '',
  mainChatIsTyping: false,
  showQuickReplies: true,
  currentMainSessionId: null,
  currentVentSessionId: null,
  sessionSwitchLoading: false,
  isHistorySidebarVisible: false,
  chatInputFocused: false,
};

/**
 * Emergency fallback app store for when both Zustand and MMKV fail
 */
interface EmergencyAppState {
  settings: AppSettings;
  activeTab: string;
  isLoading: boolean;
  currentTheme: 'light' | 'dark';

  // Actions
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  toggleTheme: () => void;
  resetStore: () => void;
}

const createEmergencyAppStore = () =>
  create<EmergencyAppState>((set, get) => ({
    settings: { ...defaultAppSettings },
    activeTab: 'mood',
    isLoading: false,
    currentTheme: 'light',

    updateSettings: (newSettings) => {
      const currentSettings = get().settings;
      const updatedSettings = { ...currentSettings, ...newSettings };

      // Handle theme changes
      let newCurrentTheme = get().currentTheme;
      if (newSettings.theme) {
        if (newSettings.theme === 'system') {
          // Basic system theme detection fallback
          try {
            const prefersDark = window?.matchMedia?.(
              '(prefers-color-scheme: dark)'
            )?.matches;
            newCurrentTheme = prefersDark ? 'dark' : 'light';
          } catch {
            newCurrentTheme = 'light';
          }
        } else {
          newCurrentTheme = newSettings.theme;
        }
      }

      set({
        settings: updatedSettings,
        currentTheme: newCurrentTheme,
      });

      // Persist to fallback storage
      try {
        fallbackStorage.set(
          'emergency_app_settings',
          JSON.stringify(updatedSettings)
        );
      } catch (error) {
        console.warn('Failed to persist emergency app settings:', error);
      }
    },

    setActiveTab: (tab) => {
      set({ activeTab: tab });
      try {
        fallbackStorage.set('emergency_active_tab', tab);
      } catch (error) {
        console.warn('Failed to persist emergency active tab:', error);
      }
    },

    setLoading: (loading) => set({ isLoading: loading }),

    toggleTheme: () => {
      const currentSettings = get().settings;
      const newTheme = get().currentTheme === 'light' ? 'dark' : 'light';

      set({
        settings: { ...currentSettings, theme: newTheme },
        currentTheme: newTheme,
      });

      try {
        fallbackStorage.set(
          'emergency_app_settings',
          JSON.stringify({
            ...currentSettings,
            theme: newTheme,
          })
        );
      } catch (error) {
        console.warn('Failed to persist emergency theme:', error);
      }
    },

    resetStore: () => {
      set({
        settings: { ...defaultAppSettings },
        activeTab: 'mood',
        isLoading: false,
        currentTheme: 'light',
      });

      try {
        fallbackStorage.clear();
      } catch (error) {
        console.warn('Failed to clear emergency storage:', error);
      }
    },
  }));

/**
 * Emergency fallback chat UI store
 */
interface EmergencyChatUIState {
  isFloatingChatVisible: boolean;
  mainChatInput: string;
  showQuickReplies: boolean;
  currentMainSessionId: string | null;
  isHistorySidebarVisible: boolean;

  // Actions
  setFloatingChatVisible: (visible: boolean) => void;
  setMainChatInput: (input: string) => void;
  setShowQuickReplies: (show: boolean) => void;
  setCurrentMainSessionId: (sessionId: string | null) => void;
  setHistorySidebarVisible: (visible: boolean) => void;
  resetChatUI: () => void;
}

const createEmergencyChatUIStore = () =>
  create<EmergencyChatUIState>((set) => ({
    ...defaultChatUIState,

    setFloatingChatVisible: (visible) =>
      set({ isFloatingChatVisible: visible }),
    setMainChatInput: (input) => set({ mainChatInput: input }),
    setShowQuickReplies: (show) => set({ showQuickReplies: show }),
    setCurrentMainSessionId: (sessionId) =>
      set({ currentMainSessionId: sessionId }),
    setHistorySidebarVisible: (visible) =>
      set({ isHistorySidebarVisible: visible }),

    resetChatUI: () => set({ ...defaultChatUIState }),
  }));

/**
 * Store fallback manager
 */
class StoreFallbackManager {
  private emergencyAppStore: ReturnType<typeof createEmergencyAppStore> | null =
    null;
  private emergencyChatUIStore: ReturnType<
    typeof createEmergencyChatUIStore
  > | null = null;
  private isInFallbackMode = false;

  /**
   * Enable fallback mode when primary stores fail
   */
  enableFallbackMode(): void {
    if (this.isInFallbackMode) return;

    console.warn('Entering store fallback mode due to primary store failures');
    this.isInFallbackMode = true;

    // Initialize emergency stores
    this.emergencyAppStore = createEmergencyAppStore();
    this.emergencyChatUIStore = createEmergencyChatUIStore();

    // Load any persisted fallback data
    this.loadFallbackData();
  }

  /**
   * Disable fallback mode when primary stores are recovered
   */
  disableFallbackMode(): void {
    if (!this.isInFallbackMode) return;

    console.log('Exiting store fallback mode - primary stores recovered');
    this.isInFallbackMode = false;

    // Clean up emergency stores
    this.emergencyAppStore = null;
    this.emergencyChatUIStore = null;
  }

  /**
   * Check if currently in fallback mode
   */
  isInFallback(): boolean {
    return this.isInFallbackMode;
  }

  /**
   * Get emergency app store
   */
  getEmergencyAppStore(): ReturnType<typeof createEmergencyAppStore> | null {
    return this.emergencyAppStore;
  }

  /**
   * Get emergency chat UI store
   */
  getEmergencyChatUIStore(): ReturnType<
    typeof createEmergencyChatUIStore
  > | null {
    return this.emergencyChatUIStore;
  }

  /**
   * Attempt to recover from fallback mode
   */
  attemptRecovery(): boolean {
    try {
      // Test if primary stores are working
      const testStore = create(() => ({ test: true }));
      testStore.getState();

      // If we get here, stores are working
      this.disableFallbackMode();
      return true;
    } catch (error) {
      console.warn('Store recovery failed:', error);
      return false;
    }
  }

  /**
   * Get fallback data for store migration
   */
  getFallbackData(): { appSettings: AppSettings; activeTab: string } | null {
    try {
      const settingsJson = fallbackStorage.get('emergency_app_settings');
      const activeTab = fallbackStorage.get('emergency_active_tab') || 'mood';

      const settings = settingsJson
        ? { ...defaultAppSettings, ...JSON.parse(settingsJson) }
        : { ...defaultAppSettings };

      return { appSettings: settings, activeTab };
    } catch (error) {
      console.warn('Failed to get fallback data:', error);
      return null;
    }
  }

  /**
   * Create health report
   */
  getHealthReport(): {
    isInFallbackMode: boolean;
    fallbackDataAvailable: boolean;
    canAttemptRecovery: boolean;
    lastFallbackTime?: number;
  } {
    const fallbackData = this.getFallbackData();

    return {
      isInFallbackMode: this.isInFallbackMode,
      fallbackDataAvailable: fallbackData !== null,
      canAttemptRecovery: !this.isInFallbackMode,
      lastFallbackTime: this.isInFallbackMode ? Date.now() : undefined,
    };
  }

  private loadFallbackData(): void {
    try {
      const settingsJson = fallbackStorage.get('emergency_app_settings');
      const activeTab = fallbackStorage.get('emergency_active_tab');

      if (settingsJson && this.emergencyAppStore) {
        const settings = JSON.parse(settingsJson);
        this.emergencyAppStore.getState().updateSettings(settings);
      }

      if (activeTab && this.emergencyAppStore) {
        this.emergencyAppStore.getState().setActiveTab(activeTab);
      }
    } catch (error) {
      console.warn('Failed to load fallback data:', error);
    }
  }
}

// Singleton instance
export const storeFallbackManager = new StoreFallbackManager();

/**
 * Higher-order function to add fallback protection to store hooks
 */
export function withFallbackProtection<T>(
  hookFn: () => T,
  fallbackValue: T,
  storeName: string
): () => T {
  return () => {
    try {
      if (storeFallbackManager.isInFallback()) {
        console.warn(`Using fallback for ${storeName} store`);
        return fallbackValue;
      }

      return hookFn();
    } catch (error) {
      console.error(
        `Store hook ${storeName} failed, enabling fallback:`,
        error
      );
      storeFallbackManager.enableFallbackMode();
      return fallbackValue;
    }
  };
}

export { FallbackStorage };
