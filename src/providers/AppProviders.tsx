import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProviderWrapper } from './ClerkProvider';
import { ConvexProvider } from './ConvexProvider';
import { StoreProvider } from './StoreProvider';
import { LanguageProvider } from './LanguageProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <LanguageProvider>
            <ClerkProviderWrapper>
              <ConvexProvider>{children}</ConvexProvider>
            </ClerkProviderWrapper>
          </LanguageProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
