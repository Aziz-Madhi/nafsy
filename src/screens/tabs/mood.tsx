import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Text } from '~/components/ui/text';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { cn } from '~/lib/cn';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  useCurrentUser,
  useMoodData,
  useTodayMood,
  useExercisesWithProgress,
} from '~/hooks/useSharedData';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { Calendar, BarChart3, Heart } from 'lucide-react-native';
import { IconRenderer } from '~/components/ui/IconRenderer';
import { WeekView } from '~/components/mood/WeekView';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { MotiView } from 'moti';

const moods = [
  { id: 'very-sad', label: 'Very Sad', value: 'sad', color: '#6366F1' },
  { id: 'sad', label: 'Sad', value: 'sad', color: '#8B5CF6' },
  { id: 'neutral', label: 'Neutral', value: 'neutral', color: '#F59E0B' },
  { id: 'happy', label: 'Happy', value: 'happy', color: '#10B981' },
  { id: 'very-happy', label: 'Very Happy', value: 'happy', color: '#EF4444' },
];

const renderMoodIcon = (moodId: string, size: number = 32) => {
  return (
    <IconRenderer
      iconType="mood"
      iconName={moodId}
      size={size}
      strokeWidth={3}
    />
  );
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
        className={`mb-3 items-center justify-center ${
          isSelected ? 'w-16 h-16 rounded-full' : ''
        }`}
        style={{
          backgroundColor: isSelected ? mood.color + '20' : 'transparent',
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? mood.color : 'transparent',
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
        {renderMoodIcon(mood.id, isSelected ? 36 : 42)}
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

const moodColors: Record<string, string> = {
  sad: '#B39DED', // Ultra vibrant light purple
  anxious: '#F472B6', // Ultra vibrant light pink
  neutral: '#FDE047', // Ultra vibrant light yellow
  happy: '#34D399', // Ultra vibrant light teal
  angry: '#FB923C', // Ultra vibrant light orange
};

const moodChartColors: Record<string, string> = {
  sad: '#8B5CF6',
  anxious: '#EF4444',
  neutral: '#F59E0B',
  happy: '#10B981',
  angry: '#F97316',
};

// Exercise category helpers
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    breathing: '🌬️',
    mindfulness: '🧘‍♀️',
    movement: '🚶‍♀️',
    journaling: '✍️',
    relaxation: '🛀',
  };
  return icons[category] || '⭐';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    mindfulness: '#EF4444', // Ultra vibrant coral red
    breathing: '#06B6D4', // Ultra vibrant turquoise
    movement: '#3B82F6', // Ultra vibrant sky blue
    journaling: '#10B981', // Ultra vibrant mint green
    relaxation: '#F59E0B', // Ultra vibrant warm yellow
  };
  return colors[category] || '#EF4444';
}

// Helper function to randomly select an exercise
function getRandomExercise(exercises: any[]) {
  if (!exercises || exercises.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * exercises.length);
  return exercises[randomIndex];
}

// Exercise Suggestion Card Component
function ExerciseSuggestionCard({
  exercise,
  onPress,
}: {
  exercise: any;
  onPress: () => void;
}) {
  const categoryColor = getCategoryColor(exercise.category);
  const categoryIcon = getCategoryIcon(exercise.category);

  return (
    <View
      className="p-6"
      style={{
        backgroundColor: categoryColor + '15',
      }}
    >
      <Text variant="subhead" className="text-gray-500 mb-3 font-medium">
        Try this to elevate your mood
      </Text>

      <View className="flex-row items-start mb-4">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
          style={{ backgroundColor: categoryColor + '20' }}
        >
          <Text style={{ fontSize: 20 }}>{categoryIcon}</Text>
        </View>

        <View className="flex-1">
          <Text variant="title3" className="text-[#5A4A3A] font-bold mb-1">
            {exercise.title}
          </Text>
          <Text variant="body" className="text-[#5A4A3A] opacity-70 leading-5">
            {exercise.description}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Text variant="caption1" className="text-gray-500 mr-1">
              ⏱️
            </Text>
            <Text variant="caption1" className="text-gray-600 font-medium">
              {exercise.duration} min
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text variant="caption1" className="text-gray-500 mr-1">
              📊
            </Text>
            <Text
              variant="caption1"
              className="text-gray-600 font-medium capitalize"
            >
              {exercise.difficulty}
            </Text>
          </View>
        </View>

        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: categoryColor + '15' }}
        >
          <Text
            variant="caption1"
            className="font-semibold capitalize"
            style={{ color: categoryColor }}
          >
            {exercise.category}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        className="bg-[#4C51BF] py-4 rounded-2xl items-center"
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
          shadowColor: '#4C51BF',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 6,
        })}
      >
        <Text
          variant="callout"
          className="text-white font-bold"
          style={{ fontSize: 16, letterSpacing: 0.5 }}
        >
          Start Exercise
        </Text>
      </Pressable>
    </View>
  );
}

interface MoodData {
  mood: string;
  count: number;
  percentage: number;
  color: string;
}

// Animated Bubble Component
// Simple Mood Bar Chart Component
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
  const barHeight = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    // Immediate display - no animations
    barHeight.value = percentage;
    opacity.value = 1;
  }, [percentage]);

  const animatedBarStyle = useAnimatedStyle(() => {
    'worklet';
    const height = interpolate(
      barHeight.value,
      [0, 100],
      [4, 80],
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
          height: 88,
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
          backgroundColor: color + '20',
          borderRadius: 18,
          padding: 10,
          borderWidth: 2,
          borderColor: color + '40',
          shadowColor: color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {renderMoodIcon(mood, 20)}
      </View>

      {/* Labels */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text variant="body" className="font-bold" style={{ color }}>
          {percentage.toFixed(0)}%
        </Text>
        <Text variant="muted" className="text-xs capitalize mt-1">
          {mood}
        </Text>
        <Text variant="muted" className="text-xs">
          {count} {count === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
    </View>
  );
}

// Simple Mood Chart Visualization
function SimpleMoodVisualization({ data }: { data: MoodData[] }) {
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
            {['sad', 'neutral', 'happy'].map((mood, index) => (
              <Path
                key={mood}
                d={`M${20 + index * 30} 10 C${15 + index * 30} 5, ${5 + index * 30} 5, ${5 + index * 30} 20 C${5 + index * 30} 60, ${10 + index * 30} 65, ${20 + index * 30} 65 C${30 + index * 30} 65, ${35 + index * 30} 60, ${35 + index * 30} 20 C${35 + index * 30} 5, ${25 + index * 30} 5, ${20 + index * 30} 10 Z`}
                fill="url(#empty-gradient)"
                stroke="#D1D5DB"
                strokeWidth="1"
              />
            ))}
          </Svg>
        </View>
        <Text variant="heading" className="text-[#6B7280] mb-2">
          No mood data yet
        </Text>
        <Text variant="muted" className="text-center text-sm">
          Start tracking your emotions to see{'\n'}beautiful patterns emerge
        </Text>
      </View>
    );
  }

  const activeData = data
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <View className="py-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {activeData.map((item) => (
          <SimpleMoodChart
            key={item.mood}
            mood={item.mood}
            percentage={item.percentage}
            color={item.color}
            count={item.count}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [moodNote, setMoodNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Data - auth is handled at tab layout level
  const currentUser = useCurrentUser();
  const createMood = useMutation(api.moods.createMood);
  const todayMood = useTodayMood();
  const moodData = useMoodData(365);
  const exercisesWithProgress = useExercisesWithProgress(undefined, 20);

  const handleSaveMood = async () => {
    if (!selectedMood || !currentUser || isSaving) return;

    setIsSaving(true);
    try {
      const mood = moods.find((m) => m.id === selectedMood);
      console.log(
        'Selected mood:',
        selectedMood,
        'Found mood:',
        mood,
        'Current user:',
        currentUser
      );

      if (!mood) {
        console.error('Mood not found for selectedMood:', selectedMood);
        return;
      }

      if (!currentUser?._id) {
        console.error('Current user ID not found:', currentUser);
        return;
      }

      console.log('Creating mood with:', {
        mood: mood.value,
        note: moodNote.trim() || undefined,
      });

      await createMood({
        mood: mood.value as any,
        note: moodNote.trim() || undefined,
      });
      setSelectedMood('');
      setMoodNote('');
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasLoggedToday = !!todayMood;

  // Get random exercise suggestion
  const suggestedExercise = useMemo(() => {
    return getRandomExercise(exercisesWithProgress || []);
  }, [exercisesWithProgress]);

  const handleStartExercise = () => {
    // Navigate to exercises tab - the app uses tab-based navigation
    router.push('/tabs/exercises');
  };

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const getMoodForDate = (date: Date) => {
    return moodData?.find((mood) => isSameDay(new Date(mood.createdAt), date));
  };

  // Combine padding days and actual days for FlashList
  const calendarData = useMemo(() => {
    const paddingItems = paddingDays.map((_, index) => ({
      id: `padding-${index}`,
      type: 'padding' as const,
      date: null,
    }));

    const dayItems = days.map((day) => ({
      id: day.toISOString(),
      type: 'day' as const,
      date: day,
    }));

    return [...paddingItems, ...dayItems];
  }, [paddingDays, days]);

  // FlashList render functions
  const renderCalendarItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === 'padding') {
        return <View style={{ width: '100%', height: 48 }} />;
      }

      const mood = getMoodForDate(item.date);
      const isToday = isSameDay(item.date, new Date());
      const isSelected = selectedDate && isSameDay(item.date, selectedDate);

      return (
        <Pressable
          onPress={() => setSelectedDate(item.date)}
          style={{
            width: '100%',
            height: 48,
            padding: 2,
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              backgroundColor: mood
                ? moodColors[mood.mood]
                : isSelected
                  ? '#E0F2FE'
                  : isToday
                    ? '#F3F4F6'
                    : 'transparent',
              borderWidth: mood ? 2 : isSelected ? 2 : 0,
              borderColor: mood ? moodChartColors[mood.mood] : '#2196F3',
              shadowColor: mood ? moodChartColors[mood.mood] : '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: mood ? 0.2 : 0,
              shadowRadius: 2,
              elevation: mood ? 2 : 0,
            }}
          >
            {mood ? (
              <View>{renderMoodIcon(mood.mood, 20)}</View>
            ) : (
              <Text
                variant="body"
                className={cn(
                  'font-medium',
                  isToday ? 'text-primary' : 'text-foreground'
                )}
              >
                {format(item.date, 'd')}
              </Text>
            )}
          </View>
        </Pressable>
      );
    },
    [selectedDate, setSelectedDate, getMoodForDate]
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  const getItemType = useCallback((item: any) => item.type, []);

  return (
    <DashboardLayout title="Mood">
      {/* Week View Section with exercise-screen-style horizontal spacing */}
      <View className="mb-8" style={{ marginHorizontal: 6 }}>
        <WeekView moodData={moodData} />
      </View>

      {/* Today's Mood Log Section */}
      <View className="mb-8" style={{ marginHorizontal: 6 }}>
        {hasLoggedToday ? (
          <View
            className="rounded-3xl overflow-hidden border border-gray-200"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            {/* Mood check section */}
            <View
              className="p-6 pb-4"
              style={{
                backgroundColor: 'rgba(90, 74, 58, 0.12)',
              }}
            >
              {todayMood && (
                <View className="flex-row items-center">
                  <View className="mr-3">
                    <Text style={{ fontSize: 28, color: '#10B981' }}>✓</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      variant="body"
                      className="text-[#2D3748] font-bold capitalize"
                      style={{ fontSize: 16, letterSpacing: 0.3 }}
                    >
                      Feeling {todayMood.mood} today
                    </Text>
                    {todayMood.note && (
                      <Text
                        variant="caption1"
                        className="text-gray-600 mt-1 font-medium"
                        style={{ fontSize: 14, lineHeight: 18 }}
                      >
                        &ldquo;{todayMood.note}&rdquo;
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Exercise suggestion - full width */}
            {suggestedExercise ? (
              <ExerciseSuggestionCard
                exercise={suggestedExercise}
                onPress={handleStartExercise}
              />
            ) : (
              <View className="bg-white p-4">
                <Text variant="body" className="text-center text-gray-500">
                  Loading exercise suggestions...
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            className="rounded-3xl p-6 border border-gray-200"
            style={{
              backgroundColor: 'rgba(90, 74, 58, 0.12)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text
              variant="heading"
              className="text-[#2D3748] font-bold text-center mb-8"
              style={{ fontSize: 22, letterSpacing: 0.5 }}
            >
              How are you feeling today?
            </Text>

            <View className="flex-row mb-4">
              {moods.map((mood) => (
                <AnimatedMoodButton
                  key={mood.id}
                  mood={mood}
                  isSelected={selectedMood === mood.id}
                  onPress={() => setSelectedMood(mood.id)}
                />
              ))}
            </View>

            {selectedMood && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 150,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="flex-1 rounded-2xl p-4 border"
                    style={{
                      backgroundColor: 'rgba(90, 74, 58, 0.08)',
                      borderColor: 'rgba(90, 74, 58, 0.15)',
                      shadowColor: '#5A4A3A',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <TextInput
                      value={moodNote}
                      onChangeText={setMoodNote}
                      placeholder="Share what's on your mind..."
                      placeholderTextColor="#8B7355"
                      multiline
                      numberOfLines={2}
                      maxLength={200}
                      className="text-base"
                      style={{
                        textAlignVertical: 'top',
                        minHeight: 50,
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
                  <MotiView
                    animate={{
                      scale: isSaving ? 0.9 : 1,
                      rotate: isSaving ? '180deg' : '0deg',
                    }}
                    transition={{
                      type: 'timing',
                      duration: 150,
                    }}
                  >
                    <Pressable
                      onPress={handleSaveMood}
                      disabled={isSaving}
                      className={`w-14 h-14 rounded-2xl items-center justify-center ${
                        isSaving ? 'opacity-60' : ''
                      }`}
                      style={{
                        backgroundColor: '#5A4A3A',
                        shadowColor: '#5A4A3A',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.25,
                        shadowRadius: 6,
                        elevation: 4,
                      }}
                    >
                      <Heart size={20} color="white" fill="white" />
                    </Pressable>
                  </MotiView>
                </View>
              </MotiView>
            )}
          </View>
        )}
      </View>

      {/* Calendar History Section */}
      <View className="mb-8" style={{ marginHorizontal: 6 }}>
        <View className="flex-row items-center mb-4">
          <Calendar size={20} color="#5A4A3A" />
          <Text
            variant="title3"
            className="text-[#2D3748] font-bold ml-2"
            style={{ fontSize: 18, letterSpacing: 0.3 }}
          >
            Mood History
          </Text>
        </View>

        <View
          className="rounded-3xl p-6 border border-gray-200"
          style={{
            backgroundColor: 'rgba(90, 74, 58, 0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {/* Month Navigation */}
          <View className="flex-row justify-between items-center mb-6">
            <Pressable
              onPress={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1
                  )
                )
              }
              className="p-3 bg-gray-100 rounded-xl"
            >
              <Text variant="callout" className="text-[#5A4A3A]">
                ←
              </Text>
            </Pressable>
            <Text variant="heading" className="text-[#5A4A3A] font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </Text>
            <Pressable
              onPress={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1
                  )
                )
              }
              className="p-3 bg-gray-100 rounded-xl"
            >
              <Text variant="callout" className="text-[#5A4A3A]">
                →
              </Text>
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                <Text
                  variant="caption1"
                  className="text-muted-foreground font-semibold"
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ height: Math.ceil(calendarData.length / 7) * 48 }}>
            <FlashList
              data={calendarData}
              renderItem={renderCalendarItem}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              numColumns={7}
              estimatedItemSize={48}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Selected Date Info */}
          {selectedDate && (
            <View
              style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
              }}
            >
              <Text
                variant="subhead"
                className="text-gray-600 font-semibold mb-3"
              >
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </Text>
              {(() => {
                const selectedMoodData = getMoodForDate(selectedDate);
                if (selectedMoodData) {
                  return (
                    <View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <View
                          className="w-12 h-12 rounded-2xl items-center justify-center mr-3 border-2"
                          style={{
                            backgroundColor: moodColors[selectedMoodData.mood],
                            borderColor: moodChartColors[selectedMoodData.mood],
                            shadowColor: moodChartColors[selectedMoodData.mood],
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            elevation: 3,
                          }}
                        >
                          {renderMoodIcon(selectedMoodData.mood, 22)}
                        </View>
                        <Text
                          variant="body"
                          className="text-[#5A4A3A] capitalize font-medium"
                        >
                          Feeling {selectedMoodData.mood}
                        </Text>
                      </View>
                      {selectedMoodData.note && (
                        <View className="bg-white rounded-xl p-3 border border-gray-100">
                          <Text
                            variant="caption1"
                            className="text-gray-500 mb-1 font-medium"
                          >
                            Insight
                          </Text>
                          <Text
                            variant="body"
                            className="text-[#5A4A3A] leading-5"
                          >
                            {selectedMoodData.note}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                } else {
                  return (
                    <Text variant="body" className="text-muted-foreground">
                      No mood logged for this day
                    </Text>
                  );
                }
              })()}
            </View>
          )}
        </View>
      </View>

      {/* Insights Section */}
      <View className="mb-8" style={{ marginHorizontal: 6, paddingBottom: 80 }}>
        <View className="flex-row items-center mb-4">
          <BarChart3 size={20} color="#5A4A3A" />
          <Text
            variant="title3"
            className="text-[#2D3748] font-bold ml-2"
            style={{ fontSize: 18, letterSpacing: 0.3 }}
          >
            Insights
          </Text>
        </View>

        {/* Mood Distribution */}
        <View
          className="rounded-2xl p-6 border border-gray-200"
          style={{
            backgroundColor: 'rgba(90, 74, 58, 0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Text variant="heading" className="text-[#5A4A3A] font-semibold mb-6">
            Mood Distribution
          </Text>

          {(() => {
            const chartData: MoodData[] = [
              'sad',
              'anxious',
              'neutral',
              'happy',
              'angry',
            ].map((mood) => {
              const count =
                moodData?.filter((m) => m.mood === mood).length || 0;
              const percentage = moodData?.length
                ? (count / moodData.length) * 100
                : 0;

              return {
                mood,
                count,
                percentage,
                color: moodChartColors[mood] || '#7ED321',
              };
            });

            return <SimpleMoodVisualization data={chartData} />;
          })()}
        </View>
      </View>
    </DashboardLayout>
  );
}
