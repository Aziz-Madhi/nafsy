/**
 * Simplified Store Provider using the new store factory
 * Replaces the complex 295-line StoreProvider.tsx with ~80 lines
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View, Appearance } from 'react-native';
import { Text } from '~/components/ui/text';
import { StoreErrorBoundary } from '~/components/StoreErrorBoundary';
import { useAppStore } from '~/store/useAppStore';
import { logger } from '~/lib/logger';

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
    // With unified storage, we can initialize immediately
    // No need to wait for async storage initialization
    setHydrationState({
      isHydrated: true,
      hasError: false,
    });

    logger.info('Store initialization completed', 'StoreProvider');
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
        logger.error('Store Runtime Error', 'StoreProvider', {
          error,
          errorInfo,
        });
      }}
    >
      <SystemThemeListener />
      {/* Removed PendingLanguageCleaner - no longer needed with simplified language system */}
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

// Removed PendingLanguageCleaner component - no longer needed with simplified language system
