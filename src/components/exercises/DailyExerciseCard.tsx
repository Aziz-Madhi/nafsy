import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';
import { colors, spacing } from '~/lib/design-tokens';
import { RTLView } from '~/components/ui/RTLView';
import type { Exercise } from '~/types';

interface DailyExerciseCardProps {
  exercise: Exercise | null;
  onPress: () => void;
  greeting: string;
  motivationalMessage: string;
}

export function DailyExerciseCard({
  exercise,
  onPress,
  greeting,
  motivationalMessage,
}: DailyExerciseCardProps) {
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    if (exercise) {
      impactAsync(ImpactFeedbackStyle.Medium);
      onPress();
    }
  }, [exercise, onPress]);

  // Using background color matching mood history calendar container
  const backgroundColor = 'rgba(90, 74, 58, 0.12)';

  return (
    <View
      style={{
        marginHorizontal: 6,
        // Balanced spacing: 16px top gap (from stats section outer margin) & 16px below this card
        marginTop: 0,
        marginBottom: spacing.md, // 16px
      }}
    >
      <Pressable onPress={handlePress} disabled={!exercise}>
        <View
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="p-6">
            <View>
              <Text
                className="mb-1"
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: colors.neutral[700],
                }}
              >
                {greeting}
              </Text>

              <Text
                className="mb-4"
                style={{
                  fontFamily: 'CrimsonPro-Bold',
                  fontSize: 28,
                  lineHeight: 34,
                  color: colors.neutral[900],
                }}
              >
                {t('exercises.dailyExercise.title')}
              </Text>
            </View>

            {exercise ? (
              <>
                <View className="mb-4">
                  <RTLView className="items-center mb-2">
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inter_600SemiBold',
                          fontSize: 12,
                          color: colors.neutral[800],
                        }}
                      >
                        {exercise.category.charAt(0).toUpperCase() +
                          exercise.category.slice(1)}
                      </Text>
                    </View>

                    <View
                      className="mx-2 w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: colors.neutral[400],
                      }}
                    />

                    <Text
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontSize: 14,
                        color: colors.neutral[700],
                      }}
                    >
                      {exercise.duration}
                    </Text>
                  </RTLView>

                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 18,
                      lineHeight: 24,
                      color: colors.neutral[900],
                    }}
                  >
                    {exercise.title}
                  </Text>

                  <Text
                    className="mt-1"
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors.neutral[700],
                    }}
                    numberOfLines={2}
                  >
                    {exercise.description}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text
                    className="flex-1 mr-4"
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 13,
                      fontStyle: 'italic',
                      color: colors.neutral[600],
                    }}
                  >
                    {motivationalMessage}
                  </Text>

                  <View
                    className="px-5 py-3 rounded-full"
                    style={{
                      backgroundColor: colors.neutral[900],
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 15,
                        color: '#FFFFFF',
                      }}
                    >
                      {t('exercises.dailyExercise.startNow')}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              // Loading placeholder
              <View className="space-y-3">
                <View className="flex-row items-center mb-2">
                  <View
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: '#F3F4F6',
                      width: 100,
                      height: 28,
                    }}
                  />
                  <View
                    className="mx-2 w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: colors.neutral[400],
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: '#F3F4F6',
                      width: 60,
                      height: 20,
                      borderRadius: 4,
                    }}
                  />
                </View>

                <View
                  style={{
                    backgroundColor: '#F3F4F6',
                    width: '80%',
                    height: 24,
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />

                <View
                  style={{
                    backgroundColor: '#F3F4F6',
                    width: '100%',
                    height: 40,
                    borderRadius: 4,
                    marginBottom: 16,
                  }}
                />

                <View className="flex-row justify-between items-center">
                  <View
                    style={{
                      backgroundColor: '#F3F4F6',
                      width: '50%',
                      height: 16,
                      borderRadius: 4,
                    }}
                  />

                  <View
                    className="px-5 py-3 rounded-full"
                    style={{
                      backgroundColor: colors.neutral[900],
                      opacity: 0.5,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 15,
                        color: '#FFFFFF',
                      }}
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
