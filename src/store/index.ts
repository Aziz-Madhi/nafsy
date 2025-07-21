// Central store exports
// Store persistence utilities
import { useAppStore } from './useAppStore';
import { useChatUIStore } from './useChatUIStore';

export * from './types';
export * from './useAppStore';
export * from './useChatUIStore';

// Global store reset utility
export const resetAllStores = () => {
  useAppStore.getState().resetStore();
  useChatUIStore.getState().resetChatUI();
  // Note: Chat data is managed by Convex, UI state by Zustand
};

// Store initialization utility for app startup
export const initializeStores = () => {
  // Initialize any required default state
  // This could load from AsyncStorage in the future
};

// TypeScript utility for store state types
export type AppStoreState = ReturnType<typeof useAppStore.getState>;
export type ChatUIStoreState = ReturnType<typeof useChatUIStore.getState>;
