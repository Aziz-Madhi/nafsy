import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProviderWrapper } from './ClerkProvider';
import { ConvexProvider } from './ConvexProvider';
import { StoreProvider } from './StoreProvider';
import { ThemeController } from '~/components/ThemeController';
import { useColors } from '~/hooks/useColors';
import { AudioPlayerProvider } from './AudioPlayerProvider';

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
  const colors = useColors();
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <MemoizedSafeAreaProvider>
        <StoreProvider>
          <ThemeController />
          <MemoizedClerkProvider>
            <MemoizedConvexProvider>
              <AudioPlayerProvider>{children}</AudioPlayerProvider>
            </MemoizedConvexProvider>
          </MemoizedClerkProvider>
        </StoreProvider>
      </MemoizedSafeAreaProvider>
    </GestureHandlerRootView>
  );
});
