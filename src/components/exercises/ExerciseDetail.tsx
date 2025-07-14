import React from 'react';
import { View, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { X, Clock, BarChart3, CheckCircle } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  icon: string;
  color: string;
  steps?: string[];
  benefits?: string[];
}

interface ExerciseDetailProps {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
  onStart: (exercise: Exercise) => void;
}

const DIFFICULTY_COLORS = {
  beginner: '#22C55E',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
};

export function ExerciseDetail({ exercise, visible, onClose, onStart }: ExerciseDetailProps) {
  if (!exercise) return null;

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStart(exercise);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-1" />
              <Pressable
                onPress={onClose}
                className="w-10 h-10 bg-secondary/20 rounded-full items-center justify-center"
              >
                <X size={24} className="text-muted-foreground" />
              </Pressable>
            </View>

            {/* Icon and Title */}
            <Animated.View
              entering={SlideInDown.delay(100).springify()}
              className="items-center mb-6"
            >
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: exercise.color + '20' }}
              >
                <Text className="text-5xl">{exercise.icon}</Text>
              </View>
              <Text variant="title1" className="text-center mb-2">
                {exercise.title}
              </Text>
              <Text variant="muted" className="text-center">
                {exercise.description}
              </Text>
            </Animated.View>

            {/* Meta Info */}
            <Animated.View
              entering={SlideInDown.delay(200).springify()}
              className="flex-row justify-center mb-8"
            >
              <View className="flex-row items-center mr-6">
                <Clock size={20} className="text-muted-foreground mr-2" />
                <Text variant="body">{exercise.duration}</Text>
              </View>
              <View className="flex-row items-center">
                <BarChart3 size={20} className="text-muted-foreground mr-2" />
                <Text
                  variant="body"
                  style={{ color: DIFFICULTY_COLORS[exercise.difficulty] }}
                >
                  {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                </Text>
              </View>
            </Animated.View>

            {/* Benefits */}
            {exercise.benefits && (
              <Animated.View
                entering={SlideInDown.delay(300).springify()}
                className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 mb-6"
              >
                <Text variant="title3" className="mb-4">
                  Benefits
                </Text>
                {exercise.benefits.map((benefit, index) => (
                  <View key={index} className="flex-row items-start mb-3">
                    <CheckCircle size={20} className="text-primary mr-3 mt-0.5" />
                    <Text variant="body" className="flex-1">
                      {benefit}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Steps */}
            {exercise.steps && (
              <Animated.View
                entering={SlideInDown.delay(400).springify()}
                className="mb-6"
              >
                <Text variant="title3" className="mb-4">
                  How to Practice
                </Text>
                {exercise.steps.map((step, index) => (
                  <View key={index} className="flex-row items-start mb-4">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: exercise.color + '20' }}
                    >
                      <Text variant="body" className="font-medium">
                        {index + 1}
                      </Text>
                    </View>
                    <Text variant="body" className="flex-1">
                      {step}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Start Button */}
        <View className="px-6 pb-6 pt-4 border-t border-border/20">
          <Button onPress={handleStart} size="lg" className="w-full">
            <Text variant="body" className="text-primary-foreground font-medium">
              Start Exercise
            </Text>
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}