import React, { useState, useMemo, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { CategoryGrid, CategoryExerciseList, ExerciseDetail } from '~/components/exercises';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '~/hooks/useTranslation';
import * as Haptics from 'expo-haptics';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'breathing' | 'mindfulness' | 'movement' | 'cbt' | 'journaling' | 'relaxation';
  icon: string;
  color: string;
  steps?: string[];
  benefits?: string[];
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    breathing: '🫁',
    mindfulness: '🧘',
    movement: '🚶',
    journaling: '📝',
    relaxation: '💆',
  };
  return icons[category] || '✨';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    breathing: '#06B6D4',
    mindfulness: '#8B5CF6',
    movement: '#10B981',
    journaling: '#F59E0B',
    relaxation: '#EC4899',
  };
  return colors[category] || '#3B82F6';
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
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  const { t, locale } = useTranslation();
  const [currentView, setCurrentView] = useState<'categories' | 'exercises'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Show loading state if Clerk hasn't loaded yet
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">{t('common.pleaseSignIn')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Convex hooks
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : 'skip'
  );
  const exercisesWithProgress = useQuery(
    api.exercises.getExercisesWithProgress,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  const userStats = useQuery(
    api.userProgress.getUserStats,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  const recordCompletion = useMutation(api.userProgress.recordCompletion);
  const seedExercises = useMutation(api.seed.seedExercises);

  // Transform Convex exercises to UI format
  const exercises: Exercise[] = exercisesWithProgress?.map(ex => ({
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
      return exercises.filter(exercise => 
        exercise.category === 'relaxation' || exercise.category === 'mindfulness'
      );
    }
    return exercises.filter(exercise => exercise.category === selectedCategory);
  }, [selectedCategory, exercises]);

  const handleCategorySelect = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(categoryId);
    setCurrentView('exercises');
  };

  const handleBackToCategories = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        userId: currentUser._id,
        exerciseId: exercise.id as any,
        duration: parseInt(exercise.duration),
        feedback: "Completed successfully",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>

      {/* Content Area */}
      {currentView === 'categories' ? (
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Container with rounded corners */}
          <View 
            className="rounded-[20px] overflow-hidden mx-6 mt-3"
            style={{ backgroundColor: '#F2FAF9', minHeight: 600 }}
          >
            {/* Enhanced Stats Dashboard */}
            <Animated.View
              entering={FadeInDown.springify()}
              className="mx-6 mt-8"
            >
              {/* Welcome Header */}
              <View className="mb-4">
                <Text variant="title1" className="text-[#5A4A3A] font-bold mb-2">
                  {t('exercises.title')}
                </Text>
                <Text variant="body" className="text-[#5A4A3A]/80">
                  {t('exercises.subtitle')}
                </Text>
              </View>

              {/* Unified Visual Dashboard - More Compact */}
              <View className="bg-white/40 rounded-3xl p-5 mb-6 shadow-sm">
                <Text variant="heading" className="text-[#5A4A3A] font-semibold mb-4">
                  Your Wellness Journey
                </Text>
                
                {/* Main Visual Section */}
                <View className="flex-row items-center justify-between mb-6">
                  {/* Left: Progress Ring */}
                  <View className="items-center">
                    <View className="relative w-20 h-20 items-center justify-center">
                      {/* Background Ring */}
                      <View 
                        className="absolute w-20 h-20 rounded-full border-4"
                        style={{ borderColor: '#5A4A3A20' }}
                      />
                      {/* Progress Ring */}
                      <View 
                        className="absolute w-20 h-20 rounded-full border-4"
                        style={{ 
                          borderColor: '#5A4A3A',
                          borderTopColor: 'transparent',
                          borderRightColor: (userStats?.completionsThisWeek || 0) >= 2 ? '#5A4A3A' : 'transparent',
                          borderBottomColor: (userStats?.completionsThisWeek || 0) >= 4 ? '#5A4A3A' : 'transparent',
                          borderLeftColor: (userStats?.completionsThisWeek || 0) >= 6 ? '#5A4A3A' : 'transparent',
                          transform: [{ rotate: '-90deg' }]
                        }}
                      />
                      {/* Center Content */}
                      <View className="items-center">
                        <Text variant="title3" className="text-[#5A4A3A] font-bold">
                          {userStats?.completionsThisWeek || 0}
                        </Text>
                        <Text variant="caption2" className="text-[#5A4A3A]/60">
                          of 7
                        </Text>
                      </View>
                    </View>
                    <Text variant="caption1" className="text-[#5A4A3A]/80 mt-2 text-center font-medium">
                      This Week
                    </Text>
                  </View>

                  {/* Right: Stats Grid */}
                  <View className="flex-1 ml-6">
                    {/* Streak Visualization */}
                    <View className="flex-row items-center mb-3">
                      <View className="flex-row items-center">
                        {Array.from({ length: Math.min(userStats?.currentStreak || 0, 5) }).map((_, i) => (
                          <Text key={i} className="text-base mr-1">🔥</Text>
                        ))}
                        {(userStats?.currentStreak || 0) === 0 && (
                          <Text className="text-base opacity-30">🔥</Text>
                        )}
                      </View>
                      <View className="ml-2">
                        <Text variant="callout" className="text-[#5A4A3A] font-bold">
                          {userStats?.currentStreak || 0}
                        </Text>
                        <Text variant="caption2" className="text-[#5A4A3A]/60">
                          Day Streak
                        </Text>
                      </View>
                    </View>

                    {/* Sessions & Time in Row */}
                    <View className="flex-row justify-between">
                      <View className="flex-row items-center">
                        <Text className="text-sm mr-2">✅</Text>
                        <View>
                          <Text variant="callout" className="text-[#5A4A3A] font-bold">
                            {userStats?.totalSessions || 0}
                          </Text>
                          <Text variant="caption2" className="text-[#5A4A3A]/60">
                            Sessions
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-sm mr-2">⏱️</Text>
                        <View>
                          <Text variant="callout" className="text-[#5A4A3A] font-bold">
                            {userStats?.totalMinutes || 0}m
                          </Text>
                          <Text variant="caption2" className="text-[#5A4A3A]/60">
                            Time
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Weekly Calendar - Compact */}
                <View className="mb-4">
                  <Text variant="subhead" className="text-[#5A4A3A]/80 mb-3 font-medium">
                    Weekly Progress
                  </Text>
                  <View className="flex-row justify-between items-center">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                      const isCompleted = index < (userStats?.completionsThisWeek || 0);
                      return (
                        <View key={index} className="items-center">
                          <View 
                            className={`w-7 h-7 rounded-full border-2 items-center justify-center mb-1 ${
                              isCompleted 
                                ? 'bg-[#5A4A3A] border-[#5A4A3A]' 
                                : 'bg-transparent border-[#5A4A3A]/30'
                            }`}
                          >
                            {isCompleted && (
                              <Text className="text-white text-xs font-bold">✓</Text>
                            )}
                          </View>
                          <Text 
                            variant="caption2" 
                            className={`${isCompleted ? 'text-[#5A4A3A]' : 'text-[#5A4A3A]/50'} font-medium`}
                          >
                            {day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Favorite Category - Compact */}
                <View className="bg-[#5A4A3A]/10 rounded-2xl p-3">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">🧘‍♀️</Text>
                    <View>
                      <Text variant="subhead" className="text-[#5A4A3A] font-semibold">
                        {userStats?.favoriteExercise?.category || 'Mindfulness'}
                      </Text>
                      <Text variant="caption1" className="text-[#5A4A3A]/60">
                        Most practiced • {Math.round(userStats?.averageSessionDuration || 5)}min avg
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Category Grid */}
            <View className="mt-4 pb-8">
              <CategoryGrid onCategorySelect={handleCategorySelect} />
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1">
          <CategoryExerciseList
            categoryId={selectedCategory}
            exercises={filteredExercises}
            onExercisePress={handleExercisePress}
            onBackPress={handleBackToCategories}
          />
        </View>
      )}

      {/* Exercise Detail Modal */}
      <ExerciseDetail
        exercise={selectedExercise}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onStart={handleStartExercise}
      />
    </SafeAreaView>
  );
}

export default ExercisesScreen;