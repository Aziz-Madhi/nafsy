/**
 * Lazy-loaded Mood Screen
 * Reduces initial bundle size by loading mood functionality on demand
 */

import { createLazyScreen } from '~/lib/lazy-screen';

// Lazy load the mood screen
export const MoodScreenLazy = createLazyScreen(
  () => import('../../screens/tabs/mood'),
  'Mood'
);
