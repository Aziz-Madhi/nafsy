import React, { useState, useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { PremiumCategoryGrid } from '~/components/exercises/PremiumCategoryGrid';
import { PremiumStatsSection } from '~/components/exercises/PremiumStatsSection';
import { DailyExerciseCard } from '~/components/exercises/DailyExerciseCard';
import { ExerciseDetail } from '~/components/exercises';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useCurrentUser, useUserStats } from '~/hooks/useSharedData';
import { useTranslation } from '~/hooks/useTranslation';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import {
  getTimeBasedGreeting,
  getMotivationalMessage,
} from '~/lib/daily-exercise-utils';
import type { Exercise } from '~/types';

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

export default function ExercisesIndex() {
  const { t, locale } = useTranslation();

  // State for ExerciseDetail modal (remains global)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);

  // Data fetching
  const currentUser = useCurrentUser();
  const userStats = useUserStats();
  const recordCompletion = useMutation(api.userProgress.recordCompletion);
  const dailyExerciseData = useQuery(api.exercises.getDailyExercise);

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

  // Daily exercise data
  const dailyExercise = useMemo(() => {
    if (!dailyExerciseData || !isStoreStable) return null;

    return {
      id: dailyExerciseData._id,
      title:
        locale === 'ar' ? dailyExerciseData.titleAr : dailyExerciseData.title,
      description:
        locale === 'ar'
          ? dailyExerciseData.descriptionAr
          : dailyExerciseData.description,
      duration: `${dailyExerciseData.duration} min`,
      difficulty: dailyExerciseData.difficulty,
      category: dailyExerciseData.category,
      icon: getCategoryIcon(dailyExerciseData.category),
      color: getCategoryColor(dailyExerciseData.category),
      steps:
        locale === 'ar'
          ? dailyExerciseData.instructionsAr
          : dailyExerciseData.instructions,
      benefits: translatedBenefits[dailyExerciseData.category] || [],
    };
  }, [dailyExerciseData, locale, translatedBenefits, isStoreStable]);

  // Navigation handler for category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    impactAsync(ImpactFeedbackStyle.Medium);
    router.push(`/tabs/exercises/category/${categoryId}`);
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

  // Stats values
  const statsValues = useMemo(
    () => ({
      completionsThisWeek: userStats?.completionsThisWeek ?? 0,
      currentStreak: userStats?.currentStreak ?? 0,
      totalCompletions: (userStats as any)?.totalCompletions ?? 0,
    }),
    [
      userStats?.completionsThisWeek,
      userStats?.currentStreak,
      (userStats as any)?.totalCompletions,
    ]
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
  const screenTitle = useMemo(() => t('exercises.title') || 'Exercises', [t]);

  // Daily exercise helpers
  const greeting = useMemo(() => getTimeBasedGreeting(locale), [locale]);
  const motivationalMessage = useMemo(
    () =>
      dailyExercise
        ? getMotivationalMessage(dailyExercise.category, locale)
        : '',
    [dailyExercise, locale]
  );

  return (
    <>
      <DashboardLayout
        statsSection={statsSection}
        title={screenTitle}
        showHeader={true}
        scrollable={true}
        contentStyle={{ paddingHorizontal: 0 }}
      >
        {/* Daily Exercise Card */}
        <DailyExerciseCard
          exercise={dailyExercise}
          onPress={() =>
            dailyExercise ? handleExercisePress(dailyExercise) : () => {}
          }
          greeting={greeting}
          motivationalMessage={motivationalMessage}
        />

        {/* Category Grid */}
        <PremiumCategoryGrid onCategorySelect={handleCategorySelect} />
      </DashboardLayout>

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
