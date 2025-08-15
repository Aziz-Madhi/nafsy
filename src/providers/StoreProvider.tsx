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
      <PendingLanguageCleaner />
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

// Simple component to clean up pending language state after i18n has handled it
const PendingLanguageCleaner: React.FC = React.memo(
  function PendingLanguageCleaner() {
    const pendingLanguage = useAppStore((state) => state.pendingLanguage);
    const applyPendingLanguage = useAppStore(
      (state) => state.applyPendingLanguage
    );

    useEffect(() => {
      // Only run once on mount to clean up pending language state
      // i18n.ts has already applied the language and RTL during initialization

      if (pendingLanguage) {
        // Small delay to ensure everything is settled
        const timer = setTimeout(() => {
          logger.info(
            `Cleaning up pending language state: ${pendingLanguage}`,
            'PendingLanguageCleaner'
          );
          applyPendingLanguage().catch((error) => {
            logger.error(
              'Failed to clean pending language state',
              'PendingLanguageCleaner',
              error
            );
          });
        }, 50); // Small delay for settling

        return () => clearTimeout(timer);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once on mount (intentional)

    return null;
  }
);
