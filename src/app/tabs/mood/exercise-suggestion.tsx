import React, { useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useExercisesWithProgress } from '~/hooks/useSharedData';
import { useTranslation } from '~/hooks/useTranslation';

// Exercise category helpers
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    breathing: '🌬️',
    mindfulness: '🧘‍♀️',
    movement: '🚶‍♀️',
    journaling: '✍️',
    relaxation: '🛀',
  };
  return icons[category] || '⭐';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    mindfulness: '#EF4444',
    breathing: '#06B6D4',
    movement: '#3B82F6',
    journaling: '#10B981',
    relaxation: '#F59E0B',
  };
  return colors[category] || '#EF4444';
}

// Helper function to randomly select an exercise
function getRandomExercise(exercises: any[]) {
  if (!exercises || exercises.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * exercises.length);
  return exercises[randomIndex];
}

// Exercise Suggestion Card Component
function ExerciseSuggestionCard({
  exercise,
  onPress,
}: {
  exercise: any;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const categoryColor = getCategoryColor(exercise.category);
  const categoryIcon = getCategoryIcon(exercise.category);

  return (
    <View
      className="p-6"
      style={{
        backgroundColor: categoryColor + '15',
      }}
    >
      <Text
        variant="subhead"
        className="text-muted-foreground mb-3 font-medium"
      >
        {t('mood.suggestions.tryThisToElevate')}
      </Text>

      <View className="flex-row items-start mb-4">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center me-4"
          style={{ backgroundColor: categoryColor + '20' }}
        >
          <Text style={{ fontSize: 20 }}>{categoryIcon}</Text>
        </View>

        <View className="flex-1">
          <Text variant="title3" className="text-[#5A4A3A] font-bold mb-1">
            {exercise.title}
          </Text>
          <Text variant="body" className="text-[#5A4A3A] opacity-70 leading-5">
            {exercise.description}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Text variant="caption1" className="text-muted-foreground me-1">
              ⏱️
            </Text>
            <Text
              variant="caption1"
              className="text-muted-foreground font-medium"
            >
              {exercise.duration} {t('common.minutes')}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text variant="caption1" className="text-muted-foreground me-1">
              📊
            </Text>
            <Text
              variant="caption1"
              className="text-muted-foreground font-medium capitalize"
            >
              {t(`exercises.difficulty.${exercise.difficulty}`)}
            </Text>
          </View>
        </View>

        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: categoryColor + '15' }}
        >
          <Text
            variant="caption1"
            className="font-semibold capitalize"
            style={{ color: categoryColor }}
          >
            {t(`exercises.categories.${exercise.category}`)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        className="bg-brand-dark-blue py-4 rounded-2xl items-center"
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
          shadowColor: '#2F6A8D',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 6,
        })}
      >
        <Text
          variant="callout"
          className="text-white font-bold"
          style={{ fontSize: 16, letterSpacing: 0.5 }}
        >
          {t('exercises.startExercise')}
        </Text>
      </Pressable>
    </View>
  );
}

export default function ExerciseSuggestionModal() {
  const { t } = useTranslation();
  const exercisesWithProgress = useExercisesWithProgress();

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Transform exercises to UI format
  const exercises = useMemo(() => {
    if (!exercisesWithProgress) return [];

    return exercisesWithProgress.map((ex) => ({
      id: ex._id,
      title: ex.title,
      description: ex.description,
      duration: ex.duration,
      difficulty: ex.difficulty,
      category: ex.category,
    }));
  }, [exercisesWithProgress]);

  // Get random exercise suggestion
  const suggestedExercise = useMemo(() => {
    return getRandomExercise(exercises);
  }, [exercises]);

  const handleStartExercise = useCallback(() => {
    // Navigate to exercises tab
    router.push('/tabs/exercises');
  }, []);

  const handleGetNewSuggestion = useCallback(() => {
    // Force re-render by navigating to same route
    router.push('/tabs/mood/exercise-suggestion');
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={handleBack} className="me-4">
          <SymbolView name="arrow.left" size={24} tintColor="#5A4A3A" />
        </Pressable>
        <Text variant="title2" className="text-[#2D3748] font-bold">
          {t('mood.suggestions.title')}
        </Text>
      </View>

      <View className="flex-1 p-6">
        {suggestedExercise ? (
          <View
            className="rounded-3xl overflow-hidden border border-gray-200 bg-card"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <ExerciseSuggestionCard
              exercise={suggestedExercise}
              onPress={handleStartExercise}
            />
          </View>
        ) : (
          <View
            className="rounded-3xl p-6 border border-gray-200 items-center justify-center bg-foreground/15"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 4,
              minHeight: 200,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🧘‍♀️</Text>
            <Text
              variant="title3"
              className="text-[#5A4A3A] font-bold mb-2 text-center"
            >
              {t('mood.suggestions.loading')}
            </Text>
            <Text variant="body" className="text-gray-600 text-center">
              {t('mood.suggestions.findingPerfect')}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={handleGetNewSuggestion}
            className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text variant="callout" className="text-[#5A4A3A] font-semibold">
              {t('mood.suggestions.getNew')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/tabs/exercises')}
            className="flex-1 bg-[#5A4A3A] py-4 rounded-2xl items-center"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              shadowColor: '#5A4A3A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            })}
          >
            <Text variant="callout" className="text-white font-semibold">
              {t('mood.suggestions.browseAll')}
            </Text>
          </Pressable>
        </View>

        {/* Info Card */}
        <View className="mt-6 p-4 rounded-2xl border border-gray-200 bg-green-400/10">
          <View className="flex-row items-center mb-2">
            <Text style={{ fontSize: 20, marginInlineEnd: 8 }}>💡</Text>
            <Text variant="body" className="text-[#5A4A3A] font-semibold">
              {t('mood.suggestions.proTip')}
            </Text>
          </View>
          <Text variant="caption1" className="text-gray-600 leading-5">
            {t('mood.suggestions.proTipDescription')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
