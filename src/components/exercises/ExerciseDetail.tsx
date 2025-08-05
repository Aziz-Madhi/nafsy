import React from 'react';
import { View, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { SymbolView } from 'expo-symbols';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import type { Exercise, ExerciseDetailProps } from '~/types';

const DIFFICULTY_COLORS = {
  beginner: '#22C55E',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
};

export function ExerciseDetail({
  exercise,
  visible,
  onClose,
  onStart,
}: ExerciseDetailProps) {
  if (!exercise) return null;

  const handleStart = () => {
    notificationAsync(NotificationFeedbackType.Success);
    onStart(exercise);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-[#F4F1ED]">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-1" />
              <Pressable
                onPress={onClose}
                className="w-10 h-10 bg-white/30 rounded-full items-center justify-center"
              >
                <SymbolView name="xmark" size={24} tintColor="#5A4A3A" />
              </Pressable>
            </View>

            {/* Icon and Title */}
            <View className="items-center mb-6">
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: exercise.color + '20' }}
              >
                <Text className="text-5xl">{exercise.icon}</Text>
              </View>
              <Text
                className="text-center mb-2"
                style={{
                  fontFamily: 'CrimsonPro-Bold',
                  fontSize: 28,
                  fontWeight: 'normal',
                }}
              >
                {exercise.title}
              </Text>
              <Text variant="muted" className="text-center">
                {exercise.description}
              </Text>
            </View>

            {/* Meta Info */}
            <View className="flex-row justify-center mb-8">
              <View className="flex-row items-center mr-6">
                <SymbolView name="clock" size={20} tintColor="#5A4A3A" />
                <Text variant="body" className="text-[#5A4A3A] ml-1">
                  {exercise.duration}
                </Text>
              </View>
              <View className="flex-row items-center">
                <SymbolView name="chart.bar" size={20} tintColor="#5A4A3A" />
                <Text
                  variant="body"
                  className="ml-1"
                  style={{ color: DIFFICULTY_COLORS[exercise.difficulty] }}
                >
                  {exercise.difficulty.charAt(0).toUpperCase() +
                    exercise.difficulty.slice(1)}
                </Text>
              </View>
            </View>

            {/* Benefits */}
            {exercise.benefits && Array.isArray(exercise.benefits) && (
              <View className="bg-white/20 rounded-2xl p-6 mb-6">
                <Text variant="title3" className="mb-4 text-[#5A4A3A]">
                  Benefits
                </Text>
                {exercise.benefits.map((benefit, index) => (
                  <View key={index} className="flex-row items-start mb-3">
                    <SymbolView
                      name="checkmark.circle"
                      size={20}
                      tintColor="#6F9460"
                    />
                    <Text variant="body" className="flex-1 text-[#5A4A3A] ml-2">
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Steps */}
            {exercise.steps && Array.isArray(exercise.steps) && (
              <View className="mb-6">
                <Text variant="title3" className="mb-4 text-[#5A4A3A]">
                  How to Practice
                </Text>
                {exercise.steps.map((step, index) => (
                  <View key={index} className="flex-row items-start mb-4">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: exercise.color + '20' }}
                    >
                      <Text
                        variant="body"
                        className="font-medium text-[#5A4A3A]"
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text variant="body" className="flex-1 text-[#5A4A3A]">
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Start Button */}
        <View className="px-6 pb-6 pt-4 border-t border-[#5A4A3A]/20">
          <Button onPress={handleStart} size="lg" className="w-full">
            <Text
              variant="body"
              className="text-primary-foreground font-medium"
            >
              Start Exercise
            </Text>
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Export as default for lazy loading
export default ExerciseDetail;
