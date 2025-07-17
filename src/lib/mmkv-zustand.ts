import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { MMKV } from 'react-native-mmkv';

// Create dedicated MMKV instance for Zustand persistence
export const zustandStorage = new MMKV({
  id: 'zustand-persistence',
  encryptionKey: 'nafsy-state-encryption',
});

// MMKV-based storage adapter for Zustand
export const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = zustandStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    zustandStorage.set(name, value);
  },
  removeItem: (name: string): void => {
    zustandStorage.delete(name);
  },
};

// Enhanced persist middleware with MMKV
type PersistOptions<T> = {
  name: string;
  storage?: typeof mmkvStorage;
  partialize?: (state: T) => Partial<T>;
  skipHydration?: boolean;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
  merge?: (persistedState: any, currentState: T) => T;
};

type Persist<T> = {
  persist: {
    setOptions: (options: Partial<PersistOptions<T>>) => void;
    clearStorage: () => void;
    rehydrate: () => Promise<void>;
    hasHydrated: () => boolean;
    onHydrate?: (state: T) => void;
    onFinishHydration?: (state: T) => void;
  };
};

export type PersistStoreMutators<T> = [
  ['zustand/persist', Persist<T>]
];

declare module 'zustand/middleware' {
  interface StoreMutators<S, A> {
    'zustand/persist': WithPersist<S, A>;
  }
}

type WithPersist<S, A> = S extends { getState: () => infer T }
  ? S & { persist: Persist<T>['persist'] }
  : never;

// Create enhanced persist middleware
export const createMMKVPersist = <T>(
  f: StateCreator<T, [], [], T>,
  options: PersistOptions<T>
): StateCreator<T, [], PersistStoreMutators<T>, T & Persist<T>> => {
  const {
    name,
    storage = mmkvStorage,
    partialize = (state) => state,
    skipHydration = false,
    version = 0,
    migrate,
    merge = (persistedState, currentState) => ({
      ...currentState,
      ...persistedState,
    }),
  } = options;

  let hasHydrated = false;

  return (set, get, api) => {
    const originalState = f(set, get, api);

    // Hydrate state from MMKV on initialization
    const hydrate = async () => {
      if (skipHydration || hasHydrated) return;

      try {
        const item = storage.getItem(name);
        if (item) {
          const persistedState = JSON.parse(item);
          
          // Handle version migration
          let finalState = persistedState;
          if (migrate && persistedState._version !== version) {
            finalState = migrate(persistedState, version);
          }
          
          // Merge with current state
          const mergedState = merge(finalState, get());
          set(mergedState, true);
        }
      } catch (error) {
        console.warn('Failed to hydrate state from MMKV:', error);
      } finally {
        hasHydrated = true;
        if (options.onFinishHydration) {
          options.onFinishHydration(get());
        }
      }
    };

    // Auto-persist state changes
    const persistState = () => {
      try {
        const state = partialize(get());
        const persistData = {
          ...state,
          _version: version,
          _timestamp: Date.now(),
        };
        storage.setItem(name, JSON.stringify(persistData));
      } catch (error) {
        console.warn('Failed to persist state to MMKV:', error);
      }
    };

    // Enhanced set function with auto-persistence
    const enhancedSet: typeof set = (partial, replace) => {
      set(partial, replace);
      persistState();
    };

    // Initialize hydration
    if (!skipHydration) {
      hydrate();
    }

    return {
      ...originalState,
      persist: {
        setOptions: (newOptions) => {
          Object.assign(options, newOptions);
        },
        clearStorage: () => {
          storage.removeItem(name);
        },
        rehydrate: hydrate,
        hasHydrated: () => hasHydrated,
        onHydrate: options.onHydrate,
        onFinishHydration: options.onFinishHydration,
      },
    };
  };
};

// Performance optimized persist for specific stores
export const createFastPersist = <T>(name: string) => 
  createMMKVPersist<T>(
    (set, get, api) => ({} as T),
    {
      name,
      storage: mmkvStorage,
      skipHydration: false,
    }
  );

// Cache utilities for immediate state access
export const StateCache = {
  get: <T>(key: string): T | null => {
    try {
      const cached = zustandStorage.getString(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, data: T): void => {
    try {
      zustandStorage.set(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache state:', error);
    }
  },
  
  has: (key: string): boolean => {
    return zustandStorage.contains(key);
  },
  
  clear: (key: string): void => {
    zustandStorage.delete(key);
  },
};