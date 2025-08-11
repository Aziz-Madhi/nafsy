import React, { useMemo, useCallback, useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { Text } from '~/components/ui/text';
import { WeekView } from '~/components/mood/WeekView';
import { PixelCalendar } from '~/components/mood/PixelCalendar';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import {
  useMoodData,
  useTodayMood,
  useCurrentUser,
} from '~/hooks/useSharedData';
import { useTranslation } from '~/hooks/useTranslation';
import { Frown, Zap, Minus, Smile, Flame } from 'lucide-react-native';
import { cn } from '~/lib/cn';
import { MotiView } from 'moti';
import { useColors, useShadowStyle, useMoodColor } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const moods = [
  { id: 'sad', label: 'Sad', value: 'sad' },
  { id: 'anxious', label: 'Anxious', value: 'anxious' },
  { id: 'neutral', label: 'Neutral', value: 'neutral' },
  { id: 'happy', label: 'Happy', value: 'happy' },
  { id: 'angry', label: 'Angry', value: 'angry' },
] as const;

// Encouraging messages configuration
const encouragingMessages = [
  {
    id: 1,
    prefix: 'Building',
    highlight: 'SELF-AWARENESS',
    suffix:
      'Each mood entry reveals patterns that lead to deeper understanding.',
  },
  {
    id: 2,
    prefix: 'Discovering',
    highlight: 'PATTERNS',
    suffix: 'Your emotional patterns will guide your wellness journey.',
  },
  {
    id: 3,
    prefix: 'Finding',
    highlight: 'CLARITY',
    suffix: 'Regular mood tracking brings clarity to your emotional landscape.',
  },
  {
    id: 4,
    prefix: 'Tracking',
    highlight: 'PROGRESS',
    suffix: 'Your mood log is becoming a powerful tool for personal growth.',
  },
  {
    id: 5,
    prefix: 'Building',
    highlight: 'HABITS',
    suffix:
      'This daily practice helps you understand yourself better each day.',
  },
  {
    id: 6,
    prefix: 'Experiencing',
    highlight: 'GROWTH',
    suffix:
      'Every mood entry contributes to your emotional intelligence journey.',
  },
  {
    id: 7,
    prefix: '',
    highlight: 'KEEP GOING!',
    suffix:
      'Your commitment to tracking moods is the foundation of emotional wellness.',
  },
] as const;

const renderMoodIcon = (
  moodId: string,
  size: number = 24,
  color?: string,
  colors?: ReturnType<typeof useColors>
) => {
  const iconProps = {
    size,
    color: color || colors?.foreground || '#5A4A3A',
    fill: 'none',
  };

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

// Animated Mood Button Component
function AnimatedMoodButton({
  mood,
  isSelected,
  onPress,
}: {
  mood: (typeof moods)[number];
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const colors = useColors();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isSelected ? 1.1 : 1) }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.95))}
      onPressOut={() => (scale.value = withSpring(1))}
      className="items-center"
      style={{ width: '20%' }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            width: 64,
            height: 64,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected
              ? colors[
                  `mood${mood.id.charAt(0).toUpperCase() + mood.id.slice(1)}` as keyof typeof colors
                ]
              : withOpacity(colors.shadow, 0.05),
            overflow: 'hidden',
          },
        ]}
      >
        {renderMoodIcon(mood.id, 28, colors.foreground, colors)}
      </Animated.View>
      <Text
        variant="caption1"
        className="mt-2 text-center font-medium"
        style={{
          color: isSelected
            ? colors[
                `mood${mood.id.charAt(0).toUpperCase() + mood.id.slice(1)}` as keyof typeof colors
              ]
            : colors.foreground,
        }}
      >
        {mood.label}
      </Text>
    </Pressable>
  );
}

export default function MoodIndex() {
  const {} = useTranslation(); // eslint-disable-line no-empty-pattern
  const moodData = useMoodData();
  const todayMood = useTodayMood();
  const currentUser = useCurrentUser();
  const createMood = useMutation(api.moods.createMood);
  const colors = useColors();
  const shadowMedium = useShadowStyle('medium');

  // Helper function to get mood color
  const getMoodColorValue = (mood: string) => {
    const moodColorMap: Record<string, keyof typeof colors> = {
      happy: 'moodHappy',
      sad: 'moodSad',
      anxious: 'moodAnxious',
      neutral: 'moodNeutral',
      angry: 'moodAngry',
    };
    return colors[moodColorMap[mood]] || colors.success;
  };

  const [selectedMood, setSelectedMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const hasLoggedToday = !!todayMood;

  // Select encouraging message based on day of week
  const selectedEncouragingMessage = useMemo(() => {
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    // Use day of week to select message (ensures same message throughout the day)
    const messageIndex = today % encouragingMessages.length;
    return encouragingMessages[messageIndex];
  }, []);

  // Save mood handler
  const handleSaveMood = useCallback(async () => {
    if (!selectedMood || !currentUser || isSaving) return;

    try {
      setIsSaving(true);
      impactAsync(ImpactFeedbackStyle.Medium);

      const selectedMoodObj = moods.find((m) => m.id === selectedMood);
      const moodValue = selectedMoodObj?.value || selectedMood;

      await createMood({
        mood: moodValue as 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry',
        note: moodNote.trim(),
        createdAt: new Date().getTime(),
      });

      // Reset form
      setSelectedMood('');
      setMoodNote('');
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedMood, moodNote, currentUser, createMood, isSaving]);

  const screenTitle = 'Mood';

  return (
    <DashboardLayout title={screenTitle}>
      <View>
        {/* Week View Section */}
        <View className="mb-1" style={{ marginHorizontal: 6 }}>
          <WeekView moodData={moodData} />
        </View>

        {/* Mood Logging Card */}
        <View className="mb-6" style={{ marginHorizontal: 6 }}>
          <View
            className={cn(
              'rounded-3xl p-6 border border-border/20',
              hasLoggedToday && todayMood
                ? `bg-mood-${todayMood.mood}/30`
                : 'bg-black/[0.03] dark:bg-white/[0.03]'
            )}
            style={{
              ...shadowMedium,
            }}
          >
            {hasLoggedToday ? (
              // Encouraging message after mood logged - matching base mood entry structure
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                <View className="items-center justify-center flex-1">
                  {/* Prefix text */}
                  {selectedEncouragingMessage.prefix && (
                    <Text
                      className="text-center mb-1"
                      style={{
                        fontFamily: 'CrimsonPro-Regular',
                        fontSize: 18,
                        lineHeight: 24,
                        color: colors.foreground,
                        letterSpacing: 0.5,
                      }}
                    >
                      {selectedEncouragingMessage.prefix}
                    </Text>
                  )}

                  {/* Highlighted key phrase */}
                  <Text
                    className="text-center mb-4"
                    style={{
                      fontFamily: 'CrimsonPro-Bold',
                      fontSize: 32,
                      lineHeight: 38,
                      color: todayMood
                        ? getMoodColorValue(todayMood.mood)
                        : colors.success,
                      letterSpacing: 1.5,
                    }}
                  >
                    {selectedEncouragingMessage.highlight}
                  </Text>

                  {/* Visual separator */}
                  <View
                    className="mb-4"
                    style={{
                      width: 40,
                      height: 2,
                      backgroundColor: todayMood
                        ? getMoodColorValue(todayMood.mood) + '30'
                        : 'rgba(34, 197, 94, 0.3)', // success with opacity
                      borderRadius: 1,
                    }}
                  />

                  {/* Supporting text */}
                  <Text
                    className="text-center px-6"
                    style={{
                      fontFamily: 'CrimsonPro-Italic-VariableFont',
                      fontSize: 16,
                      lineHeight: 24,
                      color: withOpacity(colors.foreground, 0.7),
                      letterSpacing: 0,
                    }}
                  >
                    {selectedEncouragingMessage.suffix}
                  </Text>
                </View>
              </MotiView>
            ) : (
              // Mood selection view
              <View>
                <Text
                  className="text-center mb-6"
                  style={{
                    fontFamily: 'CrimsonPro-Bold',
                    fontSize: 28,
                    lineHeight: 34,
                    color: colors.foreground,
                  }}
                >
                  How are you feeling today?
                </Text>

                {/* Mood Selection */}
                <View className="flex-row justify-between mb-6">
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
                    transition={{ type: 'timing', duration: 200 }}
                  >
                    <View className="mb-4">
                      <Text
                        variant="caption1"
                        className="text-muted-foreground mb-2"
                      >
                        Add a note (optional)
                      </Text>
                      <View className="rounded-2xl p-4 border border-border/10 bg-black/[0.02]">
                        <TextInput
                          value={moodNote}
                          onChangeText={setMoodNote}
                          placeholder="What's on your mind?"
                          placeholderTextColor={withOpacity(
                            colors.foreground,
                            0.6
                          )}
                          multiline
                          numberOfLines={3}
                          maxLength={200}
                          className="text-base"
                          style={{
                            textAlignVertical: 'top',
                            minHeight: 60,
                            fontSize: 16,
                            lineHeight: 22,
                            color: colors.foreground,
                          }}
                        />
                        <Text
                          variant="caption2"
                          style={{
                            textAlign: 'right',
                            marginTop: 4,
                            color: colors.foreground,
                          }}
                        >
                          {moodNote.length}/200
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={handleSaveMood}
                      disabled={isSaving || !selectedMood}
                      className={`py-4 rounded-2xl items-center ${
                        isSaving || !selectedMood ? 'opacity-60' : ''
                      }`}
                      style={{
                        backgroundColor: colors.brandDarkBlue,
                        shadowColor: colors.brandDarkBlue,
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
              </View>
            )}
          </View>
        </View>

        {/* Pixel Calendar - Mood Visualization */}
        <View className="mb-6" style={{ marginHorizontal: 6 }}>
          <View
            className="rounded-3xl p-4 border border-gray-200 bg-black/[0.03] dark:bg-white/[0.03]"
            style={{
              ...shadowMedium,
            }}
          >
            <PixelCalendar
              moodData={moodData}
              onPress={() => {
                if (!isNavigating) {
                  setIsNavigating(true);
                  impactAsync(ImpactFeedbackStyle.Light);
                  router.push('/tabs/mood/year-view');
                  // Reset navigation flag after a delay
                  setTimeout(() => setIsNavigating(false), 1000);
                }
              }}
            />
          </View>
        </View>
      </View>
    </DashboardLayout>
  );
}
