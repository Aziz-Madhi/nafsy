/**
 * Lazy-loaded Category Exercise List
 * Only loads when user selects a category, reducing initial bundle size
 */

import { createLazyScreen } from '~/lib/lazy-screen';

// Lazy load the category exercise list
export const CategoryExerciseListLazy = createLazyScreen(
  () =>
    import('../exercises/CategoryExerciseList').then((module) => ({
      default: module.CategoryExerciseList,
    })),
  'Exercise List'
);
