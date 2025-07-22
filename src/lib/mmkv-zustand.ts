import { StateCreator } from 'zustand';
import { MMKV } from 'react-native-mmkv';

// Error tracking for debugging
let mmkvErrorCount = 0;
let lastMMKVError: Error | null = null;

// Create dedicated MMKV instance for Zustand persistence with error handling
let zustandStorage: MMKV;

try {
  zustandStorage = new MMKV({
    id: 'zustand-persistence',
    encryptionKey: 'nafsy-state-encryption',
  });
} catch (error) {
  console.error('Failed to initialize MMKV storage:', error);
  // Create fallback instance without encryption
  zustandStorage = new MMKV({
    id: 'zustand-persistence-fallback',
  });
}

// Safe MMKV operations with error handling and fallbacks
const safeMMKVOperation = <T>(
  operation: () => T,
  fallback: T,
  operationName: string
): T => {
  try {
    return operation();
  } catch (error) {
    mmkvErrorCount++;
    lastMMKVError = error as Error;
    console.warn(`MMKV ${operationName} failed:`, error);

    // Report to error tracking if available
    if (typeof global.ErrorUtils !== 'undefined') {
      global.ErrorUtils.reportFatalError?.(error as Error);
    }

    return fallback;
  }
};

// Enhanced MMKV-based storage adapter for Zustand with error handling
export const mmkvStorage = {
  getItem: (name: string): string | null => {
    return safeMMKVOperation(
      () => {
        const value = zustandStorage.getString(name);
        return value ?? null;
      },
      null,
      `getItem(${name})`
    );
  },

  setItem: (name: string, value: string): void => {
    safeMMKVOperation(
      () => {
        zustandStorage.set(name, value);
        return undefined;
      },
      undefined,
      `setItem(${name})`
    );
  },

  removeItem: (name: string): void => {
    safeMMKVOperation(
      () => {
        zustandStorage.delete(name);
        return undefined;
      },
      undefined,
      `removeItem(${name})`
    );
  },
};

// Export the storage instance for direct access (with safety wrapper)
export { zustandStorage };

// Storage health check utilities
export const MMKVHealthCheck = {
  isHealthy: (): boolean => {
    return mmkvErrorCount < 5 && zustandStorage !== undefined;
  },

  getErrorCount: (): number => mmkvErrorCount,

  getLastError: (): Error | null => lastMMKVError,

  reset: (): void => {
    mmkvErrorCount = 0;
    lastMMKVError = null;
  },

  testStorage: (): boolean => {
    return safeMMKVOperation(
      () => {
        const testKey = '__mmkv_health_test__';
        const testValue = Date.now().toString();
        zustandStorage.set(testKey, testValue);
        const retrieved = zustandStorage.getString(testKey);
        zustandStorage.delete(testKey);
        return retrieved === testValue;
      },
      false,
      'testStorage'
    );
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

export type PersistStoreMutators<T> = [['zustand/persist', Persist<T>]];

declare module 'zustand/middleware' {
  interface StoreMutators<S> {
    'zustand/persist': WithPersist<S>;
  }
}

type WithPersist<S> = S extends { getState: () => infer T }
  ? S & { persist: Persist<T>['persist'] }
  : never;

// Enhanced hydration state tracking
interface HydrationState {
  isHydrating: boolean;
  hasHydrated: boolean;
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  lastAttempt: number;
}

// Create enhanced persist middleware with comprehensive error handling
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

  // Enhanced hydration tracking
  const hydrationState: HydrationState = {
    isHydrating: false,
    hasHydrated: false,
    hasError: false,
    error: null,
    retryCount: 0,
    lastAttempt: 0,
  };

  return (set, get, api) => {
    const originalState = f(set, get, api);

    // Enhanced hydrate with error recovery
    const hydrate = async (isRetry = false): Promise<void> => {
      if (skipHydration || (hydrationState.hasHydrated && !isRetry)) return;

      // Prevent concurrent hydrations
      if (hydrationState.isHydrating) {
        console.warn('Hydration already in progress, skipping');
        return;
      }

      hydrationState.isHydrating = true;
      hydrationState.lastAttempt = Date.now();

      try {
        // Call onHydrate callback if provided
        if (options.onHydrate) {
          options.onHydrate(get());
        }

        const item = storage.getItem(name);
        if (item) {
          // Safe JSON parsing with error handling
          let persistedState: any;
          try {
            persistedState = JSON.parse(item);
          } catch (parseError) {
            throw new Error(
              `JSON parse failed for store '${name}': ${parseError}`
            );
          }

          // Validate persisted state structure
          if (typeof persistedState !== 'object' || persistedState === null) {
            throw new Error(
              `Invalid persisted state structure for store '${name}'`
            );
          }

          // Handle version migration with error recovery
          let finalState = persistedState;
          if (migrate && persistedState._version !== version) {
            try {
              finalState = migrate(persistedState, version);
              // Add version to migrated state
              finalState._version = version;
            } catch (migrationError) {
              console.warn(
                `Migration failed for store '${name}':`,
                migrationError
              );
              // Use current state if migration fails
              finalState = { ...get(), _version: version };
            }
          }

          // Safe state merge with fallback
          try {
            const mergedState = merge(finalState, get());
            set(mergedState, true);
          } catch (mergeError) {
            console.warn(`State merge failed for store '${name}':`, mergeError);
            // Fallback to persisted state only
            set(finalState, true);
          }
        }

        // Mark as successfully hydrated
        hydrationState.hasHydrated = true;
        hydrationState.hasError = false;
        hydrationState.error = null;
        hydrationState.retryCount = 0;
      } catch (error) {
        const hydrateError = error as Error;
        hydrationState.hasError = true;
        hydrationState.error = hydrateError;
        hydrationState.retryCount++;

        console.warn(
          `Hydration failed for store '${name}' (attempt ${hydrationState.retryCount}):`,
          hydrateError
        );

        // Clear corrupted data if too many failures
        if (hydrationState.retryCount >= 3) {
          console.warn(
            `Clearing corrupted data for store '${name}' after ${hydrationState.retryCount} failed attempts`
          );
          storage.removeItem(name);
          // Reset to original state
          set(originalState, true);
          hydrationState.hasHydrated = true;
        }

        // Report error for debugging
        if (typeof global.ErrorUtils !== 'undefined') {
          global.ErrorUtils.reportFatalError?.(hydrateError);
        }
      } finally {
        hydrationState.isHydrating = false;

        // Call finish hydration callback
        if (options.onFinishHydration) {
          try {
            options.onFinishHydration(get());
          } catch (callbackError) {
            console.warn(
              `onFinishHydration callback failed for store '${name}':`,
              callbackError
            );
          }
        }
      }
    };

    // Enhanced persist operation with error handling
    const persistState = (state: T): void => {
      try {
        const stateToPersist = partialize(state);
        const stateWithVersion = { ...stateToPersist, _version: version };
        storage.setItem(name, JSON.stringify(stateWithVersion));
      } catch (error) {
        console.warn(`Failed to persist state for store '${name}':`, error);
      }
    };

    // Auto-persist on state changes
    api.persist = {
      setOptions: (newOptions) => {
        Object.assign(options, newOptions);
      },
      clearStorage: () => {
        try {
          storage.removeItem(name);
          hydrationState.hasHydrated = false;
          hydrationState.hasError = false;
          hydrationState.error = null;
        } catch (error) {
          console.warn(`Failed to clear storage for store '${name}':`, error);
        }
      },
      rehydrate: () => hydrate(true),
      hasHydrated: () => hydrationState.hasHydrated,
      getHydrationState: () => ({ ...hydrationState }),
      onHydrate: options.onHydrate,
      onFinishHydration: options.onFinishHydration,
    };

    // Initialize hydration
    if (!skipHydration) {
      // Use setTimeout to avoid blocking initialization
      setTimeout(() => hydrate(), 0);
    }

    return {
      ...originalState,
      persist: api.persist,
    };
  };
};

// Performance optimized persist for specific stores
export const createFastPersist = <T>(name: string) =>
  createMMKVPersist<T>((set, get, api) => ({}) as T, {
    name,
    storage: mmkvStorage,
    skipHydration: false,
  });

// Enhanced cache utilities with comprehensive error handling
export const StateCache = {
  get: <T>(key: string): T | null => {
    return safeMMKVOperation(
      () => {
        const cached = zustandStorage.getString(key);
        if (!cached) return null;

        try {
          return JSON.parse(cached) as T;
        } catch (parseError) {
          console.warn(
            `Failed to parse cached data for key '${key}':`,
            parseError
          );
          // Clear corrupted cache entry
          zustandStorage.delete(key);
          return null;
        }
      },
      null,
      `StateCache.get(${key})`
    );
  },

  set: <T>(key: string, data: T): boolean => {
    return safeMMKVOperation(
      () => {
        if (data === null || data === undefined) {
          zustandStorage.delete(key);
          return true;
        }

        const serialized = JSON.stringify(data);
        zustandStorage.set(key, serialized);
        return true;
      },
      false,
      `StateCache.set(${key})`
    );
  },

  has: (key: string): boolean => {
    return safeMMKVOperation(
      () => zustandStorage.contains(key),
      false,
      `StateCache.has(${key})`
    );
  },

  clear: (key: string): boolean => {
    return safeMMKVOperation(
      () => {
        zustandStorage.delete(key);
        return true;
      },
      false,
      `StateCache.clear(${key})`
    );
  },

  // Batch operations for better performance
  getMultiple: <T>(keys: string[]): Record<string, T | null> => {
    const results: Record<string, T | null> = {};
    for (const key of keys) {
      results[key] = StateCache.get<T>(key);
    }
    return results;
  },

  setMultiple: <T>(entries: { key: string; value: T }[]): boolean[] => {
    return entries.map(({ key, value }) => StateCache.set(key, value));
  },

  clearMultiple: (keys: string[]): boolean[] => {
    return keys.map((key) => StateCache.clear(key));
  },
};

// Enhanced animation state caching with error handling
export const AnimationCache = {
  // Cache scroll positions for instant restoration
  setScrollPosition: (screenId: string, position: number): boolean => {
    return safeMMKVOperation(
      () => {
        zustandStorage.set(`scroll_${screenId}`, position);
        return true;
      },
      false,
      `AnimationCache.setScrollPosition(${screenId})`
    );
  },

  getScrollPosition: (screenId: string): number => {
    return safeMMKVOperation(
      () => zustandStorage.getNumber(`scroll_${screenId}`) ?? 0,
      0,
      `AnimationCache.getScrollPosition(${screenId})`
    );
  },

  // Cache animation preferences
  setAnimationEnabled: (enabled: boolean): boolean => {
    return safeMMKVOperation(
      () => {
        zustandStorage.set('animations_enabled', enabled);
        return true;
      },
      false,
      'AnimationCache.setAnimationEnabled'
    );
  },

  getAnimationEnabled: (): boolean => {
    return safeMMKVOperation(
      () => zustandStorage.getBoolean('animations_enabled') ?? true,
      true,
      'AnimationCache.getAnimationEnabled'
    );
  },

  // Cache last UI state for instant restoration
  setUIState: (state: {
    selectedMoodDate?: string;
    selectedExerciseCategory?: string;
    chatScrollOffset?: number;
    moodCalendarMonth?: string;
  }): boolean => {
    return safeMMKVOperation(
      () => {
        zustandStorage.set('ui_state', JSON.stringify(state));
        return true;
      },
      false,
      'AnimationCache.setUIState'
    );
  },

  getUIState: (): any => {
    return safeMMKVOperation(
      () => {
        const cached = zustandStorage.getString('ui_state');
        return cached ? JSON.parse(cached) : {};
      },
      {},
      'AnimationCache.getUIState'
    );
  },

  // Performance metrics caching
  setPerformanceMetrics: (metrics: {
    avgFrameRate?: number;
    memoryUsage?: number;
    renderTime?: number;
  }): boolean => {
    return safeMMKVOperation(
      () => {
        zustandStorage.set('perf_metrics', JSON.stringify(metrics));
        return true;
      },
      false,
      'AnimationCache.setPerformanceMetrics'
    );
  },

  getPerformanceMetrics: (): any => {
    return safeMMKVOperation(
      () => {
        const cached = zustandStorage.getString('perf_metrics');
        return cached ? JSON.parse(cached) : {};
      },
      {},
      'AnimationCache.getPerformanceMetrics'
    );
  },

  // Batch clear for app reset
  clearAll: (): boolean => {
    const keys = ['animations_enabled', 'ui_state', 'perf_metrics'];
    let success = true;

    keys.forEach((key) => {
      if (
        !safeMMKVOperation(
          () => {
            zustandStorage.delete(key);
            return true;
          },
          false,
          `AnimationCache.clearAll(${key})`
        )
      ) {
        success = false;
      }
    });

    // Clear scroll positions (pattern match)
    try {
      const allKeys = zustandStorage.getAllKeys();
      const scrollKeys = allKeys.filter((key) => key.startsWith('scroll_'));
      scrollKeys.forEach((key) => zustandStorage.delete(key));
    } catch (error) {
      console.warn('Failed to clear scroll positions:', error);
      success = false;
    }

    return success;
  },
};

// Hydration Error Recovery System
export interface HydrationRecoveryOptions {
  storeName: string;
  maxRetries?: number;
  retryDelay?: number;
  fallbackState?: any;
  onRecovery?: (error: Error, recoveryMethod: string) => void;
}

export class HydrationRecoveryManager {
  private static instance: HydrationRecoveryManager;
  private recoveryAttempts: Map<string, number> = new Map();
  private lastRecoveryTime: Map<string, number> = new Map();

  static getInstance(): HydrationRecoveryManager {
    if (!HydrationRecoveryManager.instance) {
      HydrationRecoveryManager.instance = new HydrationRecoveryManager();
    }
    return HydrationRecoveryManager.instance;
  }

  async recoverFromHydrationError(
    error: Error,
    options: HydrationRecoveryOptions
  ): Promise<{
    success: boolean;
    recoveryMethod: string;
    fallbackState?: any;
  }> {
    const {
      storeName,
      maxRetries = 3,
      retryDelay = 1000,
      fallbackState,
      onRecovery,
    } = options;

    console.warn(
      `Starting hydration recovery for store '${storeName}':`,
      error.message
    );

    // Track recovery attempts
    const currentAttempts = this.recoveryAttempts.get(storeName) || 0;
    this.recoveryAttempts.set(storeName, currentAttempts + 1);
    this.lastRecoveryTime.set(storeName, Date.now());

    // Recovery strategies in order of preference
    const recoveryStrategies = [
      () => this.attemptDataRepair(storeName),
      () => this.attemptPartialRestore(storeName),
      () => this.clearCorruptedData(storeName),
      () => this.useFallbackState(storeName, fallbackState),
    ];

    for (let i = 0; i < recoveryStrategies.length; i++) {
      try {
        const strategy = recoveryStrategies[i];
        const result = await strategy();

        if (result.success) {
          // Reset attempt counter on successful recovery
          this.recoveryAttempts.set(storeName, 0);

          // Notify recovery callback
          if (onRecovery) {
            onRecovery(error, result.method);
          }

          console.log(
            `Hydration recovery successful for '${storeName}' using: ${result.method}`
          );
          return result;
        }
      } catch (recoveryError) {
        console.warn(
          `Recovery strategy ${i + 1} failed for '${storeName}':`,
          recoveryError
        );
        continue;
      }
    }

    // All recovery strategies failed
    console.error(`All recovery strategies failed for store '${storeName}'`);
    return {
      success: false,
      recoveryMethod: 'none',
      fallbackState: fallbackState || {},
    };
  }

  private async attemptDataRepair(
    storeName: string
  ): Promise<{ success: boolean; method: string }> {
    try {
      const rawData = mmkvStorage.getItem(storeName);
      if (!rawData) return { success: false, method: 'data-repair' };

      // Try to repair common JSON issues
      let repairedData = rawData
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/undefined/g, 'null') // Replace undefined with null
        .replace(/NaN/g, 'null'); // Replace NaN with null

      // Validate repaired JSON
      const parsed = JSON.parse(repairedData);

      // Save repaired data
      mmkvStorage.setItem(storeName, repairedData);

      return { success: true, method: 'data-repair' };
    } catch {
      return { success: false, method: 'data-repair' };
    }
  }

  private async attemptPartialRestore(
    storeName: string
  ): Promise<{ success: boolean; method: string }> {
    try {
      const rawData = mmkvStorage.getItem(storeName);
      if (!rawData) return { success: false, method: 'partial-restore' };

      // Try to extract recoverable parts of the state
      const lines = rawData.split('\n');
      const recoverableData: any = {};

      for (const line of lines) {
        try {
          if (line.trim().startsWith('"') && line.includes(':')) {
            // Try to parse individual key-value pairs
            const keyValueMatch = line.match(/"([^"]+)":\s*([^,\n\r}]+)/);
            if (keyValueMatch) {
              const [, key, value] = keyValueMatch;
              try {
                recoverableData[key] = JSON.parse(value);
              } catch {
                // Keep as string if not valid JSON
                recoverableData[key] = value.replace(/"/g, '');
              }
            }
          }
        } catch {
          continue;
        }
      }

      if (Object.keys(recoverableData).length > 0) {
        mmkvStorage.setItem(storeName, JSON.stringify(recoverableData));
        return { success: true, method: 'partial-restore' };
      }

      return { success: false, method: 'partial-restore' };
    } catch {
      return { success: false, method: 'partial-restore' };
    }
  }

  private async clearCorruptedData(
    storeName: string
  ): Promise<{ success: boolean; method: string }> {
    try {
      mmkvStorage.removeItem(storeName);
      return { success: true, method: 'clear-corrupted' };
    } catch {
      return { success: false, method: 'clear-corrupted' };
    }
  }

  private async useFallbackState(
    storeName: string,
    fallbackState?: any
  ): Promise<{ success: boolean; method: string }> {
    if (!fallbackState) return { success: false, method: 'fallback-state' };

    try {
      mmkvStorage.setItem(storeName, JSON.stringify(fallbackState));
      return { success: true, method: 'fallback-state' };
    } catch {
      return { success: false, method: 'fallback-state' };
    }
  }

  // Get recovery statistics for debugging
  getRecoveryStats(): {
    storeName: string;
    attempts: number;
    lastRecovery: number;
  }[] {
    const stats: {
      storeName: string;
      attempts: number;
      lastRecovery: number;
    }[] = [];

    for (const [storeName, attempts] of this.recoveryAttempts.entries()) {
      const lastRecovery = this.lastRecoveryTime.get(storeName) || 0;
      stats.push({ storeName, attempts, lastRecovery });
    }

    return stats;
  }

  // Reset recovery tracking for a specific store
  resetRecoveryStats(storeName?: string): void {
    if (storeName) {
      this.recoveryAttempts.delete(storeName);
      this.lastRecoveryTime.delete(storeName);
    } else {
      this.recoveryAttempts.clear();
      this.lastRecoveryTime.clear();
    }
  }
}

// Convenience function for hydration recovery
export const recoverFromHydrationError = (
  error: Error,
  options: HydrationRecoveryOptions
) => {
  const manager = HydrationRecoveryManager.getInstance();
  return manager.recoverFromHydrationError(error, options);
};

// Async utilities for large state handling
export class AsyncHydrationUtils {
  // Chunk size for processing large state objects (in bytes)
  private static readonly CHUNK_SIZE = 1024 * 10; // 10KB chunks

  // Process large states in chunks to avoid blocking the main thread
  static async processLargeState<T>(
    state: T,
    processor: (chunk: any) => Promise<any>
  ): Promise<T> {
    const serialized = JSON.stringify(state);

    // If state is small, process normally
    if (serialized.length < this.CHUNK_SIZE) {
      return await processor(state);
    }

    // For large states, process in chunks
    const chunks = this.chunkString(serialized, this.CHUNK_SIZE);
    const processedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      // Yield to main thread between chunks
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      try {
        const chunkData = JSON.parse(chunks[i]);
        const processed = await processor(chunkData);
        processedChunks.push(JSON.stringify(processed));
      } catch (error) {
        console.warn(
          `Failed to process chunk ${i + 1}/${chunks.length}:`,
          error
        );
        processedChunks.push(chunks[i]); // Keep original on error
      }
    }

    try {
      return JSON.parse(processedChunks.join(''));
    } catch (error) {
      console.warn(
        'Failed to reconstruct chunked state, returning original:',
        error
      );
      return state;
    }
  }

  // Split string into chunks
  private static chunkString(str: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
  }

  // Batch hydration for multiple stores
  static async batchHydrate(
    hydrationTasks: { name: string; hydrate: () => Promise<void> }[]
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    // Process stores in batches of 3 to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < hydrationTasks.length; i += batchSize) {
      const batch = hydrationTasks.slice(i, i + batchSize);

      const batchPromises = batch.map(async (task) => {
        try {
          await task.hydrate();
          successful.push(task.name);
        } catch (error) {
          console.warn(
            `Batch hydration failed for store '${task.name}':`,
            error
          );
          failed.push(task.name);
        }
      });

      // Wait for current batch before starting next
      await Promise.all(batchPromises);

      // Brief pause between batches to prevent overwhelming the system
      if (i + batchSize < hydrationTasks.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    return { successful, failed };
  }

  // Progressive hydration - hydrate critical stores first, then others
  static async progressiveHydrate(config: {
    critical: { name: string; hydrate: () => Promise<void> }[];
    normal: { name: string; hydrate: () => Promise<void> }[];
    background: { name: string; hydrate: () => Promise<void> }[];
  }): Promise<void> {
    console.log('Starting progressive hydration...');

    // Phase 1: Critical stores (blocking)
    console.log('Hydrating critical stores...');
    await this.batchHydrate(config.critical);

    // Phase 2: Normal stores (async, but prioritized)
    console.log('Hydrating normal stores...');
    setTimeout(async () => {
      await this.batchHydrate(config.normal);
    }, 10);

    // Phase 3: Background stores (lowest priority)
    console.log('Scheduling background store hydration...');
    setTimeout(async () => {
      await this.batchHydrate(config.background);
    }, 100);
  }
}

// Enhanced async storage adapter with batching
export const asyncMmkvStorage = {
  // Async batch operations
  async getBatch<T>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};

    for (const key of keys) {
      try {
        const value = mmkvStorage.getItem(key);
        results[key] = value ? (JSON.parse(value) as T) : null;
      } catch (error) {
        console.warn(`Batch get failed for key '${key}':`, error);
        results[key] = null;
      }

      // Yield to main thread periodically
      if (keys.indexOf(key) % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return results;
  },

  async setBatch<T>(entries: { key: string; value: T }[]): Promise<boolean[]> {
    const results: boolean[] = [];

    for (const { key, value } of entries) {
      try {
        mmkvStorage.setItem(key, JSON.stringify(value));
        results.push(true);
      } catch (error) {
        console.warn(`Batch set failed for key '${key}':`, error);
        results.push(false);
      }

      // Yield to main thread periodically
      if (entries.indexOf({ key, value }) % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return results;
  },

  async clearBatch(keys: string[]): Promise<boolean[]> {
    const results: boolean[] = [];

    for (const key of keys) {
      try {
        mmkvStorage.removeItem(key);
        results.push(true);
      } catch (error) {
        console.warn(`Batch clear failed for key '${key}':`, error);
        results.push(false);
      }

      // Yield to main thread periodically
      if (keys.indexOf(key) % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return results;
  },
};

// Concurrent Access Protection System
class MMKVLockManager {
  private static instance: MMKVLockManager;
  private locks: Map<string, Promise<any>> = new Map();
  private lockHolders: Map<string, string> = new Map();
  private lockRequestQueue: Map<
    string,
    { resolve: () => void; requester: string }[]
  > = new Map();

  static getInstance(): MMKVLockManager {
    if (!MMKVLockManager.instance) {
      MMKVLockManager.instance = new MMKVLockManager();
    }
    return MMKVLockManager.instance;
  }

  async acquireLock(
    key: string,
    requester: string = 'unknown',
    timeout: number = 5000
  ): Promise<() => void> {
    const lockKey = `lock_${key}`;

    // If lock already exists, wait for it or queue up
    if (this.locks.has(lockKey)) {
      return new Promise((resolve, reject) => {
        // Setup timeout
        const timeoutId = setTimeout(() => {
          reject(new Error(`Lock timeout for key '${key}' after ${timeout}ms`));
        }, timeout);

        // Add to queue
        if (!this.lockRequestQueue.has(lockKey)) {
          this.lockRequestQueue.set(lockKey, []);
        }

        this.lockRequestQueue.get(lockKey)!.push({
          resolve: () => {
            clearTimeout(timeoutId);
            resolve(this.createReleaseLock(lockKey, requester));
          },
          requester,
        });
      });
    }

    // Create new lock
    const lockPromise = Promise.resolve();
    this.locks.set(lockKey, lockPromise);
    this.lockHolders.set(lockKey, requester);

    return this.createReleaseLock(lockKey, requester);
  }

  private createReleaseLock(lockKey: string, requester: string): () => void {
    return () => {
      // Verify the requester is the lock holder
      if (this.lockHolders.get(lockKey) !== requester) {
        console.warn(
          `Attempted to release lock '${lockKey}' by non-holder '${requester}'`
        );
        return;
      }

      // Remove lock
      this.locks.delete(lockKey);
      this.lockHolders.delete(lockKey);

      // Process queue
      const queue = this.lockRequestQueue.get(lockKey);
      if (queue && queue.length > 0) {
        const next = queue.shift()!;

        // Give lock to next in queue
        const nextLockPromise = Promise.resolve();
        this.locks.set(lockKey, nextLockPromise);
        this.lockHolders.set(lockKey, next.requester);

        // Resolve the queued promise
        next.resolve();

        // Clean up queue if empty
        if (queue.length === 0) {
          this.lockRequestQueue.delete(lockKey);
        }
      }
    };
  }

  // Check if a key is locked
  isLocked(key: string): boolean {
    return this.locks.has(`lock_${key}`);
  }

  // Get lock holder information
  getLockInfo(key: string): {
    isLocked: boolean;
    holder?: string;
    queueSize: number;
  } {
    const lockKey = `lock_${key}`;
    return {
      isLocked: this.locks.has(lockKey),
      holder: this.lockHolders.get(lockKey),
      queueSize: this.lockRequestQueue.get(lockKey)?.length || 0,
    };
  }

  // Force release all locks (emergency use only)
  releaseAllLocks(): void {
    console.warn(
      'Force releasing all MMKV locks - this should only be used in emergencies'
    );
    this.locks.clear();
    this.lockHolders.clear();

    // Resolve all queued promises
    for (const [_, queue] of this.lockRequestQueue.entries()) {
      queue.forEach((item) => item.resolve());
    }
    this.lockRequestQueue.clear();
  }
}

// Thread-safe MMKV operations with locking
export const threadSafeMmkvStorage = {
  async getItem(
    name: string,
    requester: string = 'threadSafe'
  ): Promise<string | null> {
    const lockManager = MMKVLockManager.getInstance();
    const release = await lockManager.acquireLock(name, requester);

    try {
      return safeMMKVOperation(
        () => zustandStorage.getString(name) ?? null,
        null,
        `threadSafe.getItem(${name})`
      );
    } finally {
      release();
    }
  },

  async setItem(
    name: string,
    value: string,
    requester: string = 'threadSafe'
  ): Promise<boolean> {
    const lockManager = MMKVLockManager.getInstance();
    const release = await lockManager.acquireLock(name, requester);

    try {
      return safeMMKVOperation(
        () => {
          zustandStorage.set(name, value);
          return true;
        },
        false,
        `threadSafe.setItem(${name})`
      );
    } finally {
      release();
    }
  },

  async removeItem(
    name: string,
    requester: string = 'threadSafe'
  ): Promise<boolean> {
    const lockManager = MMKVLockManager.getInstance();
    const release = await lockManager.acquireLock(name, requester);

    try {
      return safeMMKVOperation(
        () => {
          zustandStorage.delete(name);
          return true;
        },
        false,
        `threadSafe.removeItem(${name})`
      );
    } finally {
      release();
    }
  },

  // Atomic operations
  async atomicUpdate<T>(
    name: string,
    updater: (current: T | null) => T,
    requester: string = 'atomicUpdate'
  ): Promise<{ success: boolean; newValue?: T }> {
    const lockManager = MMKVLockManager.getInstance();
    const release = await lockManager.acquireLock(name, requester);

    try {
      // Get current value
      const currentRaw = safeMMKVOperation(
        () => zustandStorage.getString(name) ?? null,
        null,
        `atomicUpdate.get(${name})`
      );

      let current: T | null = null;
      if (currentRaw) {
        try {
          current = JSON.parse(currentRaw);
        } catch (error) {
          console.warn(
            `Failed to parse current value for atomic update of '${name}':`,
            error
          );
        }
      }

      // Apply update
      const newValue = updater(current);

      // Save new value
      const success = safeMMKVOperation(
        () => {
          zustandStorage.set(name, JSON.stringify(newValue));
          return true;
        },
        false,
        `atomicUpdate.set(${name})`
      );

      return { success, newValue: success ? newValue : undefined };
    } finally {
      release();
    }
  },
};
