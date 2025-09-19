import React, { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { MotiView } from 'moti';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useColors, useShadowStyle } from '~/hooks/useColors';
import type { Exercise } from '~/types';
import { useTranslation } from '~/hooks/useTranslation';
import { useAudioPlayer } from '~/providers/AudioPlayerProvider';
import { useConvex } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface MoodBasedExerciseSuggestionProps {
  mood: 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry';
  exercise: Exercise | null;
  isLoading?: boolean;
}

export function MoodBasedExerciseSuggestion({
  exercise,
  isLoading = false,
}: MoodBasedExerciseSuggestionProps) {
  const { t, currentLanguage } = useTranslation();
  const colors = useColors();
  const shadowMedium = useShadowStyle('medium');
  const { open: openAudio } = useAudioPlayer();
  const convex = useConvex();

  // Get category colors - unified across themes using solid wellness BG tokens
  const getCategoryColors = useMemo(() => {
    if (!exercise)
      return {
        base: colors.primary,
        background: colors.wellnessMindfulnessBg, // default pastel
        text: colors.foreground,
      };

    // Solid pastel backgrounds that do not blend with theme background
    const bgByCategory: Record<string, string> = {
      mindfulness: colors.wellnessMindfulnessBg,
      breathing: colors.wellnessBreathingBg,
      movement: colors.wellnessMovementBg,
      journaling: colors.wellnessJournalingBg,
      relaxation: colors.wellnessRelaxationBg,
      reminders: colors.wellnessRemindersBg,
    };

    const backgroundColor =
      bgByCategory[exercise.category] || colors.wellnessMindfulnessBg;

    // Use a fixed dark text on warm pastel backgrounds for both themes
    const textColor = '#1F2937';

    return {
      base: backgroundColor,
      background: backgroundColor,
      text: textColor,
    };
  }, [exercise, colors]);

  const handlePress = () => {
    if (!exercise) return;
    impactAsync(ImpactFeedbackStyle.Medium);
    // Launch audio player immediately instead of opening detail modal
    handleStartExercise(exercise);
  };

  const handleStartExercise = async (selectedExercise: Exercise) => {
    // Launch audio mini-player, resolving the signed audio URL when available
    try {
      const minutes = parseInt(selectedExercise.duration as any);
      const exerciseId =
        (selectedExercise as any).id ??
        (selectedExercise as any)._id ??
        selectedExercise.id;

      let signedUrl: string | null = null;
      if (
        (selectedExercise as any).audioKey ||
        (selectedExercise as any).audioKeyAr
      ) {
        try {
          signedUrl = await convex.query(api.r2.getExerciseAudioUrl, {
            exerciseId: exerciseId as any,
            lang: (currentLanguage || '').startsWith('ar') ? 'ar' : 'en',
            expiresIn: 60 * 60 * 6,
          });
        } catch {}
      }

      await openAudio({
        id: String(exerciseId),
        title:
          (currentLanguage || '').startsWith('ar') &&
          (selectedExercise as any).titleAr
            ? ((selectedExercise as any).titleAr as string)
            : ((selectedExercise as any).title ?? ''),
        subtitle: t(
          `exercises.categories.${(selectedExercise as any).category}`
        ),
        icon: (selectedExercise as any).icon,
        color: (selectedExercise as any).color,
        durationSeconds: Number.isFinite(minutes) ? minutes * 60 : undefined,
        sourceUri: signedUrl ?? undefined,
      });
    } catch {}
  };

  if (isLoading || !exercise) {
    // Loading skeleton
    return (
      <View className="mb-4" style={{ marginHorizontal: 6 }}>
        <View
          className="rounded-3xl p-6 bg-black/[0.03] dark:bg-white/[0.03]"
          style={{
            ...shadowMedium,
          }}
        >
          <MotiView
            from={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ loop: true, duration: 900, type: 'timing' }}
          >
            <View className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <View className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
            <View className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <View className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <View className="h-12 w-32 bg-gray-300 dark:bg-gray-600 rounded-2xl" />
          </MotiView>
        </View>
      </View>
    );
  }

  const isArabic = (currentLanguage || '').startsWith('ar');

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95, translateY: 10 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: 100,
      }}
      className="mb-4"
      style={{ marginHorizontal: 6 }}
    >
      <View className="rounded-3xl overflow-hidden">
        {/* Top section - warmer category colors with theme consistency */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            backgroundColor: getCategoryColors.background,
          }}
        >
          <Text
            variant="caption2"
            className="mb-2 uppercase"
            style={{
              color: getCategoryColors.text,
              letterSpacing: 0.5,
              opacity: 0.7,
            }}
          >
            {t('mood.exerciseSuggestion.recommendedForYou')}
          </Text>

          {/* Category display - mirror layout for RTL */}
          <View
            className="items-center mb-3"
            style={{ flexDirection: isArabic ? 'row-reverse' : 'row' }}
          >
            <View
              style={{
                height: 1,
                width: 24,
                backgroundColor: getCategoryColors.text,
                opacity: 0.3,
                marginHorizontal: 10,
              }}
            />
            <Text
              variant="caption1"
              className="uppercase font-bold"
              style={{
                color: getCategoryColors.text,
                letterSpacing: 1.5,
                textAlign: isArabic ? 'right' : 'left',
                writingDirection: isArabic ? 'rtl' : 'ltr',
              }}
            >
              {t(`exercises.categories.${exercise.category}`)}
            </Text>
            <View
              style={{
                height: 1,
                width: 24,
                backgroundColor: getCategoryColors.text,
                opacity: 0.3,
                marginHorizontal: 10,
              }}
            />
          </View>

          <Text
            variant="title2"
            className="mb-2 font-bold"
            style={{
              color: getCategoryColors.text,
            }}
          >
            {currentLanguage === 'ar' && exercise.titleAr
              ? exercise.titleAr
              : exercise.title}
          </Text>

          <Text
            variant="footnote"
            style={{
              color: getCategoryColors.text,
              opacity: 0.8,
              paddingBottom: 2,
            }}
            numberOfLines={2}
          >
            {currentLanguage === 'ar' && exercise.descriptionAr
              ? exercise.descriptionAr
              : exercise.description}
          </Text>
        </View>

        {/* Bottom section with proper dark mode background */}
        <View className="p-5 bg-black/[0.03] dark:bg-white/[0.03]">
          {/* Exercise info - minimal text-based design */}
          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center">
              <Text
                variant="caption1"
                style={{
                  color: colors.foreground,
                  opacity: colors.background === '#0A1514' ? 0.6 : 0.5,
                }}
              >
                {t('exercises.duration')}
              </Text>
              <Text
                variant="caption1"
                className="font-semibold"
                style={{
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
                    opacity: colors.background === '#0A1514' ? 0.4 : 0.3,
                    fontSize: 14,
                  }}
                >
                  •
                </Text>
                <View className="flex-row items-center">
                  <Text
                    variant="caption1"
                    style={{
                      color: colors.foreground,
                      opacity: colors.background === '#0A1514' ? 0.6 : 0.5,
                    }}
                  >
                    {t('mood.level')}
                  </Text>
                  <Text
                    variant="caption1"
                    className="font-semibold capitalize"
                    style={{
                      color: colors.foreground,
                      marginLeft: 6,
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
              variant="subhead"
              className="font-semibold"
              style={{
                color: '#FFFFFF',
              }}
            >
              {t('mood.startExercise')}{' '}
              {t(`exercises.categories.${exercise.category}`)} →
            </Text>
          </Pressable>
        </View>
      </View>

      {/* No detail modal; pressing the button launches the audio player directly */}
    </MotiView>
  );
}
