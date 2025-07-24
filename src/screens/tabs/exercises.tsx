import React, { useState, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { ExerciseDetail, CategoryExerciseList } from '~/components/exercises';
// Temporarily use direct imports to debug missing CategoryGrid
import { CategoryGrid } from '~/components/exercises/CategoryGrid';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  useCurrentUser,
  useExercisesWithProgress,
  useUserStats,
} from '~/hooks/useSharedData';
import { useTranslation } from '~/hooks/useTranslation';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
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
  // Ultra vibrant colors for better visual appeal
  const colors: Record<string, string> = {
    mindfulness: '#EF4444', // Ultra vibrant coral red
    breathing: '#06B6D4', // Ultra vibrant turquoise
    movement: '#3B82F6', // Ultra vibrant sky blue
    journaling: '#10B981', // Ultra vibrant mint green
    relaxation: '#F59E0B', // Ultra vibrant warm yellow
    reminders: '#A855F7', // Ultra vibrant plum
  };
  return colors[category] || '#EF4444';
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
  };

  const handleBackToCategories = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    setCurrentView('categories');
    setSelectedCategory('');
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

  // Stats section component
  const statsSection = (
    <View className="flex-row justify-between mb-4">
      <View className="flex-1 bg-white rounded-2xl p-4 mr-2 shadow-sm">
        <Text variant="caption1" className="text-[#5A4A3A]/60 mb-1">
          This Week
        </Text>
        <Text variant="title2" className="text-[#5A4A3A] font-bold">
          {userStats?.completionsThisWeek || 0}
        </Text>
      </View>
      <View className="flex-1 bg-white rounded-2xl p-4 ml-2 shadow-sm">
        <Text variant="caption1" className="text-[#5A4A3A]/60 mb-1">
          Current Streak
        </Text>
        <Text variant="title2" className="text-[#5A4A3A] font-bold">
          {userStats?.currentStreak || 0} days
        </Text>
      </View>
    </View>
  );

  return (
    <>
      {/* Categories View */}
      {currentView === 'categories' ? (
        <DashboardLayout
          title={t('exercises.title') || 'Exercises'}
          subtitle={
            t('exercises.subtitle') || 'Guided activities for your wellbeing'
          }
          statsSection={statsSection}
        >
          <View style={{ paddingBottom: 80 }}>
            <CategoryGrid onCategorySelect={handleCategorySelect} />
          </View>
        </DashboardLayout>
      ) : (
        /* Exercise List View */
        <DashboardLayout scrollable={false}>
          <View style={{ paddingBottom: 80 }}>
            <CategoryExerciseList
              categoryId={selectedCategory}
              exercises={filteredExercises}
              onExercisePress={handleExercisePress}
              onBackPress={handleBackToCategories}
            />
          </View>
        </DashboardLayout>
      )}

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
