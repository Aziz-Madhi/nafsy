import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CategoryExerciseList } from '~/components/exercises';
import { useConvex, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { useCurrentUser, useExercisesWithProgress } from '~/hooks/useSharedData';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import type { Exercise } from '~/types';
import { useTranslation } from '~/hooks/useTranslation';
import { useAudioPlayer } from '~/providers/AudioPlayerProvider';
// Play audio directly from the category list (no detail screen)

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

function getBenefitsForCategory(
  category: string,
  t: (key: string) => string
): string[] {
  const benefitKeys: Record<string, string[]> = {
    breathing: [
      'exercises.benefits.breathing.0',
      'exercises.benefits.breathing.1',
      'exercises.benefits.breathing.2',
    ],
    mindfulness: [
      'exercises.benefits.mindfulness.0',
      'exercises.benefits.mindfulness.1',
      'exercises.benefits.mindfulness.2',
    ],
    movement: [
      'exercises.benefits.movement.0',
      'exercises.benefits.movement.1',
      'exercises.benefits.movement.2',
    ],
    journaling: [
      'exercises.benefits.journaling.0',
      'exercises.benefits.journaling.1',
      'exercises.benefits.journaling.2',
    ],
    relaxation: [
      'exercises.benefits.relaxation.0',
      'exercises.benefits.relaxation.1',
      'exercises.benefits.relaxation.2',
    ],
  };
  const keys = benefitKeys[category] || [];
  return keys.map((key) => t(key));
}

export default function CategoryModal() {
  const { t, currentLanguage } = useTranslation();
  const { id: categoryId } = useLocalSearchParams<{ id: string }>();
  const convex = useConvex();
  const { open: openAudio } = useAudioPlayer();

  // No local modal; use pushed screen for details

  // Data fetching
  const currentUser = useCurrentUser();
  const exercisesWithProgress = useExercisesWithProgress(categoryId as string);
  const recordCompletion = useMutation(api.userProgress.recordCompletion);
  const seedExercises = useMutation(api.seed.seedExercises);

  // Store stability guard
  const [isStoreStable] = useState(true);

  // No selected exercise state in this screen

  // Cache benefits
  const benefitsMap = useMemo(() => {
    const benefits: Record<string, string[]> = {};
    const categories = [
      'breathing',
      'mindfulness',
      'movement',
      'journaling',
      'relaxation',
    ];

    categories.forEach((category) => {
      benefits[category] = getBenefitsForCategory(category, t);
    });

    return benefits;
  }, [t]);

  // Transform exercises to UI format
  const exercises: Exercise[] = useMemo(() => {
    if (!exercisesWithProgress || !isStoreStable) return [];

    return exercisesWithProgress.map((ex) => ({
      id: ex._id,
      title: ex.title,
      titleAr: ex.titleAr,
      description: ex.description,
      descriptionAr: ex.descriptionAr,
      duration: `${ex.duration} min`,
      difficulty: ex.difficulty,
      category: ex.category,
      audioKey: (ex as any).audioKey,
      icon: getCategoryIcon(ex.category),
      color: getCategoryColor(ex.category),
      steps: ex.instructions,
      stepsAr: ex.instructionsAr,
      benefits: benefitsMap[ex.category] || [],
    }));
  }, [exercisesWithProgress, benefitsMap, isStoreStable]);

  // Filter exercises for this category
  const filteredExercises = useMemo(() => {
    if (!categoryId) return exercises;
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

  // Start playback immediately on exercise tap
  const handleExercisePress = useCallback(
    async (exercise: Exercise) => {
      try {
        impactAsync(ImpactFeedbackStyle.Medium);
        let signedUrl: string | null = null;
        if ((exercise as any).audioKey || (exercise as any).audioKeyAr) {
          try {
            signedUrl = await convex.query(api.r2.getExerciseAudioUrl, {
              exerciseId: exercise.id as any,
              lang: currentLanguage?.startsWith('ar') ? 'ar' : 'en',
              expiresIn: 60 * 60 * 6,
            });
          } catch {}
        }

        const minutes = parseInt(exercise.duration);
        await openAudio({
          id: String(exercise.id),
          title: exercise.title,
          subtitle: exercise.category,
          icon: exercise.icon,
          color: exercise.color,
          durationSeconds: Number.isFinite(minutes) ? minutes * 60 : undefined,
          sourceUri: signedUrl ?? undefined,
        });

        // Record a completion immediately (same behavior as old detail screen)
        await recordCompletion({
          exerciseId: exercise.id as any,
          duration: Number.isFinite(minutes) ? minutes : 0,
          feedback: t('exercises.exerciseCompleted'),
        });
      } catch {}
    },
    [convex, openAudio, recordCompletion, t, currentLanguage]
  );

  // Start handled inside the detail screen

  // Ensure categoryId exists
  if (!categoryId) {
    return null;
  }

  return (
    <>
      <CategoryExerciseList
        categoryId={categoryId}
        exercises={filteredExercises}
        loading={!exercisesWithProgress}
        onExercisePress={handleExercisePress}
        onBackPress={handleBackToCategories}
      />
    </>
  );
}
