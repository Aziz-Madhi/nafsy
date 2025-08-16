import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProviderWrapper } from './ClerkProvider';
import { ConvexProvider } from './ConvexProvider';
import { StoreProvider } from './StoreProvider';
import { ThemeController } from '~/components/ThemeController';

// Initialize i18n system - must be imported to initialize
import '~/lib/i18n';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Memoized provider wrappers to prevent unnecessary re-renders
const MemoizedClerkProvider = React.memo(ClerkProviderWrapper);
const MemoizedConvexProvider = React.memo(ConvexProvider);
const MemoizedSafeAreaProvider = React.memo(SafeAreaProvider);

export const AppProviders = React.memo(function AppProviders({
  children,
}: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MemoizedSafeAreaProvider>
        <StoreProvider>
          <ThemeController />
          <MemoizedClerkProvider>
            <MemoizedConvexProvider>{children}</MemoizedConvexProvider>
          </MemoizedClerkProvider>
        </StoreProvider>
      </MemoizedSafeAreaProvider>
    </GestureHandlerRootView>
  );
});
