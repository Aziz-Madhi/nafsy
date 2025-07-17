import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProviderWrapper } from './ClerkProvider';
import { ConvexProvider } from './ConvexProvider';
import { LanguageProvider } from './LanguageProvider';
import { ClerkErrorBoundary } from '~/components/ClerkErrorBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ClerkErrorBoundary>
            <ClerkProviderWrapper>
              <ConvexProvider>
                {children}
              </ConvexProvider>
            </ClerkProviderWrapper>
          </ClerkErrorBoundary>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}