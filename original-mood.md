import React, { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';

const moods = [
  { id: 'very-sad', emoji: '😢', label: 'Very Sad', value: 'sad', color: '#94A3B8' },
  { id: 'sad', emoji: '😔', label: 'Sad', value: 'sad', color: '#64748B' },
  { id: 'neutral', emoji: '😐', label: 'Neutral', value: 'neutral', color: '#7ED321' },
  { id: 'happy', emoji: '😊', label: 'Happy', value: 'happy', color: '#4ADE80' },
  { id: 'very-happy', emoji: '😄', label: 'Very Happy', value: 'happy', color: '#22C55E' },
];

const moodEmojis: Record<string, string> = {
  'sad': '😔',
  'anxious': '😟',
  'neutral': '😐',
  'happy': '😊',
  'angry': '😠',
};

const moodColors: Record<string, string> = {
  'sad': '#DED2F9',
  'anxious': '#FDC9D2',
  'neutral': '#FDEBC9',
  'happy': '#D0F1EB',
  'angry': '#F5D4C1',
};

type ViewMode = 'input' | 'calendar' | 'stats';

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Authentication
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  
  // Convex
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user && isSignedIn ? { clerkId: user.id } : 'skip'
  );
  const createMood = useMutation(api.moods.createMood);
  const todayMood = useQuery(
    api.moods.getTodayMood,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  const moodData = useQuery(
    api.moods.getMoods,
    currentUser ? { userId: currentUser._id, limit: 365 } : 'skip'
  );
  const moodStats = useQuery(
    api.moods.getMoodStats,
    currentUser ? { userId: currentUser._id, days: 30 } : 'skip'
  );

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2FAF9' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2FAF9' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🤗</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#5A4A3A', textAlign: 'center' }}>
            Sign In Required
          </Text>
          <Text style={{ fontSize: 16, color: '#5A4A3A', opacity: 0.7, marginTop: 8, textAlign: 'center' }}>
            Please sign in to start tracking your emotional wellbeing
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveMood = async () => {
    if (!selectedMood || !currentUser || isSaving) return;
    
    setIsSaving(true);
    try {
      const mood = moods.find(m => m.id === selectedMood);
      if (mood) {
        await createMood({
          userId: currentUser._id,
          mood: mood.value,
        });
        setSelectedMood('');
      }
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
    return moodData?.find(mood => 
      isSameDay(new Date(mood.createdAt), date)
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2FAF9]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Header */}
          <Text 
            variant="title1" 
            className="text-[#5A4A3A] font-bold mb-2"
          >
            Mood Tracker
          </Text>
          <Text 
            variant="body" 
            className="text-[#5A4A3A] opacity-70 mb-6"
          >
            Track your emotional wellbeing
          </Text>

          {/* Today's Mood Log Section */}
          <View className="mb-8">
            <Text 
              variant="title3" 
              className="text-[#5A4A3A] font-bold mb-4"
            >
              ✏️ Today's Mood
            </Text>
            
            {hasLoggedToday ? (
              <View className="bg-white/40 rounded-3xl p-8 items-center shadow-sm">
                <View className="w-20 h-20 bg-[#D0F1EB] rounded-full items-center justify-center mb-4">
                  <Text className="text-4xl">✅</Text>
                </View>
                <Text 
                  variant="title3" 
                  className="text-[#5A4A3A] font-bold mb-2"
                >
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
                    <Text 
                      variant="title3" 
                      className="mr-2"
                    >
                      {moodEmojis[todayMood.mood]}
                    </Text>
                    <Text 
                      variant="subhead" 
                      className="text-[#5A4A3A]"
                    >
                      Today you felt {todayMood.mood}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-white/40 rounded-3xl p-6 shadow-sm">
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
                        className={`w-16 h-16 rounded-full border-2 items-center justify-center mb-2 ${
                          selectedMood === mood.id ? 'scale-110' : ''
                        }`}
                        style={{
                          backgroundColor: selectedMood === mood.id ? mood.color : 'white',
                          borderColor: selectedMood === mood.id ? mood.color : '#E5E7EB',
                        }}
                      >
                        <Text className="text-3xl">{mood.emoji}</Text>
                      </View>
                      <Text 
                        variant="caption1" 
                        className={`${
                          selectedMood === mood.id 
                            ? 'font-semibold' 
                            : 'text-gray-600'
                        }`}
                        style={{ color: selectedMood === mood.id ? mood.color : undefined }}
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
                    <Text 
                      variant="callout" 
                      className="text-white font-semibold"
                    >
                      {isSaving ? 'Saving...' : 'Save Mood'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Calendar History Section */}
          <View className="mb-8">
            <Text 
              variant="title3" 
              className="text-[#5A4A3A] font-bold mb-4"
            >
              📅 Mood History
            </Text>
            
            <View className="bg-white/40 rounded-3xl p-6 shadow-sm">
              {/* Month Navigation */}
              <View className="flex-row justify-between items-center mb-6">
                <Pressable
                  onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-3 bg-gray-100 rounded-xl"
                >
                  <Text 
                    variant="callout" 
                    className="text-[#5A4A3A]"
                  >←</Text>
                </Pressable>
                <Text 
                  variant="heading" 
                  className="text-[#5A4A3A] font-semibold"
                >
                  {format(currentMonth, 'MMMM yyyy')}
                </Text>
                <Pressable
                  onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-3 bg-gray-100 rounded-xl"
                >
                  <Text 
                    variant="callout" 
                    className="text-[#5A4A3A]"
                  >→</Text>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {paddingDays.map((_, index) => (
                  <View key={`padding-${index}`} style={{ width: '14.28%', height: 48 }} />
                ))}
                
                {days.map((day) => {
                  const mood = getMoodForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <Pressable
                      key={day.toISOString()}
                      onPress={() => setSelectedDate(day)}
                      style={{
                        width: '14.28%',
                        height: 48,
                        padding: 2,
                      }}
                    >
                      <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        backgroundColor: mood ? moodColors[mood.mood] : 
                                       isSelected ? '#E0F2FE' : 
                                       isToday ? '#F3F4F6' : 'transparent',
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: '#2196F3',
                      }}>
                        {mood ? (
                          <Text style={{ fontSize: 20 }}>{moodEmojis[mood.mood] || '😐'}</Text>
                        ) : (
                          <Text 
                            variant="subhead"
                            className={`${
                              isToday ? 'text-blue-500 font-semibold' : 
                              isSameMonth(day, currentMonth) ? 'text-gray-700' : 'text-gray-300'
                            }`}
                          >
                            {format(day, 'd')}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Selected Date Info */}
              {selectedDate && (
                <View style={{ 
                  marginTop: 20, 
                  padding: 16, 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: 16,
                }}>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text 
                            variant="title3" 
                            className="mr-2"
                          >
                            {moodEmojis[selectedMoodData.mood] || '😐'}
                          </Text>
                          <Text 
                            variant="body" 
                            className="text-[#5A4A3A]"
                          >
                            You felt {selectedMoodData.mood}
                          </Text>
                        </View>
                      );
                    } else {
                      return (
                        <Text 
                          variant="body" 
                          className="text-muted-foreground"
                        >
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
            <Text 
              variant="title3" 
              className="text-[#5A4A3A] font-bold mb-4"
            >
              📊 Insights
            </Text>
            
              {/* Stats Overview Cards */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1 bg-blue-50 rounded-2xl p-5 items-center">
                  <Text className="text-3xl mb-1">🔥</Text>
                  <Text 
                    variant="title2" 
                    className="text-[#1E40AF] font-bold"
                  >
                    {moodStats?.currentStreak || 0}
                  </Text>
                  <Text 
                    variant="caption1" 
                    className="text-[#1E40AF] opacity-80"
                  >
                    Day Streak
                  </Text>
                </View>

                <View style={{
                  flex: 1,
                  backgroundColor: '#D0F1EB',
                  borderRadius: 20,
                  padding: 20,
                  alignItems: 'center',
                }}>
                  <Text className="text-3xl mb-1">📊</Text>
                  <Text 
                    variant="title2" 
                    className="text-[#047857] font-bold"
                  >
                    {moodStats?.totalEntries || 0}
                  </Text>
                  <Text 
                    variant="caption1" 
                    className="text-[#047857] opacity-80"
                  >
                    Total Logs
                  </Text>
                </View>
              </View>

              {/* Mood Distribution */}
              <View className="bg-white/40 rounded-2xl p-5 shadow-sm">
                <Text 
                  variant="heading" 
                  className="text-[#5A4A3A] font-semibold mb-4"
                >
                  Mood Distribution
                </Text>
                
                {Object.entries(moodEmojis).map(([mood, emoji]) => {
                  const count = moodData?.filter(m => m.mood === mood).length || 0;
                  const percentage = moodData?.length ? (count / moodData.length) * 100 : 0;
                  
                  return (
                    <View key={mood} style={{ marginBottom: 12 }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        marginBottom: 4,
                      }}>
                        <Text style={{ fontSize: 20, width: 32 }}>{emoji}</Text>
                        <Text 
                          variant="subhead" 
                          className="text-[#5A4A3A] flex-1 ml-2"
                        >
                          {mood}
                        </Text>
                        <Text 
                          variant="subhead" 
                          className="text-[#6B7280] font-semibold"
                        >
                          {Math.round(percentage)}%
                        </Text>
                      </View>
                      <View style={{ 
                        height: 8, 
                        backgroundColor: '#F3F4F6',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}>
                        <View style={{
                          height: '100%',
                          backgroundColor: moodColors[mood] || '#7ED321',
                          borderRadius: 4,
                          width: `${percentage}%`,
                        }} />
                      </View>
                    </View>
                  );
                })}
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
                    <Text 
                      variant="heading" 
                      className="text-[#92400E] font-semibold"
                    >
                      {moodStats.mostCommonMood}
                    </Text>
                  </View>
                  <Text className="text-5xl">
                    {moodEmojis[moodStats.mostCommonMood] || '😐'}
                  </Text>
                </View>
              )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}




import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '~/lib/cn';
import * as Haptics from 'expo-haptics';

interface MoodEntry {
  date: Date;
  mood: string;
  emoji: string;
  color: string;
}

interface MoodCalendarProps {
  moodEntries: MoodEntry[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

const MOOD_COLORS = {
  'very-sad': '#94A3B8',
  'sad': '#64748B',
  'neutral': '#7ED321',
  'happy': '#4ADE80',
  'very-happy': '#22C55E',
};

export function MoodCalendar({ moodEntries, selectedDate, onDateSelect }: MoodCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days to start from Sunday
  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const getMoodForDate = (date: Date) => {
    return moodEntries.find(entry => isSameDay(entry.date, date));
  };

  const handlePreviousMonth = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptics error:', error);
    }
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptics error:', error);
    }
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <View className="bg-white/80 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Pressable onPress={handlePreviousMonth} className="p-2">
          <SymbolView name="chevron.left" size={20} tintColor="#6B7280" />
        </Pressable>
        
        <Text variant="title3">
          {format(currentDate, 'MMMM yyyy')}
        </Text>
        
        <Pressable onPress={handleNextMonth} className="p-2">
          <SymbolView name="chevron.right" size={20} tintColor="#6B7280" />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View className="flex-row mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text variant="muted" className="text-xs font-medium">
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {/* Padding days */}
        {paddingDays.map((_, index) => (
          <View key={`padding-${index}`} className="w-[14.28%] h-12" />
        ))}
        
        {/* Actual days */}
        {days.map((day) => {
          const mood = getMoodForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (error) {
                  console.warn('Haptics error:', error);
                }
                onDateSelect?.(day);
              }}
              className="w-[14.28%] h-12 p-1"
            >
              <View
                className={cn(
                  'flex-1 items-center justify-center rounded-lg',
                  isSelected && 'ring-2 ring-primary',
                  isToday && 'border border-primary'
                )}
                style={{
                  backgroundColor: mood ? mood.color + '20' : 'transparent',
                }}
              >
                {mood ? (
                  <Text className="text-lg">{mood.emoji}</Text>
                ) : (
                  <Text
                    variant={isToday ? 'body' : 'muted'}
                    className={cn(
                      'text-sm',
                      !isSameMonth(day, currentDate) && 'opacity-30'
                    )}
                  >
                    {format(day, 'd')}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View className="mt-6 pt-4 border-t border-border/50">
        <View className="flex-row justify-around">
          {Object.entries(MOOD_COLORS).map(([mood, color]) => (
            <View key={mood} className="items-center">
              <View
                className="w-4 h-4 rounded-full mb-1"
                style={{ backgroundColor: color }}
              />
              <Text variant="muted" className="text-xs">
                {mood.split('-')[0]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}



import React from 'react';
import { View, Dimensions } from 'react-native';
import { Text } from '~/components/ui/text';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { format } from 'date-fns';

interface MoodData {
  date: Date;
  mood: number; // 1-5 scale
  emoji: string;
}

interface MoodGraphProps {
  data: MoodData[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRAPH_WIDTH = SCREEN_WIDTH - 48;
const GRAPH_HEIGHT = 200;
const PADDING = 20;

export function MoodGraph({ data }: MoodGraphProps) {
  if (data.length === 0) {
    return (
      <View className="bg-white/80 rounded-2xl p-6 shadow-sm items-center justify-center h-[250px]">
        <Text variant="muted">No mood data yet</Text>
        <Text variant="muted" className="text-sm mt-2">
          Start tracking your mood to see trends
        </Text>
      </View>
    );
  }

  const maxValue = 5;
  const minValue = 1;
  const xStep = (GRAPH_WIDTH - PADDING * 2) / (data.length - 1 || 1);
  const yScale = (GRAPH_HEIGHT - PADDING * 2) / (maxValue - minValue);

  // Create path for the line
  const pathData = data
    .map((point, index) => {
      const x = PADDING + index * xStep;
      const y = GRAPH_HEIGHT - PADDING - (point.mood - minValue) * yScale;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Create gradient path (area under the curve)
  const areaData = `${pathData} L ${PADDING + (data.length - 1) * xStep} ${GRAPH_HEIGHT - PADDING} L ${PADDING} ${GRAPH_HEIGHT - PADDING} Z`;

  return (
    <View className="bg-white/80 rounded-2xl p-6 shadow-sm">
      <Text variant="heading" className="text-[#5A4A3A] font-semibold mb-4">
        Mood Trends
      </Text>
      
      <View className="mb-4">
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map((value) => {
            const y = GRAPH_HEIGHT - PADDING - (value - minValue) * yScale;
            return (
              <Line
                key={value}
                x1={PADDING}
                y1={y}
                x2={GRAPH_WIDTH - PADDING}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            );
          })}

          {/* Area gradient */}
          <Path
            d={areaData}
            fill="#4ADE80"
            fillOpacity="0.1"
          />

          {/* Line */}
          <Path
            d={pathData}
            stroke="#4ADE80"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = PADDING + index * xStep;
            const y = GRAPH_HEIGHT - PADDING - (point.mood - minValue) * yScale;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r="6"
                fill="#4ADE80"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* Date labels */}
          {data.map((point, index) => {
            if (index % Math.ceil(data.length / 5) === 0 || index === data.length - 1) {
              const x = PADDING + index * xStep;
              return (
                <SvgText
                  key={index}
                  x={x}
                  y={GRAPH_HEIGHT - 5}
                  fill="#9CA3AF"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {format(point.date, 'MMM d')}
                </SvgText>
              );
            }
            return null;
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View className="flex-row justify-between px-4">
        {['😢', '😔', '😐', '😊', '😄'].map((emoji, index) => (
          <View key={index} className="items-center">
            <Text className="text-sm">{emoji}</Text>
            <Text variant="muted" className="text-xs mt-1">
              {index + 1}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}



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

interface MoodSelectorProps {
  selectedMood?: string;
  onMoodSelect: (mood: Mood) => void;
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
        <Text className="text-2xl">{mood.emoji || '😐'}</Text>
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


