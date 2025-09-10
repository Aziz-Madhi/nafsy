import React, { useState, useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { PremiumCategoryGrid } from '~/components/exercises/PremiumCategoryGrid';
import { PremiumStatsSection } from '~/components/exercises/PremiumStatsSection';
import { DailyExerciseCard } from '~/components/exercises/DailyExerciseCard';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useCurrentUser } from '~/hooks/useSharedData';
import {
  useOfflineUserStats,
  useOfflineExercisesWithProgress,
  useOfflineRecordProgress,
} from '~/hooks/useOfflineData';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import {
  getTimeBasedGreeting,
  getMotivationalMessage,
} from '~/lib/daily-exercise-utils';
import type { Exercise } from '~/types';
import { useTranslation } from '~/hooks/useTranslation';
import { useAudioPlayer } from '~/providers/AudioPlayerProvider';

// Utility functions from original exercises.tsx
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

export default function ExercisesIndex() {
  const { t } = useTranslation();
  const { open: openAudio } = useAudioPlayer();
  const convex = useConvex();

  // No modal here; navigate to detail screen

  // Data fetching
  const currentUser = useCurrentUser();
  const userStats = useOfflineUserStats();
  const recordCompletion = useOfflineRecordProgress();
  const dailyExerciseData = useQuery(
    api.exercises.getDailyExercise,
    currentUser ? {} : 'skip'
  );

  // Store stability guard
  const [isStoreStable] = useState(true);

  // No selected-exercise audio prefetch on this screen anymore

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

  // Daily exercise data
  const dailyExercise = useMemo(() => {
    if (!dailyExerciseData || !isStoreStable) return null;

    return {
      id: dailyExerciseData._id,
      title: dailyExerciseData.title,
      titleAr: dailyExerciseData.titleAr,
      description: dailyExerciseData.description,
      descriptionAr: dailyExerciseData.descriptionAr,
      duration: `${dailyExerciseData.duration} min`,
      difficulty: dailyExerciseData.difficulty,
      category: dailyExerciseData.category,
      audioKey: (dailyExerciseData as any).audioKey,
      icon: getCategoryIcon(dailyExerciseData.category),
      color: getCategoryColor(dailyExerciseData.category),
      steps: dailyExerciseData.instructions,
      stepsAr: dailyExerciseData.instructionsAr,
      benefits: benefitsMap[dailyExerciseData.category] || [],
    };
  }, [dailyExerciseData, benefitsMap, isStoreStable]);

  // Navigation handler for category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    impactAsync(ImpactFeedbackStyle.Medium);
    router.push(`/tabs/exercises/category/${categoryId}`);
  }, []);

  // Exercise detail handlers
  const handleExercisePress = useCallback((exercise: Exercise) => {
    router.push(`/tabs/exercises/exercise/${exercise.id}`);
  }, []);

  // Start handled in the detail screen

  // Stats values
  const totalCompletions = (userStats as any)?.totalCompletions ?? 0;
  const statsValues = useMemo(
    () => ({
      completionsThisWeek: userStats?.completionsThisWeek ?? 0,
      currentStreak: userStats?.currentStreak ?? 0,
      totalCompletions,
    }),
    [userStats, totalCompletions]
  );

  // Stats section component
  const statsSection = useMemo(
    () => (
      <PremiumStatsSection
        completionsThisWeek={statsValues.completionsThisWeek}
        currentStreak={statsValues.currentStreak}
        totalCompletions={statsValues.totalCompletions}
        weeklyGoal={7}
      />
    ),
    [statsValues]
  );

  // Screen title
  const screenTitle = useMemo(() => t('exercises.title'), [t]);

  // Daily exercise helpers
  const greeting = useMemo(() => getTimeBasedGreeting(t), [t]);
  const motivationalMessage = useMemo(
    () =>
      dailyExercise ? getMotivationalMessage(dailyExercise.category, t) : '',
    [dailyExercise, t]
  );

  // Memoize content style
  const contentStyle = useMemo(() => ({ paddingHorizontal: 0 }), []);

  // Start daily exercise immediately on press
  const handleDailyExercisePress = useCallback(async () => {
    if (!dailyExercise) return;
    try {
      let signedUrl: string | null = null;
      if ((dailyExercise as any).audioKey) {
        try {
          signedUrl = await convex.query(api.r2.getExerciseAudioUrl, {
            exerciseId: dailyExercise.id as any,
            expiresIn: 60 * 60 * 6,
          });
        } catch {}
      }

      const minutes = parseInt(dailyExercise.duration);
      await openAudio({
        id: String(dailyExercise.id),
        title: dailyExercise.title,
        subtitle: dailyExercise.category,
        icon: dailyExercise.icon,
        color: dailyExercise.color,
        durationSeconds: Number.isFinite(minutes) ? minutes * 60 : undefined,
        sourceUri: signedUrl ?? undefined,
      });

      await recordCompletion({
        exerciseId: dailyExercise.id as any,
        duration: Number.isFinite(minutes) ? minutes : 0,
        feedback: t('exercises.exerciseCompleted'),
      });
    } catch {}
  }, [dailyExercise, convex, openAudio, recordCompletion, t]);

  return (
    <>
      <DashboardLayout
        statsSection={statsSection}
        title={screenTitle}
        showHeader={true}
        scrollable={true}
        contentStyle={contentStyle}
      >
        {/* Daily Exercise Card */}
        <DailyExerciseCard
          exercise={dailyExercise}
          onPress={handleDailyExercisePress}
          greeting={greeting}
          motivationalMessage={motivationalMessage}
        />

        {/* Category Grid */}
        <PremiumCategoryGrid onCategorySelect={handleCategorySelect} />
      </DashboardLayout>

      {/* no modal here */}
    </>
  );
}
