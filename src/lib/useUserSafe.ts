import { useUser } from '@clerk/clerk-expo';

/**
 * Simplified wrapper around Clerk's useUser hook with clean shape
 */
export function useUserSafe() {
  const { user, isLoaded } = useUser();

  return {
    isLoaded,
    isSignedIn: !!user,
    user, // Raw Clerk user object
    displayName: user?.fullName ?? user?.firstName ?? 'User',
  };
}
