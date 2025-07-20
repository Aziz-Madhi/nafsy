import React from 'react';
import { View, Pressable, ImageBackground } from 'react-native';
import { Text } from '~/components/ui/text';
import { Card } from '~/components/ui/card';
import { SymbolView } from 'expo-symbols';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '~/lib/cn';
import { Brain, Wind, Activity, BookOpen, Leaf, Heart } from 'lucide-react-native';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'breathing' | 'mindfulness' | 'movement' | 'cbt' | 'journaling' | 'relaxation';
  imageUrl?: string;
  icon: string;
  color: string;
  steps?: string[];
  benefits?: string[];
}

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
  index: number;
}


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

// Helper function to render exercise icons
function getExerciseIconComponent(category: string, color: string) {
  const iconProps = { size: 24, color };
  
  switch (category) {
    case 'mindfulness':
      return <Brain {...iconProps} />;
    case 'breathing':
      return <Wind {...iconProps} />;
    case 'movement':
      return <Activity {...iconProps} />;
    case 'journaling':
      return <BookOpen {...iconProps} />;
    case 'relaxation':
      return <Leaf {...iconProps} />;
    case 'reminders':
      return <Heart {...iconProps} />;
    default:
      return <Brain {...iconProps} />;
  }
}

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
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      className="mb-4"
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
      <View className="overflow-hidden rounded-2xl bg-white/40 shadow-sm">
        <View
          className="h-32 justify-end p-4"
          style={{ backgroundColor: exercise.color + '20' }}
        >
          <View className="absolute top-4 right-4 w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: exercise.color + '40' }}
          >
            {getExerciseIconComponent(exercise.category, exercise.color)}
          </View>
          
          <Text variant="title3" className="mb-1 text-[#5A4A3A]">
            {exercise.title}
          </Text>
          <Text variant="body" className="text-sm text-[#5A4A3A]/70" numberOfLines={1}>
            {exercise.description}
          </Text>
        </View>

        <View className="p-4 bg-white/20">
          <View className="flex-row items-center justify-between">
            {/* Duration */}
            <View className="flex-row items-center">
              <SymbolView name="clock" size={16} tintColor="#5A4A3A" />
              <Text variant="body" className="text-sm text-[#5A4A3A] ml-1">
                {exercise.duration}
              </Text>
            </View>

            {/* Difficulty */}
            <View className="flex-row items-center">
              <SymbolView name="chart.bar" size={16} tintColor="#5A4A3A" />
              <Text
                variant="body"
                className="text-sm font-medium ml-1"
                style={{ color: DIFFICULTY_COLORS[exercise.difficulty] }}
              >
                {DIFFICULTY_LABELS[exercise.difficulty]}
              </Text>
            </View>
          </View>
        </View>
      </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}