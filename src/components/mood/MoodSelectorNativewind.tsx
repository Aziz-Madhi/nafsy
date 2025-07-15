import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { safeHaptics } from '~/lib/haptics';

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

interface MoodSelectorNativewindProps {
  selectedMood?: string;
  onMoodSelect: (mood: Mood) => void;
}

export function MoodSelectorNativewind({ selectedMood, onMoodSelect }: MoodSelectorNativewindProps) {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <Text variant="title3" className="mb-6 text-center">
        How are you feeling today?
      </Text>
      
      <View className="flex-row justify-between">
        {MOODS.map((mood) => (
          <MoodButton
            key={mood.id}
            mood={mood}
            isSelected={selectedMood === mood.id}
            onPress={() => onMoodSelect(mood)}
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
}

function MoodButton({ mood, isSelected, onPress }: MoodButtonProps) {
  const handlePress = () => {
    onPress();
    safeHaptics.impact();
  };

  // Use separate components for selected/unselected states
  if (isSelected) {
    return (
      <Pressable onPress={handlePress} className="items-center">
        <View 
          className="w-16 h-16 rounded-full items-center justify-center mb-2 ring-2 ring-offset-2 ring-primary"
          style={{ backgroundColor: mood.color + '20' }}
        >
          <Text className="text-2xl">{mood.emoji || '😐'}</Text>
        </View>
        <Text variant="muted" className="text-xs text-foreground font-medium">
          {mood.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} className="items-center">
      <View className="w-16 h-16 rounded-full items-center justify-center mb-2">
        <Text className="text-2xl">{mood.emoji || '😐'}</Text>
      </View>
      <Text variant="muted" className="text-xs">
        {mood.label}
      </Text>
    </Pressable>
  );
}