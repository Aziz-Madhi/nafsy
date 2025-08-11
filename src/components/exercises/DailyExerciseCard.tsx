import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';
import { useColors } from '~/hooks/useColors';
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
  const colors = useColors();

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
          className="overflow-hidden rounded-3xl bg-black/[0.03] dark:bg-white/[0.03]"
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
                {/* Greeting */}
                <Text
                  className="text-gray-600 mb-2"
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 14,
                  }}
                >
                  {greeting}
                </Text>

                {/* Today's Exercise title */}
                <Text
                  className="text-gray-900 mb-5"
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 26,
                    lineHeight: 32,
                  }}
                >
                  {t('exercises.dailyExercise.title')}
                </Text>

                {/* Category badge centered */}
                <View className="items-center mb-2">
                  <View
                    className="px-4 py-1.5 rounded-full"
                    style={{
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Text
                      className="text-gray-700"
                      style={{
                        fontFamily: 'Inter_500Medium',
                        fontSize: 13,
                      }}
                    >
                      {exercise.category.charAt(0).toUpperCase() +
                        exercise.category.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Duration centered */}
                <Text
                  className="text-gray-600 text-center mb-5"
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 14,
                  }}
                >
                  {exercise.duration}
                </Text>

                {/* Exercise title */}
                <Text
                  className="text-gray-900 mb-2"
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 20,
                    lineHeight: 26,
                  }}
                >
                  {exercise.title}
                </Text>

                {/* Description */}
                <Text
                  className="text-gray-600 mb-6"
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                  numberOfLines={2}
                >
                  {exercise.description}
                </Text>

                {/* Motivational message and button */}
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-gray-500 flex-1 mr-3"
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 13,
                      lineHeight: 18,
                    }}
                  >
                    {motivationalMessage}
                  </Text>

                  <Pressable
                    onPress={handlePress}
                    className="bg-gray-900 rounded-full"
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
                      className="text-white font-semibold"
                      style={{
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 14,
                      }}
                    >
                      {t('exercises.dailyExercise.startNow')}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              // Loading placeholder
              <View>
                <View
                  style={{
                    backgroundColor: '#F3F4F6',
                    width: 120,
                    height: 20,
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />

                <View
                  style={{
                    backgroundColor: '#F3F4F6',
                    width: 200,
                    height: 32,
                    borderRadius: 6,
                    marginBottom: 24,
                  }}
                />

                <View className="items-center mb-3">
                  <View
                    className="rounded-full"
                    style={{
                      backgroundColor: '#F3F4F6',
                      width: 120,
                      height: 40,
                    }}
                  />
                </View>

                <View className="items-center mb-6">
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
                    height: 28,
                    borderRadius: 6,
                    marginBottom: 12,
                  }}
                />

                <View
                  style={{
                    backgroundColor: '#F3F4F6',
                    width: '100%',
                    height: 48,
                    borderRadius: 6,
                    marginBottom: 32,
                  }}
                />

                <View className="flex-row items-center justify-between">
                  <View
                    style={{
                      backgroundColor: '#F3F4F6',
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
                      className="text-white font-semibold"
                      style={{
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 17,
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
