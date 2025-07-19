import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
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

interface SafeMoodSelectorProps {
  selectedMood?: string;
  onMoodSelect: (mood: Mood) => void;
}

export function SafeMoodSelector({ selectedMood, onMoodSelect }: SafeMoodSelectorProps) {
  const { colorScheme } = useNativewindColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View className="bg-white/80 rounded-2xl p-6 shadow-sm">
      <Text className="text-lg font-semibold mb-6 text-center text-[#5A4A3A]">
        How are you feeling today?
      </Text>
      
      <View style={styles.moodContainer}>
        {MOODS.map((mood) => (
          <MoodButton
            key={mood.id}
            mood={mood}
            isSelected={selectedMood === mood.id}
            onPress={() => onMoodSelect(mood)}
            isDark={isDark}
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
  isDark: boolean;
}

function MoodButton({ mood, isSelected, onPress, isDark }: MoodButtonProps) {
  const handlePress = () => {
    onPress();
    safeHaptics.impact();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.moodButton}
    >
      <View style={[
        styles.moodCircle,
        isSelected && styles.selectedCircle,
        isSelected && { backgroundColor: mood.color + '20' }
      ]}>
        <Text style={styles.moodEmoji}>{mood.emoji || '😐'}</Text>
      </View>
      <Text style={[
        styles.moodLabel,
        isSelected && styles.selectedLabel,
        isDark && styles.moodLabelDark,
        isSelected && isDark && styles.selectedLabelDark
      ]}>
        {mood.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#1F2937',
    shadowOpacity: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    color: '#111827',
  },
  titleDark: {
    color: '#F9FAFB',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
  },
  moodCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  selectedCircle: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  moodLabelDark: {
    color: '#9CA3AF',
  },
  selectedLabel: {
    color: '#111827',
    fontWeight: '500',
  },
  selectedLabelDark: {
    color: '#F9FAFB',
  },
});