import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
// import { MoodSelector, MoodGraph, MoodCalendar } from '~/components/mood';
import { SafeMoodSelector } from '~/components/mood/SafeMoodSelector';
import { MoodGraph, MoodCalendar } from '~/components/mood';
import { Button } from '~/components/ui/button';
import { Calendar, BarChart3 } from 'lucide-react-native';
import { cn } from '~/lib/cn';
// import Animated, { FadeInDown } from 'react-native-reanimated';
import { safeHaptics } from '~/lib/haptics';
import { subDays } from 'date-fns';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

type ViewMode = 'graph' | 'calendar';

function MoodScreen() {
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('graph');

  // Show loading state if Clerk hasn't loaded yet
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">Please sign in to continue</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Convex hooks
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : 'skip'
  );
  const createMood = useMutation(api.moods.createMood);
  const todayMood = useQuery(
    api.moods.getTodayMood,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  const moodData = useQuery(
    api.moods.getMoods,
    currentUser ? { userId: currentUser._id, limit: 30 } : 'skip'
  );
  const moodStats = useQuery(
    api.moods.getMoodStats,
    currentUser ? { userId: currentUser._id, days: 7 } : 'skip'
  );

  // Transform Convex mood data for graph
  const graphMoodData = moodData?.map(mood => {
    const moodValues: Record<string, number> = {
      'sad': 2,
      'anxious': 2,
      'neutral': 3,
      'happy': 4,
      'angry': 2,
    };
    const moodEmojis: Record<string, string> = {
      'sad': '😔',
      'anxious': '😟',
      'neutral': '😐',
      'happy': '😊',
      'angry': '😠',
    };
    
    return {
      date: new Date(mood.createdAt),
      mood: moodValues[mood.mood] || 3,
      emoji: moodEmojis[mood.mood] || '😐',
    };
  }).reverse() || [];

  // Transform for calendar
  const calendarMoodData = moodData?.map(mood => {
    const moodColors: Record<string, string> = {
      'sad': '#64748B',
      'anxious': '#94A3B8',
      'neutral': '#7ED321',
      'happy': '#4ADE80',
      'angry': '#EF4444',
    };
    const moodEmojis: Record<string, string> = {
      'sad': '😔',
      'anxious': '😟',
      'neutral': '😐',
      'happy': '😊',
      'angry': '😠',
    };
    
    return {
      date: new Date(mood.createdAt),
      mood: mood.mood,
      emoji: moodEmojis[mood.mood] || '😐',
      color: moodColors[mood.mood] || '#7ED321',
    };
  }) || [];

  const hasLoggedToday = !!todayMood;

  const handleMoodSelect = (mood: any) => {
    setSelectedMood(mood.id);
    safeHaptics.selection();
  };

  const handleLogMood = async () => {
    if (selectedMood && currentUser) {
      const moodMap: Record<string, any> = {
        'very-sad': 'sad',
        'sad': 'sad',
        'neutral': 'neutral',
        'happy': 'happy',
        'very-happy': 'happy',
      };
      
      await createMood({
        userId: currentUser._id,
        mood: moodMap[selectedMood] || 'neutral',
      });
      
      setSelectedMood('');
      safeHaptics.notification();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text variant="title1" className="mb-2">
            Mood Tracking
          </Text>
          <Text variant="muted">
            Monitor your emotional well-being over time
          </Text>
        </View>

        {/* Mood Check-in */}
        {!hasLoggedToday && (
          <View className="px-6 mt-6">
            <SafeMoodSelector
              selectedMood={selectedMood}
              onMoodSelect={handleMoodSelect}
            />
            
            {selectedMood && (
              <View className="mt-4">
                <Button
                  onPress={handleLogMood}
                  className="w-full"
                >
                  <Text>Log Mood</Text>
                </Button>
              </View>
            )}
          </View>
        )}

        {/* Success Message */}
        {hasLoggedToday && (
          <View className="mx-6 mt-6 bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">✅</Text>
              <View className="flex-1">
                <Text variant="body" className="font-medium text-green-800 dark:text-green-200">
                  Mood logged successfully!
                </Text>
                <Text variant="muted" className="text-green-700 dark:text-green-300 mt-1">
                  Great job tracking your emotions today
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* View Toggle */}
        <View className="flex-row px-6 mt-6 mb-4">
          <Pressable
            onPress={() => setViewMode('graph')}
            className={cn(
              'flex-1 flex-row items-center justify-center py-3 rounded-l-xl',
              viewMode === 'graph'
                ? 'bg-primary'
                : 'bg-secondary/20'
            )}
          >
            <BarChart3
              size={20}
              className={cn(
                'mr-2',
                viewMode === 'graph'
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            />
            <Text
              variant="body"
              className={cn(
                viewMode === 'graph'
                  ? 'text-primary-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              Graph
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setViewMode('calendar')}
            className={cn(
              'flex-1 flex-row items-center justify-center py-3 rounded-r-xl',
              viewMode === 'calendar'
                ? 'bg-primary'
                : 'bg-secondary/20'
            )}
          >
            <Calendar
              size={20}
              className={cn(
                'mr-2',
                viewMode === 'calendar'
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            />
            <Text
              variant="body"
              className={cn(
                viewMode === 'calendar'
                  ? 'text-primary-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              Calendar
            </Text>
          </Pressable>
        </View>

        {/* Mood Visualization */}
        <View className="px-6 pb-6">
          {viewMode === 'graph' ? (
            <MoodGraph data={graphMoodData} />
          ) : (
            <MoodCalendar moodEntries={calendarMoodData} />
          )}
        </View>

        {/* Insights */}
        <View className="mx-6 mb-6 bg-primary/5 dark:bg-primary/10 rounded-2xl p-6">
          <Text variant="title3" className="mb-3">
            Weekly Insights
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <Text className="text-lg mr-2">📈</Text>
              <Text variant="body">
                {moodStats?.totalEntries || 0} mood entries this week
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-lg mr-2">😊</Text>
              <Text variant="body">
                Most common mood: {moodStats?.mostCommonMood || 'N/A'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-lg mr-2">🎯</Text>
              <Text variant="body">
                {moodStats?.currentStreak || 0}-day streak! Keep it up!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default MoodScreen;