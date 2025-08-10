import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CategoryExerciseList, ExerciseDetail } from '~/components/exercises';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import {
  useCurrentUser,
  useExercisesWithProgress,
} from '~/hooks/useSharedData';
import { useTranslation } from '~/hooks/useTranslation';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import type { Exercise } from '~/types';

// Utility functions (copied from main exercises screen)
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    breathing: '🌬️',
    mindfulness: '🧘‍♀️',
    movement: '🚶‍♀️',
    journaling: '✍️',
    relaxation: '🛀',
    reminders: '💭',
  };
  return icons[category] || '⭐';
}

function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    mindfulness: '#FF6B6B',
    breathing: '#4ECDC4',
    movement: '#45B7D1',
    journaling: '#96CEB4',
    relaxation: '#FFEAA7',
    reminders: '#DDA0DD',
  };
  return categoryColors[category] || '#FF6B6B';
}

function getBenefitsForCategory(category: string, t: any): string[] {
  const benefits: Record<string, string[]> = {
    breathing: t('exercises.benefits.breathing'),
    mindfulness: t('exercises.benefits.mindfulness'),
    movement: t('exercises.benefits.movement'),
    journaling: t('exercises.benefits.journaling'),
    relaxation: t('exercises.benefits.relaxation'),
  };
  return benefits[category] || [];
}

export default function CategoryModal() {
  const { id: categoryId } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useTranslation();

  // State for ExerciseDetail modal
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);

  // Data fetching
  const currentUser = useCurrentUser();
  const exercisesWithProgress = useExercisesWithProgress();
  const recordCompletion = useMutation(api.userProgress.recordCompletion);
  const seedExercises = useMutation(api.seed.seedExercises);

  // Store stability guard
  const [isStoreStable] = useState(true);

  // Cache translated benefits
  const translatedBenefits = useMemo(() => {
    const benefitsMap: Record<string, string[]> = {};
    const categories = [
      'breathing',
      'mindfulness',
      'movement',
      'journaling',
      'relaxation',
    ];

    categories.forEach((category) => {
      benefitsMap[category] = getBenefitsForCategory(category, t);
    });

    return benefitsMap;
  }, [t]);

  // Transform exercises to UI format
  const exercises: Exercise[] = useMemo(() => {
    if (!exercisesWithProgress || !isStoreStable) return [];

    return exercisesWithProgress.map((ex) => ({
      id: ex._id,
      title: locale === 'ar' ? ex.titleAr : ex.title,
      description: locale === 'ar' ? ex.descriptionAr : ex.description,
      duration: `${ex.duration} min`,
      difficulty: ex.difficulty,
      category: ex.category,
      icon: getCategoryIcon(ex.category),
      color: getCategoryColor(ex.category),
      steps: locale === 'ar' ? ex.instructionsAr : ex.instructions,
      benefits: translatedBenefits[ex.category] || [],
    }));
  }, [exercisesWithProgress, locale, translatedBenefits, isStoreStable]);

  // Filter exercises for this category
  const filteredExercises = useMemo(() => {
    if (!categoryId) return exercises;

    // Handle special case for 'reminders' category
    if (categoryId === 'reminders') {
      return exercises.filter(
        (exercise) =>
          exercise.category === 'relaxation' ||
          exercise.category === 'mindfulness'
      );
    }

    return exercises.filter((exercise) => exercise.category === categoryId);
  }, [categoryId, exercises]);

  // Seed exercises if none exist
  useEffect(() => {
    if (exercisesWithProgress && exercisesWithProgress.length === 0) {
      seedExercises();
    }
  }, [exercisesWithProgress, seedExercises]);

  // Back navigation handler
  const handleBackToCategories = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Exercise detail handlers
  const handleExercisePress = useCallback((exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetail(true);
  }, []);

  const handleStartExercise = useCallback(
    async (exercise: Exercise) => {
      setShowDetail(false);

      if (currentUser) {
        await recordCompletion({
          exerciseId: exercise.id as any,
          duration: parseInt(exercise.duration),
          feedback: 'Completed successfully',
        });
      }
    },
    [currentUser, recordCompletion]
  );

  // Ensure categoryId exists
  if (!categoryId) {
    return null;
  }

  return (
    <>
      <CategoryExerciseList
        categoryId={categoryId}
        exercises={filteredExercises}
        onExercisePress={handleExercisePress}
        onBackPress={handleBackToCategories}
      />

      {/* Exercise Detail Modal */}
      <ExerciseDetail
        exercise={selectedExercise}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onStart={handleStartExercise}
      />
    </>
  );
}
