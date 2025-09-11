import React, { useCallback, memo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import type { Exercise } from '~/types';
import { useTranslation } from '~/hooks/useTranslation';

interface DailyExerciseCardProps {
  exercise: Exercise | null;
  onPress: () => void;
  greeting: string;
  motivationalMessage: string;
}

function DailyExerciseCardComponent({
  exercise,
  onPress,
  greeting,
  motivationalMessage,
}: DailyExerciseCardProps) {
  const { t, currentLanguage } = useTranslation();
  const isArabic = (currentLanguage || '').startsWith('ar');

  const handlePress = useCallback(() => {
    if (exercise) {
      impactAsync(ImpactFeedbackStyle.Medium);
      onPress();
    }
  }, [exercise, onPress]);

  return (
    <View
      style={{
        marginHorizontal: 6,
        // Balanced spacing: 16px top gap (from stats section outer margin) & 16px below this card
        marginTop: 0,
        marginBottom: 16, // 16px
      }}
    >
      <Pressable onPress={handlePress} disabled={!exercise}>
        <View
          className="rounded-3xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="p-6">
            {exercise ? (
              <>
                {/* Greeting removed; greeting is now shown inside the chip */}

                {isArabic ? (
                  <>
                    {/* Transparent outlined chip: greeting + Today's Exercise */}
                    <View className="items-end mb-2">
                      <View className="px-4 py-1.5 rounded-full bg-transparent border border-foreground/20">
                        <Text
                          variant="footnote"
                          className="text-foreground/70 font-medium"
                        >
                          {`${greeting} • ${t('exercises.dailyExercise.title')}`}
                        </Text>
                      </View>
                    </View>

                    {/* Prominent exercise title centered */}
                    <Text
                      variant="heading"
                      className="text-foreground mb-3 text-center"
                      autoAlign={false}
                    >
                      {exercise.titleAr ? exercise.titleAr : exercise.title}
                    </Text>

                    {/* Subtitle directly under title */}
                    <Text
                      variant="footnote"
                      className="text-muted-foreground mb-6 text-center"
                      autoAlign={false}
                      numberOfLines={2}
                    >
                      {exercise.descriptionAr ? exercise.descriptionAr : exercise.description}
                    </Text>
                  </>
                ) : (
                  <>
                    {/* Transparent outlined chip: greeting + Today's Exercise */}
                    <View className="items-start mb-2">
                      <View className="px-4 py-1.5 rounded-full bg-transparent border border-foreground/20">
                        <Text
                          variant="footnote"
                          className="text-foreground/70 font-medium"
                        >
                          {`${greeting} • ${t('exercises.dailyExercise.title')}`}
                        </Text>
                      </View>
                    </View>

                    {/* Prominent exercise title centered */}
                    <Text
                      variant="heading"
                      className="text-foreground mb-3 text-center"
                      autoAlign={false}
                    >
                      {exercise.title}
                    </Text>

                    {/* Subtitle directly under title */}
                    <Text
                      variant="footnote"
                      className="text-muted-foreground mb-6 text-center"
                      autoAlign={false}
                      numberOfLines={2}
                    >
                      {exercise.description}
                    </Text>
                  </>
                )}

                {/* Action row: Start button on left, meta (duration + category) on right */}
                <View
                  className={`flex-row items-center justify-between ${
                    isArabic ? '' : ''
                  }`}
                >
                  <Pressable
                    onPress={handlePress}
                    className="bg-brand-dark-blue rounded-full"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.2,
                      shadowRadius: 6,
                      elevation: 4,
                      paddingHorizontal: 26,
                      paddingVertical: 11,
                    }}
                  >
                    <Text
                      variant="footnote"
                      className="text-white font-semibold"
                    >
                      {t('exercises.dailyExercise.startNow')}
                    </Text>
                  </Pressable>

                  {isArabic ? (
                    <View className="flex-row items-center">
                      <Text
                        variant="footnote"
                        className="text-muted-foreground ms-5 text-right"
                      >
                        {exercise?.duration}
                      </Text>
                      <View className="px-4 py-1.5 rounded-full bg-white dark:bg-white/10 dark:border dark:border-white/20">
                        <Text
                          variant="footnote"
                          className="text-foreground font-medium"
                        >
                          {exercise
                            ? t(`exercises.categories.${exercise.category}`)
                            : ''}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Text
                        variant="footnote"
                        className="text-muted-foreground me-5"
                      >
                        {exercise?.duration}
                      </Text>
                      <View className="px-4 py-1.5 rounded-full bg-white dark:bg-white/10 dark:border dark:border-white/20">
                        <Text
                          variant="footnote"
                          className="text-foreground font-medium"
                        >
                          {exercise
                            ? t(`exercises.categories.${exercise.category}`)
                            : ''}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            ) : (
              // Loading placeholder
              <View>
                <View
                  className="bg-gray-100"
                  style={{
                    width: 120,
                    height: 20,
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />

                <View
                  className="bg-gray-100"
                  style={{
                    width: 200,
                    height: 32,
                    borderRadius: 6,
                    marginBottom: 24,
                  }}
                />

                <View className="items-center mb-3">
                  <View
                    className="rounded-full bg-gray-100"
                    style={{ width: 120, height: 40 }}
                  />
                </View>

                <View className="items-center mb-6">
                  <View
                    className="bg-gray-100"
                    style={{ width: 60, height: 20, borderRadius: 4 }}
                  />
                </View>

                <View
                  className="bg-gray-100"
                  style={{
                    width: '80%',
                    height: 28,
                    borderRadius: 6,
                    marginBottom: 12,
                  }}
                />

                <View
                  className="bg-gray-100"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 6,
                    marginBottom: 32,
                  }}
                />

                <View className="flex-row items-center justify-between">
                  <View
                    className="bg-gray-100"
                    style={{
                      flex: 1,
                      height: 20,
                      borderRadius: 4,
                      marginRight: 16,
                    }}
                  />

                  <View
                    className="rounded-full bg-gray-300"
                    style={{
                      paddingHorizontal: 32,
                      paddingVertical: 14,
                    }}
                  >
                    <Text
                      variant="callout"
                      className="text-white font-semibold"
                    >
                      {t('exercises.dailyExercise.startNow')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export const DailyExerciseCard = memo(DailyExerciseCardComponent);
