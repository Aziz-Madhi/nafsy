import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text } from '~/components/ui/text';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { cn } from '~/lib/cn';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  useCurrentUser,
  useMoodData,
  useMoodStats,
  useTodayMood,
} from '~/hooks/useSharedData';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import {
  Edit3,
  Calendar,
  Flame,
  BarChart3,
  CheckCircle,
  Star,
} from 'lucide-react-native';
import { IconRenderer } from '~/components/ui/IconRenderer';
import { StatCard } from '~/components/mood/StatCard';
import { WeekView } from '~/components/mood/WeekView';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const moods = [
  { id: 'very-sad', label: 'Very Sad', value: 'sad', color: '#94A3B8' },
  { id: 'sad', label: 'Sad', value: 'sad', color: '#64748B' },
  { id: 'neutral', label: 'Neutral', value: 'neutral', color: '#7ED321' },
  { id: 'happy', label: 'Happy', value: 'happy', color: '#4ADE80' },
  { id: 'very-happy', label: 'Very Happy', value: 'happy', color: '#22C55E' },
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

const moodColors: Record<string, string> = {
  sad: '#DED2F9',
  anxious: '#FDC9D2',
  neutral: '#FDEBC9',
  happy: '#D0F1EB',
  angry: '#F5D4C1',
};

const moodChartColors: Record<string, string> = {
  sad: '#8B5CF6',
  anxious: '#EF4444',
  neutral: '#F59E0B',
  happy: '#10B981',
  angry: '#F97316',
};

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
          width: 40,
          height: 80,
          backgroundColor: '#F5F5F5',
          borderRadius: 20,
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              backgroundColor: color,
              borderRadius: 20,
              width: '100%',
            },
            animatedBarStyle,
          ]}
        />
      </View>

      {/* Mood Icon */}
      <View
        style={{
          marginTop: 8,
          backgroundColor: color + '20',
          borderRadius: 16,
          padding: 8,
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
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Data - auth is handled at tab layout level
  const currentUser = useCurrentUser();
  const createMood = useMutation(api.moods.createMood);
  const todayMood = useTodayMood();
  const moodData = useMoodData(365);
  const moodStats = useMoodStats(30);

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
      });

      await createMood({
        mood: mood.value as any,
      });
      setSelectedMood('');
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasLoggedToday = !!todayMood;

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
              borderWidth: isSelected ? 2 : 0,
              borderColor: '#2196F3',
            }}
          >
            {mood ? (
              <View>{renderMoodIcon(mood.mood, 18)}</View>
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

  // Stats section for header
  const statsSection = (
    <View className="flex-row gap-4 mb-4">
      <StatCard
        icon={Star}
        iconColor="#5A4A3A"
        value={moodStats?.totalSessions || 0}
        label="Sessions"
        backgroundColor="rgba(90, 74, 58, 0.08)"
      />
      <StatCard
        icon={Flame}
        iconColor="#5A4A3A"
        value={moodStats?.currentStreak || 0}
        label="Streaks"
        backgroundColor="rgba(90, 74, 58, 0.08)"
      />
    </View>
  );

  return (
    <DashboardLayout
      title="Mood Tracker"
      subtitle="Track your emotional wellbeing"
      statsSection={statsSection}
    >
      {/* Week View Section */}
      <View className="mb-6">
        <WeekView moodData={moodData} />
      </View>

      {/* Today's Mood Log Section */}
      <View className="mb-8">
        <View className="flex-row items-center mb-4">
          <Edit3 size={20} color="#5A4A3A" />
          <Text variant="title3" className="text-[#5A4A3A] font-bold ml-2">
            Today&apos;s Mood
          </Text>
        </View>

        {hasLoggedToday ? (
          <View
            className="rounded-3xl p-8 items-center shadow-sm"
            style={{ backgroundColor: 'rgba(90, 74, 58, 0.08)' }}
          >
            <View className="w-20 h-20 bg-[#D0F1EB] rounded-full items-center justify-center mb-4">
              <CheckCircle size={48} color="#059669" fill="#D1FAE5" />
            </View>
            <Text variant="title3" className="text-[#5A4A3A] font-bold mb-2">
              Mood Saved!
            </Text>
            <Text
              variant="body"
              className="text-[#5A4A3A] opacity-70 text-center"
            >
              Great job tracking your emotions today
            </Text>
            {todayMood && (
              <View className="flex-row items-center mt-4 bg-gray-100 px-5 py-3 rounded-2xl">
                <View style={{ marginRight: 8 }}>
                  {renderMoodIcon(todayMood.mood, 20)}
                </View>
                <Text variant="subhead" className="text-[#5A4A3A]">
                  Today you felt {todayMood.mood}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            className="rounded-3xl p-6 shadow-sm"
            style={{ backgroundColor: 'rgba(90, 74, 58, 0.08)' }}
          >
            <Text
              variant="heading"
              className="text-[#5A4A3A] font-semibold text-center mb-8"
            >
              How are you feeling today?
            </Text>

            <View className="flex-row justify-between mb-8">
              {moods.map((mood) => (
                <Pressable
                  key={mood.id}
                  onPress={() => setSelectedMood(mood.id)}
                  className="items-center"
                >
                  <View
                    className={cn(
                      'rounded-full border-2 items-center justify-center mb-2',
                      selectedMood === mood.id ? 'w-18 h-18' : 'w-16 h-16'
                    )}
                    style={{
                      backgroundColor:
                        selectedMood === mood.id ? mood.color : 'white',
                      borderColor:
                        selectedMood === mood.id ? mood.color : '#E5E7EB',
                    }}
                  >
                    {renderMoodIcon(mood.id, 32)}
                  </View>
                  <Text
                    variant="caption1"
                    className={`${
                      selectedMood === mood.id
                        ? 'font-semibold'
                        : 'text-gray-600'
                    }`}
                    style={{
                      color: selectedMood === mood.id ? mood.color : undefined,
                    }}
                  >
                    {mood.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selectedMood && (
              <Pressable
                onPress={handleSaveMood}
                disabled={isSaving}
                className={`bg-blue-500 py-4 rounded-2xl items-center ${
                  isSaving ? 'opacity-60' : ''
                }`}
              >
                <Text variant="callout" className="text-white font-semibold">
                  {isSaving ? 'Saving...' : 'Save Mood'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Calendar History Section */}
      <View className="mb-8">
        <View className="flex-row items-center mb-4">
          <Calendar size={20} color="#5A4A3A" />
          <Text variant="title3" className="text-[#5A4A3A] font-bold ml-2">
            Mood History
          </Text>
        </View>

        <View
          className="rounded-3xl p-6 shadow-sm"
          style={{ backgroundColor: 'rgba(90, 74, 58, 0.08)' }}
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
                className="text-gray-600 font-semibold mb-1"
              >
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </Text>
              {(() => {
                const selectedMoodData = getMoodForDate(selectedDate);
                if (selectedMoodData) {
                  return (
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View style={{ marginRight: 8 }}>
                        {renderMoodIcon(selectedMoodData.mood, 20)}
                      </View>
                      <Text variant="body" className="text-[#5A4A3A]">
                        You felt {selectedMoodData.mood}
                      </Text>
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
      <View className="mb-8">
        <View className="flex-row items-center mb-4">
          <BarChart3 size={20} color="#5A4A3A" />
          <Text variant="title3" className="text-[#5A4A3A] font-bold ml-2">
            Insights
          </Text>
        </View>

        {/* Mood Distribution */}
        <View
          className="rounded-2xl p-6 shadow-sm"
          style={{ backgroundColor: 'rgba(90, 74, 58, 0.08)' }}
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

        {/* Most Common Mood */}
        {moodStats?.mostCommonMood && (
          <View className="bg-yellow-100 rounded-2xl p-5 flex-row items-center justify-between mt-4">
            <View>
              <Text
                variant="subhead"
                className="text-[#92400E] opacity-80 mb-1"
              >
                Most Common Mood
              </Text>
              <Text variant="heading" className="text-[#92400E] font-semibold">
                {moodStats.mostCommonMood}
              </Text>
            </View>
            <View>{renderMoodIcon(moodStats.mostCommonMood, 48)}</View>
          </View>
        )}
      </View>
    </DashboardLayout>
  );
}
