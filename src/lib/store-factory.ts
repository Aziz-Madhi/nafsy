/**
 * Type-safe Store Factory for Zustand with MMKV persistence
 * Creates strongly-typed stores with proper TypeScript support
 */

import { create, StoreApi, UseBoundStore } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';
import { Result, tryAsync } from './result';

/**
 * Store creator function type
 */
export type StoreCreator<T> = (
  set: StoreApi<T>['setState'],
  get: StoreApi<T>['getState'],
  api: StoreApi<T>
) => T;

/**
 * Persisted store configuration options
 */
export interface PersistedStoreOptions<T> {
  name: string;
  version?: number;
  migrate?: PersistOptions<T, T>['migrate'];
  partialize?: PersistOptions<T, T>['partialize'];
}

/**
 * Create a type-safe persisted store with automatic MMKV storage
 */
export function createPersistedStore<T>(
  options: PersistedStoreOptions<T>,
  storeCreator: StoreCreator<T>
): UseBoundStore<StoreApi<T>> {
  const persistOptions: any = {
    name: options.name,
    storage: createJSONStorage(() => mmkvStorage),
    version: options.version ?? 1,
  };

  // Only add optional properties if they exist
  if (options.migrate) {
    persistOptions.migrate = options.migrate;
  }
  if (options.partialize) {
    persistOptions.partialize = options.partialize;
  }

  return create<T>()(persist(storeCreator, persistOptions));
}

/**
 * Create a non-persisted store (for temporary state)
 */
export function createStore<T>(
  storeCreator: StoreCreator<T>
): UseBoundStore<StoreApi<T>> {
  return create<T>()(storeCreator);
}

/**
 * Create typed selectors for a store (helper function)
 */
export function createSelectors<T extends Record<string, unknown>>(
  store: UseBoundStore<StoreApi<T>>
) {
  const selectors = {} as {
    [K in keyof T as `use${Capitalize<string & K>}`]: () => T[K];
  };

  const state = store.getState();
  Object.keys(state).forEach((key) => {
    const selectorName =
      `use${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof typeof selectors;
    (selectors as any)[selectorName] = () =>
      store((state: T) => state[key as keyof T]);
  });

  return selectors;
}

/**
 * Create async action wrapper with proper error handling using Result pattern
 */
export function createAsyncAction<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<T>
) {
  return (set: StoreApi<any>['setState'], get: StoreApi<any>['getState']) =>
    async (...args: Args): Promise<Result<T, Error>> => {
      return tryAsync(() => action(...args));
    };
}

/**
 * Helper type for store with actions separated from state
 */
export type StoreWithActions<State, Actions> = State & {
  actions: Actions;
};

/**
 * Create a store with separated state and actions for better organization
 */
export function createPersistedStoreWithActions<State, Actions>(
  options: PersistedStoreOptions<StoreWithActions<State, Actions>>,
  stateCreator: (
    set: StoreApi<StoreWithActions<State, Actions>>['setState'],
    get: StoreApi<StoreWithActions<State, Actions>>['getState']
  ) => State,
  actionsCreator: (
    set: StoreApi<StoreWithActions<State, Actions>>['setState'],
    get: StoreApi<StoreWithActions<State, Actions>>['getState']
  ) => Actions
): UseBoundStore<StoreApi<StoreWithActions<State, Actions>>> {
  return createPersistedStore(options, (set, get) => ({
    ...stateCreator(set, get),
    actions: actionsCreator(set, get),
  }));
}
