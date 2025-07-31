import React, { useMemo, useCallback, useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { Text } from '~/components/ui/text';
import { WeekView } from '~/components/mood/WeekView';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import {
  useMoodData,
  useTodayMood,
  useCurrentUser,
} from '~/hooks/useSharedData';
import { useTranslation } from '~/hooks/useTranslation';
import { format } from 'date-fns';
import { Frown, Zap, Minus, Smile, Flame } from 'lucide-react-native';
import { colors } from '~/lib/design-tokens';
import { MotiView } from 'moti';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const moods = [
  { id: 'sad', label: 'Sad', value: 'sad', color: colors.mood.sad.primary },
  {
    id: 'anxious',
    label: 'Anxious',
    value: 'anxious',
    color: colors.mood.anxious.primary,
  },
  {
    id: 'neutral',
    label: 'Neutral',
    value: 'neutral',
    color: colors.mood.neutral.primary,
  },
  {
    id: 'happy',
    label: 'Happy',
    value: 'happy',
    color: colors.mood.happy.primary,
  },
  {
    id: 'angry',
    label: 'Angry',
    value: 'angry',
    color: colors.mood.angry.primary,
  },
] as const;

const renderMoodIcon = (moodId: string, size: number = 24, color?: string) => {
  const iconProps = { size, color: color || colors.neutral[900], fill: 'none' };

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
              ? colors.mood[mood.id].primary
              : 'rgba(0,0,0,0.05)',
            overflow: 'hidden',
          },
        ]}
      >
        {renderMoodIcon(mood.id, 28, colors.neutral[900])}
      </Animated.View>
      <Text
        variant="caption1"
        className="mt-2 text-center font-medium"
        style={{
          color: isSelected
            ? colors.mood[mood.id].primary
            : colors.neutral[700],
        }}
      >
        {mood.label}
      </Text>
    </Pressable>
  );
}

// Enhanced Mood Chart Component
function SimpleMoodChart({
  mood,
  percentage,
  color,
  count,
}: {
  mood: string;
  percentage: number;
  color: string;
  count: number;
}) {
  const barHeight = useSharedValue(percentage);
  const opacity = useSharedValue(1);

  const animatedBarStyle = useAnimatedStyle(() => {
    'worklet';
    const height = interpolate(
      barHeight.value,
      [0, 100],
      [4, 100],
      Extrapolation.CLAMP
    );

    return {
      height,
      opacity: opacity.value,
    };
  });

  return (
    <View style={{ alignItems: 'center', margin: 8 }}>
      {/* Chart Bar */}
      <View
        style={{
          width: 44,
          height: 110,
          backgroundColor: '#F1F5F9',
          borderRadius: 22,
          justifyContent: 'flex-end',
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Animated.View
          style={[
            {
              backgroundColor: color,
              borderRadius: 20,
              width: '100%',
              shadowColor: color,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
            },
            animatedBarStyle,
          ]}
        />
      </View>

      {/* Mood Icon */}
      <View
        style={{
          marginTop: 10,
          backgroundColor: colors.mood[mood]?.primary || color,
          borderRadius: 18,
          padding: 10,
          overflow: 'hidden',
        }}
      >
        {renderMoodIcon(mood, 20, colors.neutral[900])}
      </View>

      {/* Labels */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text variant="body" className="font-bold" style={{ color }}>
          {percentage.toFixed(0)}%
        </Text>
        <Text variant="muted" className="text-xs capitalize mt-1">
          {mood}
        </Text>
      </View>
    </View>
  );
}

// Simple Mood Chart Visualization
function SimpleMoodVisualization({ data }: { data: any[] }) {
  if (data.every((item) => item.count === 0)) {
    return (
      <View className="items-center justify-center py-12">
        <View className="mb-6">
          <Svg width="120" height="80" viewBox="0 0 120 80">
            <Defs>
              <LinearGradient
                id="empty-gradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <Stop offset="0%" stopColor="#E5E7EB" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.1" />
              </LinearGradient>
            </Defs>
            <Path
              d="M20 60 Q60 20 100 60 L100 70 Q60 30 20 70 Z"
              fill="url(#empty-gradient)"
              stroke="#D1D5DB"
              strokeWidth="1"
            />
          </Svg>
        </View>
        <Text variant="title3" className="text-gray-500 font-semibold mb-2">
          No Mood Data Yet
        </Text>
        <Text variant="body" className="text-center text-gray-400 max-w-xs">
          Start logging your daily moods to see insights and patterns here.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
      {data.map((item) => (
        <SimpleMoodChart
          key={item.mood}
          mood={item.mood}
          percentage={item.percentage}
          color={item.color}
          count={item.count}
        />
      ))}
    </View>
  );
}

export default function MoodIndex() {
  const {} = useTranslation(); // eslint-disable-line no-empty-pattern
  const moodData = useMoodData();
  const todayMood = useTodayMood();
  const currentUser = useCurrentUser();
  const createMood = useMutation(api.moods.createMood);

  const [selectedMood, setSelectedMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const hasLoggedToday = !!todayMood;

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

  // Calculate mood distribution
  const chartData = useMemo(() => {
    return ['sad', 'anxious', 'neutral', 'happy', 'angry'].map((mood) => {
      const count = moodData?.filter((m) => m.mood === mood).length || 0;
      const percentage = moodData?.length ? (count / moodData.length) * 100 : 0;

      return {
        mood,
        count,
        percentage,
        color: colors.mood[mood]?.primary || '#7ED321',
      };
    });
  }, [moodData]);

  const mostFrequentMood = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((prev, current) =>
      current.count > prev.count ? current : prev
    );
  }, [chartData]);

  return (
    <DashboardLayout title={screenTitle}>
      <View>
        {/* Week View Section */}
        <View className="mb-1" style={{ marginHorizontal: 6 }}>
          <WeekView moodData={moodData} />
        </View>

        {/* Mood Logging Card */}
        <View className="mb-4" style={{ marginHorizontal: 6 }}>
          <View
            className="rounded-3xl p-6 border border-gray-200"
            style={{
              backgroundColor: 'rgba(90, 74, 58, 0.12)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            {hasLoggedToday ? (
              // Today's mood logged view
              <View>
                <View className="flex-row items-center mb-5">
                  {todayMood && (
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-4 overflow-hidden"
                      style={{
                        backgroundColor: colors.mood[todayMood.mood].primary,
                      }}
                    >
                      {renderMoodIcon(todayMood.mood, 28, colors.neutral[900])}
                    </View>
                  )}
                  <View className="flex-1">
                    <Text
                      variant="body"
                      style={{
                        fontSize: 17,
                        color: colors.neutral[900],
                        fontWeight: '600',
                        letterSpacing: -0.4,
                      }}
                    >
                      Today&apos;s mood captured
                    </Text>
                    {todayMood && (
                      <Text
                        variant="caption1"
                        style={{
                          color: colors.neutral[600],
                          fontSize: 15,
                          fontWeight: '500',
                          marginTop: 8,
                        }}
                        className="capitalize"
                      >
                        Feeling {todayMood.mood}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => {
                      const today = format(new Date(), 'yyyy-MM-dd');
                      router.push(`/tabs/mood/mood-entry/${today}`);
                    }}
                    className="px-4 py-2 rounded-full"
                    style={({ pressed }) => ({
                      backgroundColor: pressed
                        ? colors.neutral[100]
                        : colors.neutral[50],
                      borderWidth: 1,
                      borderColor: colors.neutral[200],
                    })}
                  >
                    <Text
                      variant="caption1"
                      style={{
                        color: colors.neutral[900],
                        fontWeight: '600',
                        fontSize: 15,
                      }}
                    >
                      Edit
                    </Text>
                  </Pressable>
                </View>

                {todayMood?.note && (
                  <View
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor: 'rgba(90, 74, 58, 0.04)',
                      borderWidth: 1,
                      borderColor: 'rgba(90, 74, 58, 0.08)',
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <View
                        className="w-6 h-6 rounded-lg items-center justify-center mr-2"
                        style={{ backgroundColor: 'rgba(90, 74, 58, 0.08)' }}
                      >
                        <Text style={{ fontSize: 12 }}>📝</Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: colors.neutral[600],
                          letterSpacing: -0.2,
                          textTransform: 'uppercase',
                        }}
                      >
                        Today&apos;s reflection
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        lineHeight: 24,
                        color: colors.neutral[900],
                        fontStyle: 'italic',
                        letterSpacing: -0.3,
                      }}
                    >
                      {todayMood.note}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              // Mood selection view
              <View>
                <Text
                  className="text-center mb-6"
                  style={{
                    fontFamily: 'CrimsonPro-Bold',
                    fontSize: 28,
                    lineHeight: 34,
                    color: colors.neutral[900],
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
                        style={{ color: colors.neutral[700], marginBottom: 8 }}
                      >
                        Add a note (optional)
                      </Text>
                      <View
                        className="rounded-2xl p-4 border"
                        style={{
                          backgroundColor: 'rgba(90, 74, 58, 0.04)',
                          borderColor: 'rgba(90, 74, 58, 0.1)',
                        }}
                      >
                        <TextInput
                          value={moodNote}
                          onChangeText={setMoodNote}
                          placeholder="What's on your mind?"
                          placeholderTextColor="#9CA3AF"
                          multiline
                          numberOfLines={3}
                          maxLength={200}
                          className="text-base"
                          style={{
                            textAlignVertical: 'top',
                            minHeight: 60,
                            fontSize: 16,
                            lineHeight: 22,
                            color: colors.neutral[900],
                          }}
                        />
                        <Text
                          variant="caption2"
                          style={{
                            textAlign: 'right',
                            marginTop: 4,
                            color: colors.neutral[600],
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
                        backgroundColor: '#5A4A3A',
                        shadowColor: '#5A4A3A',
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

        {/* Mood Distribution Chart */}
        <View className="mb-6" style={{ marginHorizontal: 6 }}>
          <View
            className="rounded-2xl p-5 border border-gray-200"
            style={{
              backgroundColor: 'rgba(90, 74, 58, 0.12)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <SimpleMoodVisualization data={chartData} />

            {/* Most Frequent Mood Section */}
            {mostFrequentMood && mostFrequentMood.count > 0 && (
              <View className="mt-3">
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                    style={{
                      backgroundColor: mostFrequentMood.color + '20',
                      borderWidth: 2,
                      borderColor: mostFrequentMood.color,
                    }}
                  >
                    {renderMoodIcon(mostFrequentMood.mood, 20)}
                  </View>
                  <View className="flex-1">
                    <Text
                      variant="body"
                      className="text-[#5A4A3A] font-semibold capitalize"
                    >
                      Most Frequent: {mostFrequentMood.mood}
                    </Text>
                    <Text variant="caption1" className="text-gray-600 mt-1">
                      {mostFrequentMood.count} times (
                      {mostFrequentMood.percentage.toFixed(0)}%)
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </DashboardLayout>
  );
}
