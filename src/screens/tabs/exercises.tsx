import React, { useState, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { ExerciseDetail, CategoryExerciseList } from '~/components/exercises';
// Import new premium components
import { PremiumCategoryGrid } from '~/components/exercises/PremiumCategoryGrid';
import { PremiumStatsSection } from '~/components/exercises/PremiumStatsSection';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  useCurrentUser,
  useExercisesWithProgress,
  useUserStats,
} from '~/hooks/useSharedData';
import { useTranslation } from '~/hooks/useTranslation';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { colors } from '~/lib/design-tokens';
import type { Exercise } from '~/types';

function getCategoryIcon(category: string): string {
  // Return emojis to match the category cards design
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
  // Use premium design token colors
  const categoryColors: Record<string, string> = {
    mindfulness: colors.wellness.mindfulness.primary,
    breathing: colors.wellness.breathing.primary,
    movement: colors.wellness.movement.primary,
    journaling: colors.wellness.journaling.primary,
    relaxation: colors.wellness.relaxation.primary,
    reminders: colors.wellness.reminders.primary,
  };
  return categoryColors[category] || colors.wellness.mindfulness.primary;
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

function ExercisesScreen() {
  const { t, locale } = useTranslation();
  const [currentView, setCurrentView] = useState<'categories' | 'exercises'>(
    'categories'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);
  const [showExerciseOverlay, setShowExerciseOverlay] = useState(false);

  // Simple spring animation - no complex timing
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Data - auth is handled at tab layout level
  const currentUser = useCurrentUser();
  const exercisesWithProgress = useExercisesWithProgress();
  const userStats = useUserStats();
  const recordCompletion = useMutation(api.userProgress.recordCompletion);
  const seedExercises = useMutation(api.seed.seedExercises);

  // Transform Convex exercises to UI format
  const exercises: Exercise[] =
    exercisesWithProgress?.map((ex) => ({
      id: ex._id,
      title: locale === 'ar' ? ex.titleAr : ex.title,
      description: locale === 'ar' ? ex.descriptionAr : ex.description,
      duration: `${ex.duration} min`,
      difficulty: ex.difficulty,
      category: ex.category,
      icon: getCategoryIcon(ex.category),
      color: getCategoryColor(ex.category),
      steps: locale === 'ar' ? ex.instructionsAr : ex.instructions,
      benefits: getBenefitsForCategory(ex.category, t),
    })) || [];

  // Seed exercises if none exist
  useEffect(() => {
    if (exercisesWithProgress && exercisesWithProgress.length === 0) {
      seedExercises();
    }
  }, [exercisesWithProgress, seedExercises]);

  const filteredExercises = useMemo(() => {
    if (!selectedCategory) return exercises;
    // Handle special case for 'reminders' category
    if (selectedCategory === 'reminders') {
      return exercises.filter(
        (exercise) =>
          exercise.category === 'relaxation' ||
          exercise.category === 'mindfulness'
      );
    }
    return exercises.filter(
      (exercise) => exercise.category === selectedCategory
    );
  }, [selectedCategory, exercises]);

  const handleCategorySelect = (categoryId: string) => {
    impactAsync(ImpactFeedbackStyle.Medium);
    setSelectedCategory(categoryId);
    setCurrentView('exercises');
    setShowExerciseOverlay(true);
    
    // Start from right and spring to center - no timing needed
    translateX.value = 100;
    translateX.value = withSpring(0);
  };

  const completeBackTransition = () => {
    setShowExerciseOverlay(false);
    setCurrentView('categories');
    setSelectedCategory('');
    translateX.value = 0;
  };

  const handleBackToCategories = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    
    // Animate slide out and wait for ACTUAL completion
    translateX.value = withSpring(100, undefined, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(completeBackTransition)();
      }
    });
  };

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetail(true);
  };

  const handleStartExercise = async (exercise: Exercise) => {
    setShowDetail(false);

    // Record exercise completion (in real app, this would happen after actual completion)
    if (currentUser) {
      await recordCompletion({
        exerciseId: exercise.id as any,
        duration: parseInt(exercise.duration),
        feedback: 'Completed successfully',
      });
    }
  };

  // Premium stats section component
  const statsSection = (
    <PremiumStatsSection
      completionsThisWeek={userStats?.completionsThisWeek || 0}
      currentStreak={userStats?.currentStreak || 0}
      totalCompletions={(userStats as any)?.totalCompletions || 0}
      weeklyGoal={7}
    />
  );

  return (
    <>
      <DashboardLayout
        statsSection={currentView === 'categories' ? statsSection : undefined}
        // Show header only on category grid view for consistency
        title={
          currentView === 'categories'
            ? t('exercises.title') || 'Exercises'
            : undefined
        }
        showHeader={currentView === 'categories'}
        scrollable={true}
        contentStyle={{ paddingHorizontal: 0 }}
      >
        {/* Base layer - category grid always visible and mounted */}
        <PremiumCategoryGrid onCategorySelect={handleCategorySelect} />
        
        {/* Overlay layer - exercise list slides over categories when active */}
        {showExerciseOverlay && (
          <Animated.View 
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#F2FAF9', // Match background to cover categories
                zIndex: 1,
              },
              animatedStyle
            ]}
          >
            <CategoryExerciseList
              categoryId={selectedCategory}
              exercises={filteredExercises}
              onExercisePress={handleExercisePress}
              onBackPress={handleBackToCategories}
            />
          </Animated.View>
        )}
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

export default ExercisesScreen;
