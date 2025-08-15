import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { MotiView } from 'moti';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useColors, useShadowStyle } from '~/hooks/useColors';
import type { Exercise } from '~/types';
import ExerciseDetail from '~/components/exercises/ExerciseDetail';
import { useTranslation } from '~/hooks/useTranslation';

interface MoodBasedExerciseSuggestionProps {
  mood: 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry';
  exercise: Exercise | null;
  isLoading?: boolean;
}

export function MoodBasedExerciseSuggestion({
  exercise,
  isLoading = false,
}: MoodBasedExerciseSuggestionProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const shadowMedium = useShadowStyle('medium');
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);

  // Get category colors - matching ModernCategoryCard exactly
  const getCategoryColors = useMemo(() => {
    if (!exercise)
      return {
        base: colors.primary,
        background: colors.primary + '15',
        text: colors.foreground,
      };

    // Same color mapping as ModernCategoryCard
    const exerciseColors: Record<string, string> = {
      mindfulness: '#EF4444', // Red
      breathing: '#06B6D4', // Cyan
      movement: '#3B82F6', // Blue
      journaling: '#10B981', // Green
      relaxation: '#F59E0B', // Amber
      reminders: '#8B5CF6', // Purple
    };

    const baseColor = exerciseColors[exercise.category] || '#FAFAFA';

    // Use same background opacity for both light and dark modes - matching category cards
    const backgroundColor = baseColor + '15'; // 15% opacity for both modes

    // Use dark gray text that works on light pastel backgrounds
    const textColor = '#374151'; // Gray-700 for readability on pastel backgrounds

    return {
      base: baseColor,
      background: backgroundColor,
      text: textColor,
    };
  }, [exercise, colors]);

  const handlePress = () => {
    if (exercise) {
      impactAsync(ImpactFeedbackStyle.Medium);
      // Open exercise detail modal directly
      setShowExerciseDetail(true);
    }
  };

  const handleCloseDetail = () => {
    setShowExerciseDetail(false);
  };

  const handleStartExercise = (selectedExercise: Exercise) => {
    // Handle exercise start logic here if needed
    console.log('Starting exercise:', selectedExercise.title);
    setShowExerciseDetail(false);
  };

  // Enrich exercise data with missing fields for ExerciseDetail
  const enrichedExercise = useMemo(() => {
    if (!exercise) return null;

    // Add missing fields that ExerciseDetail expects
    const categoryIcons: Record<string, string> = {
      mindfulness: '🧘',
      breathing: '🌬️',
      movement: '🏃',
      journaling: '📝',
      relaxation: '😌',
      reminders: '🔔',
    };

    return {
      ...exercise,
      icon: categoryIcons[exercise.category] || '🧘',
      color: getCategoryColors.base,
      // Convert any array fields if they exist
      benefits: (exercise as any).benefits || [],
      steps: (exercise as any).instructions || [],
    };
  }, [exercise, getCategoryColors]);

  if (isLoading || !exercise) {
    // Loading skeleton
    return (
      <View className="mb-6" style={{ marginHorizontal: 6 }}>
        <View
          className="rounded-3xl p-6 bg-black/[0.03] dark:bg-white/[0.03]"
          style={{
            ...shadowMedium,
          }}
        >
          <View className="animate-pulse">
            <View className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <View className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
            <View className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <View className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <View className="h-12 w-32 bg-gray-300 dark:bg-gray-600 rounded-2xl" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95, translateY: 10 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: 100,
      }}
      className="mb-6"
      style={{ marginHorizontal: 6 }}
    >
      <View
        className="rounded-3xl overflow-hidden"
        style={{
          ...shadowMedium,
        }}
      >
        {/* Top section - white background with pastel overlay for consistency */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            backgroundColor: getCategoryColors.background,
          }}
        >
          <View
            className="absolute inset-0 bg-white"
            style={{
              zIndex: -1,
            }}
          />
          <Text
            className="mb-2"
            style={{
              color: getCategoryColors.text,
              fontFamily: 'Inter_600SemiBold',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              opacity: 0.7,
              lineHeight: 16,
            }}
          >
            {t('mood.exerciseSuggestion.recommendedForYou')}
          </Text>

          {/* Category display - minimal line design */}
          <View className="flex-row items-center mb-3">
            <View
              style={{
                height: 1,
                width: 24,
                backgroundColor: getCategoryColors.text,
                marginRight: 10,
                opacity: 0.3,
              }}
            />
            <Text
              style={{
                color: getCategoryColors.text,
                fontFamily: 'Inter_700Bold',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              {t(`exercises.categories.${exercise.category}`)}
            </Text>
            <View
              style={{
                height: 1,
                width: 24,
                backgroundColor: getCategoryColors.text,
                marginLeft: 10,
                opacity: 0.3,
              }}
            />
          </View>

          <Text
            className="mb-2"
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 22,
              lineHeight: 28,
              color: getCategoryColors.text,
            }}
          >
            {exercise.title}
          </Text>

          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              lineHeight: 21,
              color: getCategoryColors.text,
              opacity: 0.8,
              paddingBottom: 2,
            }}
            numberOfLines={2}
          >
            {exercise.description}
          </Text>
        </View>

        {/* Bottom section with proper dark mode background */}
        <View className="p-5 bg-white dark:bg-card">
          {/* Exercise info - minimal text-based design */}
          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center">
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: colors.foreground,
                  opacity: colors.background === '#171717' ? 0.6 : 0.5,
                }}
              >
                {t('exercises.duration')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 13,
                  color: colors.foreground,
                  marginLeft: 6,
                }}
              >
                {exercise.duration} {t('common.minutes')}
              </Text>
            </View>
            {exercise.difficulty && (
              <>
                <Text
                  style={{
                    marginHorizontal: 12,
                    color: colors.foreground,
                    opacity: colors.background === '#171717' ? 0.4 : 0.3,
                    fontSize: 14,
                  }}
                >
                  •
                </Text>
                <View className="flex-row items-center">
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 13,
                      color: colors.foreground,
                      opacity: colors.background === '#171717' ? 0.6 : 0.5,
                    }}
                  >
                    {t('mood.level')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 13,
                      color: colors.foreground,
                      marginLeft: 6,
                      textTransform: 'capitalize',
                    }}
                  >
                    {t(`exercises.difficulty.${exercise.difficulty}`)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Action button - consistent brand blue */}
          <Pressable
            onPress={handlePress}
            className="rounded-2xl items-center py-3.5 bg-brand-dark-blue"
            style={{
              shadowColor: colors.brandDarkBlue,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              className="font-semibold"
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 15,
                color: '#FFFFFF',
              }}
            >
              {t('mood.startExercise')}{' '}
              {t(`exercises.categories.${exercise.category}`)} →
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Exercise Detail Modal */}
      {enrichedExercise && (
        <ExerciseDetail
          exercise={enrichedExercise as Exercise}
          visible={showExerciseDetail}
          onClose={handleCloseDetail}
          onStart={handleStartExercise}
        />
      )}
    </MotiView>
  );
}
