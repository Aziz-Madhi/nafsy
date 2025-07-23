/**
 * Lazy-loaded Profile Screen
 * Reduces initial bundle size by loading profile functionality on demand
 */

import { createLazyScreen } from '~/lib/lazy-screen';

// Lazy load the profile screen
export const ProfileScreenLazy = createLazyScreen(
  () => import('../../screens/tabs/profile'),
  'Profile'
);
