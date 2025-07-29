import React, { useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { Text } from '~/components/ui/text';
import { WeekView } from '~/components/mood/WeekView';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useMoodData, useTodayMood } from '~/hooks/useSharedData';
import { useTranslation } from '~/hooks/useTranslation';
import { format } from 'date-fns';
import { Calendar, BarChart3, Heart, Sparkles } from 'lucide-react-native';

const moodColors: Record<string, string> = {
  sad: '#B39DED',
  anxious: '#F472B6',
  neutral: '#FDE047',
  happy: '#34D399',
  angry: '#FB923C',
};

const renderMoodIcon = (moodId: string) => {
  const icons: Record<string, string> = {
    sad: '😢',
    anxious: '😰',
    neutral: '😐',
    happy: '😊',
    angry: '😠',
  };
  return icons[moodId] || '😐';
};

// Quick Action Card Component
function QuickActionCard({
  title,
  subtitle,
  icon,
  iconColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-2xl p-4 border border-gray-200 mx-1"
      style={({ pressed }) => ({
        backgroundColor: 'rgba(90, 74, 58, 0.08)',
        opacity: pressed ? 0.8 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      })}
    >
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: iconColor + '15' }}
      >
        {React.cloneElement(icon as React.ReactElement, {
          size: 20,
          color: iconColor,
        })}
      </View>
      <Text variant="body" className="text-[#5A4A3A] font-bold mb-1">
        {title}
      </Text>
      <Text variant="caption1" className="text-gray-600 leading-4">
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function MoodIndex() {
  const { t } = useTranslation();
  const moodData = useMoodData();
  const todayMood = useTodayMood();

  const hasLoggedToday = !!todayMood;

  // Navigation handlers
  const handleLogMood = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Medium);
    const today = format(new Date(), 'yyyy-MM-dd');
    router.push(`/tabs/mood/mood-entry/${today}`);
  }, []);

  const handleViewCalendar = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    const currentMonth = format(new Date(), 'yyyy-MM');
    router.push(`/tabs/mood/calendar/${currentMonth}`);
  }, []);

  const handleViewAnalytics = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/tabs/mood/analytics');
  }, []);

  const handleExerciseSuggestion = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/tabs/mood/exercise-suggestion');
  }, []);

  const screenTitle = useMemo(() => t('mood.title') || 'Mood', [t]);

  return (
    <DashboardLayout title={screenTitle}>
      {/* Week View Section */}
      <View className="mb-8" style={{ marginHorizontal: 6 }}>
        <WeekView moodData={moodData} />
      </View>

      {/* Today's Mood Status */}
      <View className="mb-8" style={{ marginHorizontal: 6 }}>
        {hasLoggedToday ? (
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
            <View className="flex-row items-center mb-4">
              <View className="mr-3">
                <Text style={{ fontSize: 28, color: '#10B981' }}>✓</Text>
              </View>
              <View className="flex-1">
                <Text
                  variant="body"
                  className="text-[#2D3748] font-bold"
                  style={{ fontSize: 16, letterSpacing: 0.3 }}
                >
                  Mood logged for today
                </Text>
                {todayMood && (
                  <View className="flex-row items-center mt-2">
                    <View
                      className="w-8 h-8 rounded-xl items-center justify-center mr-2"
                      style={{
                        backgroundColor: moodColors[todayMood.mood],
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>
                        {renderMoodIcon(todayMood.mood)}
                      </Text>
                    </View>
                    <Text
                      variant="caption1"
                      className="text-gray-600 capitalize font-medium"
                    >
                      Feeling {todayMood.mood} today
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {todayMood?.note && (
              <View className="bg-white rounded-xl p-3 border border-gray-100">
                <Text
                  variant="caption1"
                  className="text-gray-500 mb-1 font-medium"
                >
                  Your note
                </Text>
                <Text variant="body" className="text-[#5A4A3A] leading-5">
                  &ldquo;{todayMood.note}&rdquo;
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Pressable
            onPress={handleLogMood}
            className="rounded-3xl p-6 border border-gray-200"
            style={({ pressed }) => ({
              backgroundColor: 'rgba(90, 74, 58, 0.12)',
              opacity: pressed ? 0.8 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 4,
            })}
          >
            <View className="items-center">
              <View
                className="w-16 h-16 rounded-3xl items-center justify-center mb-4"
                style={{
                  backgroundColor: '#5A4A3A',
                  shadowColor: '#5A4A3A',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Heart size={24} color="white" fill="white" />
              </View>
              <Text
                variant="heading"
                className="text-[#2D3748] font-bold text-center mb-2"
                style={{ fontSize: 20, letterSpacing: 0.3 }}
              >
                How are you feeling today?
              </Text>
              <Text variant="body" className="text-gray-600 text-center">
                Tap to log your mood and track your wellness journey
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Quick Actions */}
      <View className="mb-8" style={{ marginHorizontal: 6 }}>
        <Text
          variant="title3"
          className="text-[#2D3748] font-bold mb-4"
          style={{ fontSize: 18, letterSpacing: 0.3 }}
        >
          Quick Actions
        </Text>

        <View className="flex-row mb-4">
          <QuickActionCard
            title="View Calendar"
            subtitle="See your mood history and patterns"
            icon={<Calendar />}
            iconColor="#3B82F6"
            onPress={handleViewCalendar}
          />
          <QuickActionCard
            title="Analytics"
            subtitle="Insights and mood distribution"
            icon={<BarChart3 />}
            iconColor="#8B5CF6"
            onPress={handleViewAnalytics}
          />
        </View>

        <View className="flex-row">
          <QuickActionCard
            title={hasLoggedToday ? 'Update Mood' : 'Log Mood'}
            subtitle={
              hasLoggedToday ? "Update today's entry" : 'Record how you feel'
            }
            icon={<Heart />}
            iconColor="#EF4444"
            onPress={handleLogMood}
          />
          <QuickActionCard
            title="Exercise Suggestion"
            subtitle="Get personalized wellness activities"
            icon={<Sparkles />}
            iconColor="#10B981"
            onPress={handleExerciseSuggestion}
          />
        </View>
      </View>

      {/* Stats Summary */}
      <View className="mb-8" style={{ marginHorizontal: 6, paddingBottom: 80 }}>
        <View
          className="rounded-2xl p-4 border border-gray-200"
          style={{
            backgroundColor: 'rgba(90, 74, 58, 0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text variant="body" className="text-[#5A4A3A] font-semibold mb-2">
            Your Progress
          </Text>
          <Text variant="caption1" className="text-gray-600 leading-5">
            You&apos;ve logged {moodData?.length || 0} mood{' '}
            {(moodData?.length || 0) === 1 ? 'entry' : 'entries'} so far. Keep
            tracking to better understand your patterns and improve your mental
            wellness.
          </Text>
        </View>
      </View>
    </DashboardLayout>
  );
}
