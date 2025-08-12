import React, { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { MotiView } from 'moti';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useColors, useShadowStyle } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { useTranslation } from '~/hooks/useTranslation';
import {
  getCategoryIcon,
  getCategoryColor,
  getMoodBasedEncouragement,
} from '~/lib/mood-exercise-mapping';
import { IconRenderer } from '~/components/ui/IconRenderer';
import { router } from 'expo-router';
import type { Exercise } from '~/types';

interface MoodBasedExerciseSuggestionProps {
  mood: 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry';
  exercise: Exercise | null;
  isLoading?: boolean;
}

export function MoodBasedExerciseSuggestion({
  mood,
  exercise,
  isLoading = false,
}: MoodBasedExerciseSuggestionProps) {
  const { t, locale } = useTranslation();
  const colors = useColors();
  const shadowMedium = useShadowStyle('medium');
  const isDarkMode = colors.background === '#171717';

  // Get category color if exercise exists
  const categoryColor = useMemo(() => {
    if (!exercise) return colors.primary;
    const colorKey = getCategoryColor(exercise.category as any);
    return colors[colorKey as keyof typeof colors] || colors.primary;
  }, [exercise, colors]);

  const handlePress = () => {
    if (exercise) {
      impactAsync(ImpactFeedbackStyle.Medium);
      // Navigate to exercise category with the exercise selected
      router.push({
        pathname: '/tabs/exercises/category/[id]',
        params: {
          id: exercise.category,
          exerciseId: exercise._id,
        },
      });
    }
  };

  const encouragement = getMoodBasedEncouragement(mood, locale as 'en' | 'ar');

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
        className="rounded-3xl p-6 bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden"
        style={{
          ...shadowMedium,
        }}
      >
        {/* Header */}
        <Text
          className="text-muted-foreground mb-3"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {t('mood.exerciseSuggestion.recommendedForYou')}
        </Text>

        {/* Encouragement text */}
        <Text
          className="mb-4"
          style={{
            fontFamily: 'CrimsonPro-Italic-VariableFont',
            fontSize: 15,
            lineHeight: 20,
            color: isDarkMode
              ? 'rgba(255, 255, 255, 0.75)'
              : withOpacity(colors.foreground, 0.7),
          }}
        >
          {encouragement}
        </Text>

        {/* Exercise content */}
        <View className="flex-row items-start mb-4">
          {/* Icon */}
          <View
            className="rounded-2xl p-3 mr-4"
            style={{
              backgroundColor: withOpacity(categoryColor, 0.15),
            }}
          >
            <IconRenderer
              type="category"
              name={getCategoryIcon(exercise.category as any)}
              size={24}
              color={categoryColor}
            />
          </View>

          {/* Title and description */}
          <View className="flex-1">
            {/* Category badge and duration */}
            <View className="flex-row items-center mb-2">
              <View
                className="px-3 py-1 rounded-full mr-2"
                style={{
                  backgroundColor: isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 11,
                    color: colors.foreground,
                    textTransform: 'capitalize',
                  }}
                >
                  {exercise.category}
                </Text>
              </View>
              <Text
                className="text-muted-foreground"
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                }}
              >
                {exercise.duration} {t('common.minutes')}
              </Text>
            </View>

            {/* Exercise title */}
            <Text
              className="mb-2"
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 18,
                lineHeight: 24,
                color: colors.foreground,
              }}
              numberOfLines={2}
            >
              {locale === 'ar' && exercise.titleAr
                ? exercise.titleAr
                : exercise.title}
            </Text>

            {/* Description */}
            <Text
              className="text-muted-foreground"
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                lineHeight: 19,
              }}
              numberOfLines={2}
            >
              {locale === 'ar' && exercise.descriptionAr
                ? exercise.descriptionAr
                : exercise.description}
            </Text>
          </View>
        </View>

        {/* Action button */}
        <Pressable
          onPress={handlePress}
          className="rounded-2xl items-center py-3 bg-brand-dark-blue"
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
            {t('mood.exerciseSuggestion.tryExercise')} →
          </Text>
        </Pressable>
      </View>
    </MotiView>
  );
}
