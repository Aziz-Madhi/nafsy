import React from 'react';
import { View, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { SymbolView } from 'expo-symbols';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import type { ExerciseDetailProps } from '~/types';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';

const DIFFICULTY_COLORS = {
  beginner: '#22C55E',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
};

export default function ExerciseDetail({
  exercise,
  visible,
  onClose,
  onStart,
}: ExerciseDetailProps) {
  const colors = useColors();
  const { t, currentLanguage } = useTranslation();
  if (!exercise) return null;
  const isDarkMode = colors.background === '#171717';

  const handleStart = () => {
    notificationAsync(NotificationFeedbackType.Success);
    if (onStart) onStart(exercise);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-1" />
              <Pressable
                onPress={onClose}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isDarkMode
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(255,255,255,0.3)',
                }}
              >
                <SymbolView
                  name="xmark"
                  size={24}
                  tintColor={isDarkMode ? colors.foreground : '#5A4A3A'}
                />
              </Pressable>
            </View>

            {/* Icon and Title */}
            <View className="items-center mb-6">
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-4"
                style={{
                  backgroundColor: isDarkMode
                    ? 'rgba(255,255,255,0.08)'
                    : exercise.color
                      ? exercise.color + '20'
                      : 'rgba(0,0,0,0.05)',
                }}
              >
                <Text className="text-5xl">{exercise.icon}</Text>
              </View>
              <Text
                className="text-center mb-2"
                style={{
                  fontFamily: 'CrimsonPro-Bold',
                  fontSize: 28,
                  fontWeight: 'normal',
                  lineHeight: 36,
                  color: isDarkMode ? colors.foreground : undefined,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {currentLanguage === 'ar' && exercise.titleAr
                  ? exercise.titleAr
                  : exercise.title}
              </Text>
              <Text
                variant="muted"
                className="text-center"
                style={{
                  color: isDarkMode ? 'rgba(255,255,255,0.75)' : undefined,
                  lineHeight: 22,
                  paddingHorizontal: 8,
                }}
              >
                {currentLanguage === 'ar' && exercise.descriptionAr
                  ? exercise.descriptionAr
                  : exercise.description}
              </Text>
            </View>

            {/* Meta Info */}
            <View className="flex-row justify-center mb-8">
              <View className="flex-row items-center me-6">
                <SymbolView
                  name="clock"
                  size={20}
                  tintColor={isDarkMode ? colors.foreground : '#5A4A3A'}
                />
                <Text
                  variant="body"
                  className="ms-1"
                  style={{
                    color: isDarkMode ? colors.foreground : '#5A4A3A',
                  }}
                >
                  {exercise.duration}
                </Text>
              </View>
              <View className="flex-row items-center">
                <SymbolView
                  name="chart.bar"
                  size={20}
                  tintColor={isDarkMode ? colors.foreground : '#5A4A3A'}
                />
                <Text
                  variant="body"
                  className="ms-1"
                  style={{ color: DIFFICULTY_COLORS[exercise.difficulty] }}
                >
                  {t(`exercises.difficulty.${exercise.difficulty}`)}
                </Text>
              </View>
            </View>

            {/* Subtle accent bar */}
            <View
              style={{
                height: 2,
                backgroundColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : exercise.color
                    ? exercise.color + '60'
                    : 'rgba(0,0,0,0.1)',
                borderRadius: 1,
                marginBottom: 16,
              }}
            />

            {/* Steps */}
            {exercise.steps && Array.isArray(exercise.steps) && (
              <View>
                <Text
                  variant="title3"
                  className="mb-4"
                  style={{ color: isDarkMode ? colors.foreground : '#5A4A3A' }}
                >
                  {t('exercises.instructions')}
                </Text>
                {(currentLanguage === 'ar' && exercise.stepsAr
                  ? exercise.stepsAr
                  : exercise.steps
                ).map((step, index) => (
                  <View key={index} className="flex-row items-start mb-4">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center me-3"
                      style={{
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.08)'
                          : exercise.color
                            ? exercise.color + '20'
                            : 'rgba(0,0,0,0.05)',
                      }}
                    >
                      <Text
                        variant="body"
                        className="font-medium"
                        style={{
                          color: isDarkMode ? colors.foreground : '#5A4A3A',
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      variant="body"
                      className="flex-1"
                      style={{
                        color: isDarkMode ? colors.foreground : '#5A4A3A',
                        lineHeight: 20,
                      }}
                    >
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Start Button */}
        <View className="px-6 pb-6 pt-4 border-t border-border/10">
          <Button
            onPress={handleStart}
            size="lg"
            className="w-full bg-brand-dark-blue"
          >
            <Text
              variant="body"
              className="text-primary-foreground font-medium"
            >
              {t('exercises.startExercise')}
            </Text>
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
