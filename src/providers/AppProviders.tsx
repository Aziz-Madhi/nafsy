import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProviderWrapper } from './ClerkProvider';
import { ConvexProvider } from './ConvexProvider';
import { ClerkErrorBoundary } from '~/components/ClerkErrorBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <ClerkErrorBoundary>
        <ClerkProviderWrapper>
          <ConvexProvider>
            {children}
          </ConvexProvider>
        </ClerkProviderWrapper>
      </ClerkErrorBoundary>
    </SafeAreaProvider>
  );
}