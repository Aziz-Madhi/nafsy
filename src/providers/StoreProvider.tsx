/**
 * Simplified Store Provider using the new store factory
 * Replaces the complex 295-line StoreProvider.tsx with ~80 lines
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View, Appearance } from 'react-native';
import { Text } from '~/components/ui/text';
import { StoreErrorBoundary } from '~/components/StoreErrorBoundary';
import { useAppStore } from '~/store/useAppStore';
import { useChatUIStore } from '~/store/useChatUIStore';

interface StoreProviderProps {
  children: ReactNode;
}

interface HydrationState {
  isHydrated: boolean;
  hasError: boolean;
  errorMessage?: string;
}

/**
 * StoreProvider - Simplified store initialization and error handling
 *
 * Uses the new store factory pattern which handles hydration automatically
 * through the createPersistedStore factory with built-in MMKV persistence.
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [hydrationState, setHydrationState] = useState<HydrationState>({
    isHydrated: false,
    hasError: false,
  });

  useEffect(() => {
    let isMounted = true;

    const initializeStores = async () => {
      try {
        // The new store factory handles hydration automatically
        // We just need to access the stores to trigger initialization
        const appStore = useAppStore.getState();
        const chatUIStore = useChatUIStore.getState();

        // Wait a brief moment for any async initialization
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (isMounted && appStore && chatUIStore) {
          setHydrationState({
            isHydrated: true,
            hasError: false,
          });
          console.log('Store initialization completed');
        }
      } catch (error) {
        console.error('Store initialization failed:', error);

        if (isMounted) {
          setHydrationState({
            isHydrated: true, // Continue anyway with defaults
            hasError: true,
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    };

    initializeStores();

    return () => {
      isMounted = false;
    };
  }, []);

  // Show loading during initialization
  if (!hydrationState.isHydrated) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <View className="items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text variant="body" className="mt-4 text-muted-foreground">
            Loading your preferences...
          </Text>
        </View>
      </View>
    );
  }

  // Main app with error boundary and system theme listener
  return (
    <StoreErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Store Runtime Error:', error, errorInfo);
      }}
    >
      <SystemThemeListener />
      {children}
    </StoreErrorBoundary>
  );
};

// Simplified system theme listener
const SystemThemeListener: React.FC = () => {
  const isSystemTheme = useAppStore((state) => state.isSystemTheme);
  const applySystemTheme = useAppStore((state) => state.applySystemTheme);

  useEffect(() => {
    if (!isSystemTheme) return;

    const subscription = Appearance.addChangeListener(() => {
      applySystemTheme();
    });

    return () => subscription?.remove();
  }, [isSystemTheme, applySystemTheme]);

  return null;
};
