import React, { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View, Appearance } from 'react-native';
import { Text } from '~/components/ui/text';
import { StoreErrorBoundary } from '~/components/StoreErrorBoundary';
import { MMKVHealthCheck, AsyncHydrationUtils } from '~/lib/mmkv-zustand';
import { useAppStore, useChatUIStore, useIsSystemTheme } from '~/store';

interface StoreProviderProps {
  children: ReactNode;
}

interface HydrationState {
  isHydrating: boolean;
  isComplete: boolean;
  hasErrors: boolean;
  errors: string[];
}

/**
 * StoreProvider - Manages Zustand store hydration and provides error boundaries
 *
 * This provider sits high in the component tree to ensure stores are available
 * before authentication-dependent providers that might need store state.
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [hydrationState, setHydrationState] = useState<HydrationState>({
    isHydrating: true,
    isComplete: false,
    hasErrors: false,
    errors: [],
  });

  const appStore = useAppStore();
  const chatUIStore = useChatUIStore();

  useEffect(() => {
    let isMounted = true;

    const initializeStores = async () => {
      try {
        console.log('Starting progressive store hydration...');

        // Check MMKV health before proceeding
        const isHealthy = MMKVHealthCheck.isHealthy();
        if (!isHealthy) {
          console.warn('MMKV health check failed, attempting recovery...');
          MMKVHealthCheck.reset();
        }

        // Test storage functionality
        const storageWorks = MMKVHealthCheck.testStorage();
        if (!storageWorks) {
          throw new Error(
            'MMKV storage test failed - storage may be corrupted'
          );
        }

        // Progressive hydration configuration
        const hydrationConfig = {
          // Critical stores that need to be loaded first (blocking)
          critical: [
            {
              name: 'app-store',
              hydrate: async () => {
                return new Promise<void>((resolve, reject) => {
                  // Check if store has hydration capabilities
                  if (appStore?.persist?.hasHydrated()) {
                    resolve();
                    return;
                  }

                  // Wait for hydration with timeout
                  const timeout = setTimeout(() => {
                    reject(new Error('App store hydration timeout'));
                  }, 5000);

                  const checkHydration = () => {
                    if (appStore?.persist?.hasHydrated()) {
                      clearTimeout(timeout);
                      clearInterval(interval);
                      resolve();
                    }
                  };

                  const interval = setInterval(checkHydration, 100);
                  checkHydration(); // Check immediately
                });
              },
            },
          ],

          // Normal priority stores
          normal: [
            {
              name: 'chat-ui-store',
              hydrate: async () => {
                return new Promise<void>((resolve, reject) => {
                  if (chatUIStore?.persist?.hasHydrated()) {
                    resolve();
                    return;
                  }

                  const timeout = setTimeout(() => {
                    reject(new Error('Chat UI store hydration timeout'));
                  }, 3000);

                  const checkHydration = () => {
                    if (chatUIStore?.persist?.hasHydrated()) {
                      clearTimeout(timeout);
                      clearInterval(interval);
                      resolve();
                    }
                  };

                  const interval = setInterval(checkHydration, 100);
                  checkHydration();
                });
              },
            },
          ],

          // Background stores (future stores can go here)
          background: [],
        };

        // Perform progressive hydration
        await AsyncHydrationUtils.progressiveHydrate(hydrationConfig);

        if (isMounted) {
          setHydrationState({
            isHydrating: false,
            isComplete: true,
            hasErrors: false,
            errors: [],
          });
          console.log('Store hydration completed successfully');
        }
      } catch (error) {
        console.error('Store initialization failed:', error);

        if (isMounted) {
          setHydrationState({
            isHydrating: false,
            isComplete: true,
            hasErrors: true,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          });
        }
      }
    };

    initializeStores();

    return () => {
      isMounted = false;
    };
  }, [appStore, chatUIStore]);

  // Show loading screen during critical store hydration
  if (hydrationState.isHydrating) {
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

  // Show error state if hydration failed
  if (hydrationState.hasErrors) {
    return (
      <StoreErrorBoundary
        onError={(error) => {
          console.error('Store Provider Error:', error);
        }}
        fallback={
          <View className="flex-1 justify-center items-center p-6 bg-background">
            <View className="bg-white rounded-2xl p-6 shadow-sm max-w-sm w-full">
              <View className="items-center mb-4">
                <View className="w-16 h-16 bg-destructive/10 rounded-full items-center justify-center mb-3">
                  <Text className="text-2xl">⚠️</Text>
                </View>
                <Text variant="title3" className="text-center font-semibold">
                  App Initialization Failed
                </Text>
              </View>

              <Text
                variant="body"
                className="text-center text-muted-foreground mb-4"
              >
                Unable to load your app settings. Please restart the app.
              </Text>

              {hydrationState.errors.map((error, index) => (
                <Text
                  key={index}
                  className="text-xs text-muted-foreground mb-2"
                >
                  • {error}
                </Text>
              ))}
            </View>
          </View>
        }
      >
        {children}
      </StoreErrorBoundary>
    );
  }

  // Wrap children with store error boundary for runtime protection
  return (
    <StoreErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Store Runtime Error:', error, errorInfo);

        // Report to crash analytics if available
        // TODO: Integrate with your crash reporting service
      }}
    >
      <SystemThemeListener />
      {children}
    </StoreErrorBoundary>
  );
};

// System theme listener component
const SystemThemeListener: React.FC = () => {
  const isSystemTheme = useIsSystemTheme();
  const appStore = useAppStore();

  useEffect(() => {
    if (!isSystemTheme) return;

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('System theme changed to:', colorScheme);
      // Call applySystemTheme directly from store to avoid selector issues
      appStore.applySystemTheme();
    });

    return () => subscription?.remove();
  }, [isSystemTheme, appStore]);

  return null;
};

// Higher-order component for components that depend on store hydration
export const withStoreHydration = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => {
    const appStore = useAppStore();
    const chatUIStore = useChatUIStore();

    const isHydrated =
      appStore?.persist?.hasHydrated() && chatUIStore?.persist?.hasHydrated();

    if (!isHydrated) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      );
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withStoreHydration(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

// Hook to check store hydration status
export const useStoreHydration = () => {
  const appStore = useAppStore();
  const chatUIStore = useChatUIStore();

  return {
    isHydrated:
      appStore?.persist?.hasHydrated() && chatUIStore?.persist?.hasHydrated(),
    stores: {
      app: appStore?.persist?.hasHydrated() || false,
      chatUI: chatUIStore?.persist?.hasHydrated() || false,
    },
  };
};
