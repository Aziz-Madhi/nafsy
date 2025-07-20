import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { api } from '../../convex/_generated/api';

/**
 * Shared hook for getting the current user data
 * This replaces individual getCurrentUser queries across components
 * to reduce redundant API calls and improve performance
 */
export function useCurrentUser() {
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  
  return useQuery(
    api.users.getCurrentUser,
    user && isSignedIn ? { clerkId: user.id } : 'skip'
  );
}

/**
 * Combined hook for user authentication state and data
 * Provides both auth status and user data in one hook
 */
export function useUserData() {
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  const currentUser = useCurrentUser();
  
  return {
    user,
    isLoaded,
    isSignedIn,
    currentUser,
    isUserReady: isLoaded && isSignedIn && currentUser,
  };
}

/**
 * Optimized mood data hook with caching
 */
export function useMoodData(userId?: string, limit: number = 365) {
  return useQuery(
    api.moods.getMoods,
    userId ? { userId, limit } : 'skip'
  );
}

/**
 * Optimized mood stats hook
 */
export function useMoodStats(userId?: string, days: number = 30) {
  return useQuery(
    api.moods.getMoodStats,
    userId ? { userId, days } : 'skip'
  );
}

/**
 * Today's mood hook
 */
export function useTodayMood(userId?: string) {
  return useQuery(
    api.moods.getTodayMood,
    userId ? { userId } : 'skip'
  );
}

/**
 * Exercise data with progress hook
 */
export function useExercisesWithProgress(userId?: string) {
  return useQuery(
    api.exercises.getExercisesWithProgress,
    userId ? { userId } : 'skip'
  );
}

/**
 * User stats hook
 */
export function useUserStats(userId?: string) {
  return useQuery(
    api.userProgress.getUserStats,
    userId ? { userId } : 'skip'
  );
}