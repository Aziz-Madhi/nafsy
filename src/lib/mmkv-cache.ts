import { MMKV } from 'react-native-mmkv';

// Create MMKV instance for tab caching
export const tabCache = new MMKV({
  id: 'tab-cache',
  encryptionKey: 'nafsy-tab-performance',
});

// Cache keys
export const CACHE_KEYS = {
  CHAT_MESSAGES: 'chat_messages',
  MOOD_DATA: 'mood_data', 
  EXERCISES_DATA: 'exercises_data',
  PROFILE_DATA: 'profile_data',
  TAB_STATES: 'tab_states',
} as const;

// Helper functions for tab data caching
export const TabCacheUtils = {
  // Store data with instant retrieval
  set: (key: string, data: any) => {
    tabCache.set(key, JSON.stringify(data));
  },

  // Get cached data (ultra-fast, no async)
  get: <T>(key: string, fallback?: T): T | undefined => {
    try {
      const cached = tabCache.getString(key);
      return cached ? JSON.parse(cached) : fallback;
    } catch {
      return fallback;
    }
  },

  // Check if data exists
  has: (key: string): boolean => {
    return tabCache.contains(key);
  },

  // Clear specific cache
  clear: (key: string) => {
    tabCache.delete(key);
  },

  // Clear all tab cache
  clearAll: () => {
    tabCache.clearAll();
  },
};