import { useEffect, useCallback, useState } from 'react';
import { useSSO } from '@clerk/clerk-expo';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { optimizedHaptic } from '~/lib/haptic-optimizer';
import { useTranslation } from './useTranslation';

// Warm up browser for faster authentication on Android
export function useWarmUpBrowser() {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

type SocialProvider = 'oauth_google' | 'oauth_apple';

interface UseSocialAuthReturn {
  handleSocialAuth: (provider: SocialProvider) => Promise<void>;
  loading: boolean;
}

export function useSocialAuth(): UseSocialAuthReturn {
  const { t } = useTranslation();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const handleSocialAuth = useCallback(
    async (provider: SocialProvider) => {
      if (loading) return;

      setLoading(true);
      try {
        // Start the authentication process
        const result = await startSSOFlow({
          strategy: provider,
          redirectUrl: AuthSession.makeRedirectUri(),
        });

        if (result?.createdSessionId) {
          // If sign in was successful, set the active session
          await result.setActive?.({ session: result.createdSessionId });
          optimizedHaptic.success();

          // Do not navigate here; Auth layout will redirect to /(app)
        } else if (result?.signUp) {
          // Handle sign up case if needed
          if (
            result.signUp.verifications?.emailAddress?.status === 'verified'
          ) {
            await result.setActive?.({
              session: result.signUp.createdSessionId,
            });
            optimizedHaptic.success();

            // Do not navigate here; Auth layout will redirect to /(app)
          }
        }
      } catch (error: any) {
        if (__DEV__) {
          console.error('Social auth error:', error);
        }

        // Handle specific error cases
        let errorMessage = t('auth.errors.socialAuthFailed');

        if (error?.errors?.[0]?.message) {
          errorMessage = error.errors[0].message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // Don't show error for user cancellation
        if (
          !error?.message?.includes('cancelled') &&
          !error?.message?.includes('canceled')
        ) {
          Alert.alert(t('common.error'), errorMessage);
          optimizedHaptic.error();
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, startSSOFlow, t]
  );

  return {
    handleSocialAuth,
    loading,
  };
}
