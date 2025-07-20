import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { safeHaptics } from '~/lib/haptics';
import { CloudRain, TrendingDown, Minus, TrendingUp, Star } from 'lucide-react-native';

interface Mood {
  id: string;
  label: string;
  color: string;
}

const MOODS: Mood[] = [
  { id: 'very-sad', label: 'Very Sad', color: '#94A3B8' },
  { id: 'sad', label: 'Sad', color: '#64748B' },
  { id: 'neutral', label: 'Neutral', color: '#7ED321' },
  { id: 'happy', label: 'Happy', color: '#4ADE80' },
  { id: 'very-happy', label: 'Very Happy', color: '#22C55E' },
];

interface MoodSelectorProps {
  selectedMood?: string;
  onMoodSelect: (mood: Mood) => void;
}

// Helper function to render mood icons with distinctive symbols
function getMoodIconComponent(moodId: string) {
  const baseProps = { 
    size: 36, 
    strokeWidth: 3 // Thick strokes for visibility
  };
  
  switch (moodId) {
    case 'very-sad':
      return <CloudRain {...baseProps} color="#1F2937" fill="#93C5FD" />;
    case 'sad':
      return <TrendingDown {...baseProps} color="#374151" fill="#DBEAFE" />;
    case 'neutral':
      return <Minus {...baseProps} color="#374151" strokeWidth={4} />;
    case 'happy':
      return <TrendingUp {...baseProps} color="#065F46" fill="#A7F3D0" />;
    case 'very-happy':
      return <Star {...baseProps} color="#DC2626" fill="#FEF3C7" />;
    default:
      return <Minus {...baseProps} color="#374151" strokeWidth={4} />;
  }
}

export function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <View className="bg-card rounded-2xl p-6 shadow-sm">
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

  return (
    <Pressable
      onPress={handlePress}
      className="items-center"
    >
      <View
        className={
          isSelected 
            ? 'w-16 h-16 rounded-full items-center justify-center mb-2 ring-2 ring-offset-2 ring-primary'
            : 'w-16 h-16 rounded-full items-center justify-center mb-2'
        }
        style={{ backgroundColor: isSelected ? mood.color + '20' : 'transparent' }}
      >
        {getMoodIconComponent(mood.id)}
      </View>
      <Text
        variant="muted"
        className={
          isSelected 
            ? 'text-xs text-foreground font-medium'
            : 'text-xs'
        }
      >
        {mood.label}
      </Text>
    </Pressable>
  );
}