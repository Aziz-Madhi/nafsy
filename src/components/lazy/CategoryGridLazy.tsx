/**
 * Lazy-loaded Category Grid
 * Only loads when exercises tab is accessed, reducing initial bundle size
 */

import { createLazyScreen } from '~/lib/lazy-screen';

// Lazy load the category grid
export const CategoryGridLazy = createLazyScreen(
  () =>
    import('../exercises/CategoryGrid').then((module) => ({
      default: module.CategoryGrid,
    })),
  'Exercise Categories'
);
