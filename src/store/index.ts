// Central store exports
export * from './types';
export * from './useAppStore';
export * from './useChatUIStore';
export * from './useMoodStore';
export * from './useExerciseStore';

// Store persistence utilities
import { useAppStore } from './useAppStore';
import { useChatUIStore } from './useChatUIStore';
import { useMoodStore } from './useMoodStore';
import { useExerciseStore } from './useExerciseStore';

// Global store reset utility
export const resetAllStores = () => {
  useAppStore.getState().resetStore();
  useChatUIStore.getState().resetChatUI();
  // Note: Mood and Exercise stores don't have reset methods as they preserve user data
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
export type MoodStoreState = ReturnType<typeof useMoodStore.getState>;
export type ExerciseStoreState = ReturnType<typeof useExerciseStore.getState>;