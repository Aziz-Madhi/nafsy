/**
 * Simplified Store Index using the new store factory pattern
 * Replaces complex store management with straightforward exports
 */

// Store types
import { useAppStore } from './useAppStore';
import { useChatUIStore } from './useChatUIStore';

export * from './types';

// New simplified stores
export * from './useAppStore';
export * from './useChatUIStore';

// Re-export theme selectors for convenience
export { useTheme, useCurrentTheme, useToggleTheme } from './useAppStore';

// Global store reset utility (simplified)
export const resetAllStores = () => {
  useAppStore.getState().reset();
  useChatUIStore.getState().resetChatUI();
};

// Store initialization (no longer needed with new factory)
export const initializeStores = () => {
  // Stores auto-initialize with the new factory pattern
  console.log('Stores initialized via factory pattern');
};

// TypeScript utility types (simplified)
export type AppStoreState = ReturnType<typeof useAppStore.getState>;
export type ChatUIStoreState = ReturnType<typeof useChatUIStore.getState>;
