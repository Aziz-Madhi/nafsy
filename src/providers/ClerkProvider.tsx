import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { config } from '~/config/env';

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Use centralized config that throws proper errors for missing keys
  const publishableKey = config.clerk.publishableKey;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      {children}
    </ClerkProvider>
  );
}