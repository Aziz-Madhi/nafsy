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
  // Best-effort synchronous entropy for immediate initialization only.
  // If a synchronous crypto API is available, prefer it.
  try {
    const globalAny: any = global as any;
    if (globalAny?.crypto?.getRandomValues) {
      const arr = new Uint8Array(KEY_LENGTH);
      globalAny.crypto.getRandomValues(arr);
      return Array.from(arr, (byte) => byte.toString(16).padStart(2, '0')).join(
        ''
      );
    }
  } catch {}

  // Fallback: combine multiple PRNG calls and timers (not cryptographically secure)
  const now = Date.now();
  const randParts = [
    Math.random().toString(36).slice(2),
    Math.random().toString(36).slice(2),
    Math.random().toString(36).slice(2),
    now.toString(36),
  ];
  const base = randParts.join('');
  // Expand/trim to KEY_LENGTH*2 hex chars
  let hex = '';
  for (let i = 0; i < base.length; i++) {
    hex += base.charCodeAt(i).toString(16).padStart(2, '0');
    if (hex.length >= KEY_LENGTH * 2) break;
  }
  return hex.slice(0, KEY_LENGTH * 2);
}
