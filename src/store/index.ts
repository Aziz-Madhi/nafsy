/**
 * Simplified Store Index using the new store factory pattern
 * Replaces complex store management with straightforward exports
 */

// Store types
import { useAppStore } from './useAppStore';
import { useChatUIStore } from './useChatUIStore';
import { useOnboardingStore } from './useOnboardingStore';

export * from './types';

// New simplified stores
export * from './useAppStore';
export * from './useChatUIStore';
export * from './useOnboardingStore';

// Global store reset utility (simplified)
export const resetAllStores = () => {
  useAppStore.getState().reset();
  useChatUIStore.getState().resetChatUI();
  useOnboardingStore.getState().reset();
};

// Store initialization (no longer needed with new factory)
export const initializeStores = () => {
  // Stores auto-initialize with the new factory pattern
  console.log('Stores initialized via factory pattern');
};

// TypeScript utility types (simplified)
export type AppStoreState = ReturnType<typeof useAppStore.getState>;
export type ChatUIStoreState = ReturnType<typeof useChatUIStore.getState>;
export type OnboardingStoreState = ReturnType<typeof useOnboardingStore.getState>;
