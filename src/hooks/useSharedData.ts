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
  const { isSignedIn } = useAuth();

  return useQuery(api.users.getCurrentUser, isSignedIn ? {} : 'skip');
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
export function useMoodData(limit: number = 365) {
  const { isSignedIn } = useAuth();

  return useQuery(api.moods.getMoods, isSignedIn ? { limit } : 'skip');
}

/**
 * Optimized mood stats hook
 */
export function useMoodStats(days: number = 30) {
  const { isSignedIn } = useAuth();

  return useQuery(api.moods.getMoodStats, isSignedIn ? { days } : 'skip');
}

/**
 * Today's mood hook
 */
export function useTodayMood() {
  const { isSignedIn } = useAuth();

  return useQuery(api.moods.getTodayMood, isSignedIn ? {} : 'skip');
}

/**
 * Exercise data with progress hook
 */
export function useExercisesWithProgress(category?: string, limit?: number) {
  const { isSignedIn } = useAuth();

  return useQuery(
    api.exercises.getExercisesWithProgress,
    isSignedIn ? { category, limit } : 'skip'
  );
}

/**
 * User stats hook
 */
export function useUserStats(days?: number) {
  const { isSignedIn } = useAuth();

  return useQuery(
    api.userProgress.getUserStats,
    isSignedIn ? { days } : 'skip'
  );
}
