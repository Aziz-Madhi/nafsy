/**
 * Lazy-loaded Exercises Screen
 * Reduces initial bundle size by loading exercise functionality on demand
 */

import { createLazyScreen } from '~/lib/lazy-screen';

// Lazy load the exercises screen
export const ExercisesScreenLazy = createLazyScreen(
  () => import('../../screens/tabs/exercises'),
  'Exercises'
);
