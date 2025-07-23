/**
 * Simplified Store Factory - Working version
 * Creates Zustand stores with MMKV persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';

/**
 * Create a persisted store with automatic MMKV storage
 */
export function createPersistedStore<T>(name: string, storeCreator: any) {
  return create<T>()(
    persist(storeCreator, {
      name,
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
    })
  );
}

/**
 * Create typed selectors for a store (helper function)
 */
export function createSelectors<T>(store: any) {
  const selectors = {} as any;

  Object.keys(store.getState()).forEach((key) => {
    const selectorName = `use${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    selectors[selectorName] = () => store((state: T) => (state as any)[key]);
  });

  return selectors;
}

/**
 * Create async action wrapper (helper for async operations)
 */
export function createAsyncAction<T, Args extends any[]>(
  action: (...args: Args) => Promise<T>
) {
  return (set: any) =>
    async (...args: Args): Promise<T | null> => {
      try {
        const result = await action(...args);
        return result;
      } catch (error) {
        console.error('Async action failed:', error);
        return null;
      }
    };
}
