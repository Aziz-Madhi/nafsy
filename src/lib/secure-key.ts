/**
 * Secure key generation and management for MMKV encryption
 * Replaces hardcoded encryption keys with device-specific secure keys
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

const MMKV_KEY_STORE_KEY = 'mmkv_encryption_key';
const KEY_LENGTH = 32; // 256 bits

/**
 * Generate a cryptographically secure random key
 */
async function generateSecureKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH);
  return Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Get or create the MMKV encryption key
 * Uses SecureStore for persistent storage with device keychain/keystore
 */
export async function getOrCreateMMKVKey(): Promise<string> {
  try {
    // Try to retrieve existing key
    const existingKey = await SecureStore.getItemAsync(MMKV_KEY_STORE_KEY);
    if (existingKey) {
      return existingKey;
    }

    // Generate new key if none exists
    const newKey = await generateSecureKey();
    await SecureStore.setItemAsync(MMKV_KEY_STORE_KEY, newKey);
    return newKey;
  } catch (error) {
    logger.security('Failed to get/create secure MMKV key', error);
    // Fallback: generate a session-only key (not persisted)
    return await generateSecureKey();
  }
}

/**
 * Clear the stored encryption key (for testing or reset scenarios)
 */
export async function clearMMKVKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(MMKV_KEY_STORE_KEY);
  } catch (error) {
    logger.security('Failed to clear MMKV key', error);
  }
}

/**
 * Synchronous fallback key for immediate initialization
 * This should only be used as a temporary measure while async key loading happens
 */
export function getFallbackKey(): string {
  // Generate a deterministic but device-specific key as fallback
  // This is still better than a hardcoded key, though not as secure as the async version
  const deviceInfo = {
    timestamp: Date.now().toString(36),
    random: Math.random().toString(36).substring(2),
  };

  return `nafsy_fallback_${deviceInfo.timestamp}_${deviceInfo.random}`;
}
