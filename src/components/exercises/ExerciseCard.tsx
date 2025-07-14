import React from 'react';
import { View, Pressable, ImageBackground } from 'react-native';
import { Text } from '~/components/ui/text';
import { Card } from '~/components/ui/card';
import { Clock, Heart, BarChart3 } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '~/lib/utils';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'breathing' | 'mindfulness' | 'movement' | 'cbt';
  imageUrl?: string;
  icon: string;
  color: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DIFFICULTY_COLORS = {
  beginner: '#22C55E',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
};

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function ExerciseCard({ exercise, onPress, index }: ExerciseCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(exercise);
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 100).springify()}
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      className="mb-4"
    >
      <Card className="overflow-hidden">
        <View
          className="h-32 justify-end p-4"
          style={{ backgroundColor: exercise.color + '20' }}
        >
          <View className="absolute top-4 right-4 w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: exercise.color + '40' }}
          >
            <Text className="text-2xl">{exercise.icon}</Text>
          </View>
          
          <Text variant="title3" className="mb-1">
            {exercise.title}
          </Text>
          <Text variant="muted" className="text-sm" numberOfLines={1}>
            {exercise.description}
          </Text>
        </View>

        <View className="p-4">
          <View className="flex-row items-center justify-between">
            {/* Duration */}
            <View className="flex-row items-center">
              <Clock size={16} className="text-muted-foreground mr-1" />
              <Text variant="muted" className="text-sm">
                {exercise.duration}
              </Text>
            </View>

            {/* Difficulty */}
            <View className="flex-row items-center">
              <BarChart3 size={16} className="text-muted-foreground mr-1" />
              <Text
                variant="muted"
                className="text-sm font-medium"
                style={{ color: DIFFICULTY_COLORS[exercise.difficulty] }}
              >
                {DIFFICULTY_LABELS[exercise.difficulty]}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </AnimatedPressable>
  );
}