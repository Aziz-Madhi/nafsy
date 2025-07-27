import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useScreenPadding } from '~/hooks/useScreenPadding';
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
  const [isAnimating, setIsAnimating] = useState(false);

  // ScrollView reference with debugging
  const scrollViewRef = useRef<ScrollView>(null);

  // Get proper safe area padding for the overlay
  const screenPadding = useScreenPadding('list');

  // Memoize contentStyle to prevent ContentWrapper re-renders
  const dashboardContentStyle = useMemo(() => ({ paddingHorizontal: 0 }), []);

  // Screen width used for slide animations - memoized to prevent handleCategorySelect recreation
  const SCREEN_WIDTH = useMemo(() => Dimensions.get('window').width, []);

  // Shared value controlling horizontal slide animation
  const translateX = useSharedValue(0);

  // Cleanup animation on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      'worklet';
      // Cancel any ongoing animations and reset shared value
      translateX.value = 0;
    };
  }, [translateX]);

  // Consistent spring configuration for smooth animations - Memoized to prevent recreation
  const SPRING_CONFIG = useMemo(
    () => ({
      damping: 20,
      stiffness: 150,
      mass: 1,
    }),
    []
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Data - auth is handled at tab layout level
  const currentUser = useCurrentUser();
  const exercisesWithProgress = useExercisesWithProgress();
  const userStats = useUserStats();
  const recordCompletion = useMutation(api.userProgress.recordCompletion);
  const seedExercises = useMutation(api.seed.seedExercises);

  // Store hydration stability guard - prevent renders during MMKV migration
  // CRITICAL FIX: Remove artificial delay that causes race conditions with animations
  const [isStoreStable, setIsStoreStable] = useState(true);

  // Cache translated benefits to prevent exercises array recreation when t changes
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

  // Transform Convex exercises to UI format - Memoized to prevent re-creation
  const exercises: Exercise[] = useMemo(() => {
    // Guard against premature rendering during store hydration
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

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      // Prevent multiple transitions - critical guard
      if (isAnimating) {
        return;
      }

      impactAsync(ImpactFeedbackStyle.Medium);
      setSelectedCategory(categoryId);
      setCurrentView('exercises');
      setShowExerciseOverlay(true);
      setIsAnimating(true);

      // Start just off-screen and spring to center
      translateX.value = SCREEN_WIDTH;
      translateX.value = withSpring(0, SPRING_CONFIG, (finished) => {
        'worklet';
        // Always complete the transition to prevent state desync
        runOnJS(setIsAnimating)(false);
      });
    },
    [SCREEN_WIDTH, SPRING_CONFIG, translateX, isAnimating]
  );

  const completeBackTransition = useCallback(() => {
    // Synchronous state updates to prevent concurrent feature conflicts
    setIsAnimating(false);
    setShowExerciseOverlay(false);
    setCurrentView('categories');
    setSelectedCategory('');
    
    // Leave translateX at its last value; it will be re-initialized on next entry
  }, [translateX]);

  const handleBackToCategories = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);

    // Prevent multiple back transitions - critical guard
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);

    // Animate the overlay fully off-screen with optimized spring config
    translateX.value = withSpring(
      SCREEN_WIDTH,
      {
        damping: 25, // Increased for faster settling
        stiffness: 200, // Increased for quicker response
        mass: 0.8, // Reduced for lighter feel
      },
      (finished) => {
        'worklet';
        // Always call completion to prevent animation state desync
        runOnJS(completeBackTransition)();
      }
    );
  }, [isAnimating, SCREEN_WIDTH, translateX, completeBackTransition]);

  const handleExercisePress = useCallback((exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetail(true);
  }, []);

  const handleStartExercise = useCallback(
    async (exercise: Exercise) => {
      setShowDetail(false);

      // Record exercise completion (in real app, this would happen after actual completion)
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

  // Stabilize stats values to prevent unnecessary recreations during transitions
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

  // Premium stats section component - Memoized to prevent re-renders
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

  // Memoize title to prevent re-renders from translation changes
  const screenTitle = useMemo(() => t('exercises.title') || 'Exercises', [t]);

  return (
    <>
      <DashboardLayout
        statsSection={statsSection}
        title={screenTitle}
        showHeader={true}
        scrollable={true}
        contentStyle={dashboardContentStyle}
      >
        {/* Base layer - category grid always visible and mounted */}
        {useMemo(
          () => (
            <PremiumCategoryGrid onCategorySelect={handleCategorySelect} />
          ),
          [handleCategorySelect]
        )}
      </DashboardLayout>

      {/* Completely isolated overlay layer - independent scroll context */}
      {/* CRITICAL FIX: Simplified overlay rendering to prevent timing conflicts */}
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
              zIndex: 1000, // High z-index to ensure it's above everything
            },
            animatedStyle,
          ]}
        >
          <SafeAreaView
            style={{
              flex: 1,
              paddingTop: screenPadding.top,
            }}
            edges={[]}
          >
            <CategoryExerciseList
              categoryId={selectedCategory}
              exercises={filteredExercises}
              onExercisePress={handleExercisePress}
              onBackPress={handleBackToCategories}
            />
          </SafeAreaView>
        </Animated.View>
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
