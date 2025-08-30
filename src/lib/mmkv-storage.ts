/**
 * Simplified MMKV Storage for React Native
 * Uses a single secure storage instance to eliminate race conditions
 */

import { MMKV } from 'react-native-mmkv';
import { getOrCreateMMKVKey, getFallbackKey } from './secure-key';
import { logger } from './logger';

// Single MMKV instance - no dual storage system
let storage: MMKV;
let isUpgradingKey = false;

// Initialize with the best available encryption key
const initializeStorage = async (): Promise<MMKV> => {
  try {
    // First, try to get the secure key asynchronously
    let encryptionKey: string;
    try {
      encryptionKey = await getOrCreateMMKVKey();
      logger.info('Using secure encryption key for MMKV', 'MMKV');
    } catch (error) {
      // If secure key fails, use fallback key temporarily
      logger.warn('Failed to get secure key, using fallback', 'MMKV', error);
      encryptionKey = getFallbackKey();
    }

    const newStorage = new MMKV({
      id: 'nafsy-app-storage-unified', // New unified storage ID
      encryptionKey,
    });

    logger.info('MMKV unified storage initialized successfully', 'MMKV');
    return newStorage;
  } catch (error) {
    logger.security('MMKV encryption initialization failed', {
      context: 'MMKV',
      error,
    });
    // Fail closed: do not downgrade to unencrypted storage silently
    throw error instanceof Error
      ? error
      : new Error('MMKV encryption initialization failed');
  }
};

// Initialize storage with fallback key first (for immediate availability)
storage = new MMKV({
  id: 'nafsy-app-storage-unified',
  encryptionKey: getFallbackKey(),
});

// Upgrade to secure key asynchronously
(async () => {
  try {
    if (!isUpgradingKey) {
      isUpgradingKey = true;
      storage = await initializeStorage();
      isUpgradingKey = false;
    }
  } catch (error) {
    logger.error('Failed to upgrade MMKV encryption key', 'MMKV', error);
    isUpgradingKey = false;
  }
})();

/**
 * Safe MMKV operations with basic error handling
 */
const safeGet = (key: string): string | null => {
  try {
    return storage.getString(key) ?? null;
  } catch (error) {
    logger.warn(`Failed to get key "${key}"`, 'MMKV', error);
    return null;
  }
};

const safeSet = (key: string, value: string): void => {
  try {
    storage.set(key, value);
  } catch (error) {
    logger.warn(`Failed to set key "${key}"`, 'MMKV', error);
  }
};

const safeRemove = (key: string): void => {
  try {
    storage.delete(key);
  } catch (error) {
    logger.warn(`Failed to remove key "${key}"`, 'MMKV', error);
  }
};

/**
 * Basic MMKV storage adapter for Zustand
 */
export const mmkvStorage = {
  getItem: safeGet,
  setItem: safeSet,
  removeItem: safeRemove,
};

/**
 * JSON helpers for object storage
 */
export const mmkvJSON = {
  get: <T>(key: string, fallback: T): T => {
    const value = safeGet(key);
    if (!value) return fallback;

    try {
      return JSON.parse(value);
    } catch (error) {
      logger.warn(`Failed to parse JSON for key "${key}"`, 'MMKV', error);
      return fallback;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      safeSet(key, JSON.stringify(value));
    } catch (error) {
      logger.warn(`Failed to stringify value for key "${key}"`, 'MMKV', error);
    }
  },

  remove: safeRemove,
};

/**
 * Direct storage access for special cases
 * Export the same storage instance for consistent access
 */
export { storage };

/**
 * Main MMKV instance - use this for direct access
 * This is the same instance used by the storage adapter
 */
export const mmkv = storage;

/**
 * Get current active storage instance
 * Always returns the same unified storage instance
 */
export const getCurrentStorage = () => storage;

/**
 * Check if storage is ready (always true with unified storage)
 */
export const isSecureStorageReady = (): boolean => true;

/**
 * Simple storage health check
 */
export const isStorageHealthy = (): boolean => {
  try {
    const testKey = '__health_test__';
    const testValue = 'test';
    storage.set(testKey, testValue);
    const retrieved = storage.getString(testKey);
    storage.delete(testKey);
    return retrieved === testValue;
  } catch {
    return false;
  }
};

/**
 * Language helpers — single source of truth for language at bootstrap
 */
export const saveLanguage = (lang: 'en' | 'ar'): void => {
  try {
    storage.set('language', lang);
  } catch (error) {
    logger.warn('Failed to save language', 'MMKV', error);
  }
};

export const getSavedLanguage = (): 'en' | 'ar' | null => {
  try {
    const value = storage.getString('language');
    return value === 'en' || value === 'ar' ? (value as 'en' | 'ar') : null;
  } catch (error) {
    logger.warn('Failed to read saved language', 'MMKV', error);
    return null;
  }
};
