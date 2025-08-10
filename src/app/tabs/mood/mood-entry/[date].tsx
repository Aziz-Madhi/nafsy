import React, { useState, useCallback } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useCurrentUser } from '~/hooks/useSharedData';
import { MotiView } from 'moti';
import { Heart, Frown, Zap, Minus, Smile, Flame } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useMoodColor, useColors } from '~/hooks/useColors';

// Moods will be defined inside the component with hook colors

const renderMoodIcon = (moodId: string, size: number = 32, color?: string) => {
  const iconProps = { size, color: color || '#6B7280', fill: 'none' };

  switch (moodId) {
    case 'sad':
      return <Frown {...iconProps} />;
    case 'anxious':
      return <Zap {...iconProps} />;
    case 'neutral':
      return <Minus {...iconProps} />;
    case 'happy':
      return <Smile {...iconProps} />;
    case 'angry':
      return <Flame {...iconProps} />;
    default:
      return <Minus {...iconProps} />;
  }
};

// Animated Mood Button Component using MOTI
function AnimatedMoodButton({
  mood,
  isSelected,
  onPress,
}: {
  mood: any;
  isSelected: boolean;
  onPress: () => void;
}) {
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="items-center py-4"
      style={{ width: '20%' }}
    >
      <MotiView
        className={`mb-3 items-center justify-center overflow-hidden ${
          isSelected ? 'w-16 h-16 rounded-full' : ''
        }`}
        style={{
          backgroundColor: isSelected ? mood.color : 'transparent',
        }}
        animate={{
          scale: isPressed ? 0.9 : isSelected ? 1.05 : 1,
          opacity: isPressed ? 0.8 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 400,
          mass: 0.8,
        }}
      >
        {renderMoodIcon(mood.id, isSelected ? 32 : 36, colors.foreground)}
      </MotiView>
      <Text
        variant="body"
        className={`text-center ${
          isSelected ? 'font-bold' : 'font-medium text-gray-600'
        }`}
        style={{
          color: isSelected ? '#2D3748' : '#6B7280',
          fontSize: isSelected ? 16 : 14,
          letterSpacing: 0.3,
        }}
      >
        {mood.label}
      </Text>
    </Pressable>
  );
}

export default function MoodEntryModal() {
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();
  const currentUser = useCurrentUser();
  const createMood = useMutation(api.moods.createMood);
  const colors = useColors();

  const [selectedMood, setSelectedMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Parse date from URL parameter
  const selectedDate = dateParam ? parseISO(dateParam) : new Date();

  // Moods with dynamic colors
  const moods = [
    { id: 'sad', label: 'Sad', value: 'sad', color: useMoodColor('sad') },
    {
      id: 'anxious',
      label: 'Anxious',
      value: 'anxious',
      color: useMoodColor('anxious'),
    },
    {
      id: 'neutral',
      label: 'Neutral',
      value: 'neutral',
      color: useMoodColor('neutral'),
    },
    {
      id: 'happy',
      label: 'Happy',
      value: 'happy',
      color: useMoodColor('happy'),
    },
    {
      id: 'angry',
      label: 'Angry',
      value: 'angry',
      color: useMoodColor('angry'),
    },
  ] as const;

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleSaveMood = useCallback(async () => {
    if (!selectedMood || !currentUser || isSaving) return;

    try {
      setIsSaving(true);
      impactAsync(ImpactFeedbackStyle.Medium);

      // Find the selected mood object to get the correct value for backend
      const selectedMoodObj = moods.find((m) => m.id === selectedMood);
      const moodValue = selectedMoodObj?.id || selectedMood;

      await createMood({
        mood: moodValue as 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry',
        note: moodNote.trim(),
        createdAt: selectedDate.getTime(),
      });

      // Close modal after successful save
      router.back();
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedMood, moodNote, currentUser, createMood, selectedDate, isSaving]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: '#F4F1ED' }}
      edges={['top']}
    >
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={handleBack} className="mr-4">
          <SymbolView name="arrow.left" size={24} tintColor="#5A4A3A" />
        </Pressable>
        <View className="flex-1">
          <Text variant="title2" className="text-[#2D3748] font-bold">
            Log Your Mood
          </Text>
          <Text variant="caption1" className="text-gray-600 mt-1">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
      </View>

      <View className="flex-1 p-6">
        <View
          className="rounded-3xl p-6"
          style={{
            backgroundColor: 'rgba(90, 74, 58, 0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text
            variant="heading"
            className="text-[#2D3748] font-bold text-center mb-8"
            style={{ fontSize: 22, letterSpacing: 0.5 }}
          >
            How are you feeling today?
          </Text>

          {/* Mood Selection */}
          <View className="flex-row mb-6">
            {moods.map((mood) => (
              <AnimatedMoodButton
                key={mood.id}
                mood={mood}
                isSelected={selectedMood === mood.id}
                onPress={() => {
                  impactAsync(ImpactFeedbackStyle.Light);
                  setSelectedMood(mood.id);
                }}
              />
            ))}
          </View>

          {/* Note Input */}
          {selectedMood && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 150,
              }}
            >
              <View
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: '#F4F1ED',
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <TextInput
                  value={moodNote}
                  onChangeText={setMoodNote}
                  placeholder="Share what's on your mind..."
                  placeholderTextColor="#8B7355"
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  className="text-base"
                  style={{
                    textAlignVertical: 'top',
                    minHeight: 70,
                    fontSize: 16,
                    lineHeight: 22,
                    color: '#2D3748',
                    fontFamily: 'CrimsonPro-Regular',
                  }}
                />
                <Text
                  variant="caption1"
                  className="text-right mt-1"
                  style={{
                    fontSize: 12,
                    color: 'rgba(90, 74, 58, 0.6)',
                  }}
                >
                  {moodNote.length}/200
                </Text>
              </View>

              <Pressable
                onPress={handleSaveMood}
                disabled={isSaving || !selectedMood}
                className={`py-4 rounded-2xl items-center mt-4 ${
                  isSaving || !selectedMood ? 'opacity-60' : ''
                }`}
                style={{
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text variant="callout" className="text-white font-bold">
                  {isSaving ? 'Saving...' : 'Save Mood'}
                </Text>
              </Pressable>
            </MotiView>
          )}

          {/* Helper Text */}
          {!selectedMood && (
            <Text
              variant="caption1"
              className="text-center text-gray-500 mt-4"
              style={{ fontSize: 14, lineHeight: 18 }}
            >
              Select a mood above to continue
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
