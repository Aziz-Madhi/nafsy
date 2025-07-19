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