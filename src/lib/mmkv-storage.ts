/**
 * Simplified MMKV Storage for React Native
 * Replaces the over-engineered 1220-line mmkv-zustand.ts with essential functionality
 */

import { MMKV } from 'react-native-mmkv';

// Single MMKV instance with basic error handling
let storage: MMKV;

try {
  storage = new MMKV({
    id: 'nafsy-app-storage',
    encryptionKey: 'nafsy-encryption-key',
  });
} catch (error) {
  console.warn('MMKV encryption failed, using unencrypted storage:', error);
  storage = new MMKV({ id: 'nafsy-app-storage' });
}

/**
 * Safe MMKV operations with basic error handling
 */
const safeGet = (key: string): string | null => {
  try {
    return storage.getString(key) ?? null;
  } catch (error) {
    console.warn(`Failed to get key "${key}":`, error);
    return null;
  }
};

const safeSet = (key: string, value: string): void => {
  try {
    storage.set(key, value);
  } catch (error) {
    console.warn(`Failed to set key "${key}":`, error);
  }
};

const safeRemove = (key: string): void => {
  try {
    storage.delete(key);
  } catch (error) {
    console.warn(`Failed to remove key "${key}":`, error);
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
      console.warn(`Failed to parse JSON for key "${key}":`, error);
      return fallback;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      safeSet(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to stringify value for key "${key}":`, error);
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
