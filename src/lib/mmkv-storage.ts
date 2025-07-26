/**
 * Secure MMKV Storage for React Native
 * Uses device-specific encryption keys instead of hardcoded values
 */

import { MMKV } from 'react-native-mmkv';
import { getOrCreateMMKVKey, getFallbackKey } from './secure-key';
import { logger } from './logger';

// Single MMKV instance with secure encryption
let storage: MMKV;
let isInitialized = false;

// Initialize with fallback key first, then upgrade to secure key
try {
  storage = new MMKV({
    id: 'nafsy-app-storage',
    encryptionKey: getFallbackKey(),
  });
} catch (error) {
  logger.warn(
    'MMKV initialization failed, using unencrypted storage',
    'MMKV',
    error
  );
  storage = new MMKV({ id: 'nafsy-app-storage' });
}

// Async initialization with secure key
async function initializeSecureStorage(): Promise<void> {
  if (isInitialized) return;

  try {
    const secureKey = await getOrCreateMMKVKey();

    // Create new instance with secure key
    const secureStorage = new MMKV({
      id: 'nafsy-app-storage-secure',
      encryptionKey: secureKey,
    });

    // Migrate data if necessary (from fallback to secure storage)
    const keys = storage.getAllKeys();
    if (keys.length > 0) {
      logger.info('Migrating MMKV data to secure storage', 'MMKV');
      keys.forEach((key) => {
        const value = storage.getString(key);
        if (value !== null) {
          secureStorage.set(key, value);
        }
      });

      // Clear old storage
      storage.clearAll();
    }

    // Switch to secure storage
    storage = secureStorage;
    isInitialized = true;
    logger.info('MMKV secure storage initialized successfully', 'MMKV');
  } catch (error) {
    logger.warn('Failed to initialize secure MMKV storage', 'MMKV', error);
    // Continue with fallback storage
  }
}

// Initialize secure storage asynchronously
initializeSecureStorage();

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
 */
export { storage };

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
