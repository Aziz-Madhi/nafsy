import { lazy } from 'react';

export { ExerciseCard } from './ExerciseCard';
export { CategoryFilter } from './CategoryFilter';
export { CategoryCard } from './CategoryCard';
export { CategoryGrid } from './CategoryGrid';
export { CategoryExerciseList } from './CategoryExerciseList';

// Lazy-loaded heavy components
export const ExerciseDetail = lazy(() => import('./ExerciseDetail').then(module => ({ default: module.ExerciseDetail })));