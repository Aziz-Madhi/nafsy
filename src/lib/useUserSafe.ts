import { useUser as useClerkUser, useAuth } from '@clerk/clerk-expo';
import { useMemo } from 'react';

/**
 * Safe wrapper around Clerk's useUser hook that prevents the displayName error
 * by adding defensive error handling and proper loading states
 */
export function useUserSafe() {
  // Always call hooks in the same order - this is critical for React
  const auth = useAuth();
  const userHook = useClerkUser();

  // Safely destructure auth properties
  const authLoaded = auth?.isLoaded ?? false;
  const isSignedIn = auth?.isSignedIn ?? false;

  // Safely access user hook properties
  const userLoaded = userHook?.isLoaded ?? false;
  const rawUser = userHook?.user;

  // Use useMemo to prevent unnecessary re-calculations and ensure stable references
  const result = useMemo(() => {
    try {
      // Early return if auth hasn't loaded yet
      if (!authLoaded) {
        return {
          user: null,
          isLoaded: false,
          isSignedIn: false,
        };
      }

      // If not signed in, return early with loaded state
      if (!isSignedIn || !rawUser) {
        return {
          user: null,
          isLoaded: userLoaded,
          isSignedIn: false,
        };
      }

      // Create safe user object with displayName fallback
      const safeUser = {
        ...rawUser,
        // Ensure displayName exists to prevent the error
        displayName:
          rawUser.fullName ||
          rawUser.firstName ||
          rawUser.emailAddresses?.[0]?.emailAddress ||
          'User',
      };

      return {
        user: safeUser,
        isLoaded: userLoaded,
        isSignedIn: true,
      };
    } catch (error) {
      console.error('useUserSafe: Error processing user data:', error);

      // Return safe fallback values
      return {
        user: null,
        isLoaded: true,
        isSignedIn: false,
        error: error as Error,
      };
    }
  }, [authLoaded, isSignedIn, userLoaded, rawUser]);

  return result;
}

/**
 * Safe wrapper around Clerk's useAuth hook with error handling
 * Uses React.memo pattern to prevent re-render loops
 */
export function useAuthSafe() {
  const auth = useAuth();

  return useMemo(() => {
    try {
      if (!auth) {
        return {
          isLoaded: false,
          isSignedIn: false,
          userId: null,
          getToken: async () => null,
          signOut: async () => {},
        };
      }
      return auth;
    } catch (error) {
      console.error('useAuthSafe: Error processing auth:', error);
      return {
        isLoaded: false,
        isSignedIn: false,
        userId: null,
        getToken: async () => null,
        signOut: async () => {},
        error: error as Error,
      };
    }
  }, [auth]); // Depend on the full auth object but memoize the result
}
