import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { OAuthLoadingScreen } from '~/components/auth/OAuthLoadingScreen';

// Fallback-only screen; we no longer upsert here. The app layout handles it.
export default function OAuthCallbackScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tabs/chat');
  }, [router]);
  return <OAuthLoadingScreen />;
}
