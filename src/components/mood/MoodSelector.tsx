import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '~/lib/utils';

interface Mood {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

const MOODS: Mood[] = [
  { id: 'very-sad', emoji: '😢', label: 'Very Sad', color: '#94A3B8' },
  { id: 'sad', emoji: '😔', label: 'Sad', color: '#64748B' },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: '#7ED321' },
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#4ADE80' },
  { id: 'very-happy', emoji: '😄', label: 'Very Happy', color: '#22C55E' },
];

interface MoodSelectorProps {
  selectedMood?: string;
  onMoodSelect: (mood: Mood) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <View className="bg-card rounded-2xl p-6 shadow-sm">
      <Text variant="title3" className="mb-6 text-center">
        How are you feeling today?
      </Text>
      
      <View className="flex-row justify-between">
        {MOODS.map((mood, index) => (
          <MoodButton
            key={mood.id}
            mood={mood}
            isSelected={selectedMood === mood.id}
            onPress={() => onMoodSelect(mood)}
            delay={index * 50}
          />
        ))}
      </View>
    </View>
  );
}

interface MoodButtonProps {
  mood: Mood;
  isSelected: boolean;
  onPress: () => void;
  delay: number;
}

function MoodButton({ mood, isSelected, onPress, delay }: MoodButtonProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.8, {}, () => {
      scale.value = withSpring(1.2, {}, () => {
        scale.value = withSpring(1);
      });
    });
    rotation.value = withSpring(10, {}, () => {
      rotation.value = withSpring(-10, {}, () => {
        rotation.value = withSpring(0);
      });
    });
    onPress();
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(delay).springify()}
      style={animatedStyle}
      onPress={handlePress}
      className="items-center"
    >
      <View
        className={cn(
          'w-16 h-16 rounded-full items-center justify-center mb-2',
          isSelected && 'ring-2 ring-offset-2 ring-primary'
        )}
        style={{ backgroundColor: isSelected ? mood.color + '20' : 'transparent' }}
      >
        <Text className="text-3xl">{mood.emoji}</Text>
      </View>
      <Text
        variant="muted"
        className={cn(
          'text-xs',
          isSelected && 'text-foreground font-medium'
        )}
      >
        {mood.label}
      </Text>
    </AnimatedPressable>
  );
}