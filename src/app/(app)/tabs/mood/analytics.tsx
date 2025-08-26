import React, { useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useMoodData } from '~/hooks/useSharedData';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '~/hooks/useColors';
import { mapMoodToRating } from '~/lib/mood-exercise-mapping';
import { Frown, Zap, Minus, Smile, Flame } from 'lucide-react-native';
import { useTranslation } from '~/hooks/useTranslation';

interface MoodData {
  mood: string;
  count: number;
  percentage: number;
  color: string;
}

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
  const { t } = useTranslation();
  const barHeight = useSharedValue(percentage);
  const opacity = useSharedValue(1);

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
        className="bg-gray-100"
        style={{
          width: 44,
          height: 88,
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
          backgroundColor: color,
          borderRadius: 18,
          padding: 10,
          overflow: 'hidden',
        }}
      >
        {renderMoodIcon(mood, 20, '#1F2937')}
      </View>

      {/* Labels */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text variant="body" className="font-bold" style={{ color }}>
          {percentage.toFixed(0)}%
        </Text>
        <Text variant="muted" className="text-xs capitalize mt-1">
          {t(`mood.moods.${mood}`)}
        </Text>
        <Text variant="muted" className="text-xs">
          {count} {t('mood.analytics.entries', { count })}
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
            <Path
              d="M20 60 Q60 20 100 60 L100 70 Q60 30 20 70 Z"
              fill="url(#empty-gradient)"
              stroke="#D1D5DB"
              strokeWidth="1"
            />
          </Svg>
        </View>
        <Text variant="title3" className="text-gray-500 font-semibold mb-2">
          {t('mood.analytics.noDataYet')}
        </Text>
        <Text variant="body" className="text-center text-gray-400 max-w-xs">
          {t('mood.analytics.startLogging')}
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

export default function AnalyticsModal() {
  const { t } = useTranslation();
  const moodData = useMoodData();
  const colors = useColors();

  // Helper function to get mood color
  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy':
        return colors.moodHappy;
      case 'sad':
        return colors.moodSad;
      case 'anxious':
        return colors.moodAnxious;
      case 'neutral':
        return colors.moodNeutral;
      case 'angry':
        return colors.moodAngry;
      default:
        return colors.moodNeutral;
    }
  };

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Calculate mood distribution data with morning/evening separation
  const { chartData, morningData, eveningData } = useMemo(() => {
    const allData = ['sad', 'anxious', 'neutral', 'happy', 'angry'].map(
      (mood) => {
        const count = moodData?.filter((m) => m.mood === mood).length || 0;
        const percentage = moodData?.length
          ? (count / moodData.length) * 100
          : 0;

        return {
          mood,
          count,
          percentage,
          color: getMoodColor(mood),
        };
      }
    );

    // Separate morning and evening moods
    const morningMoods =
      moodData?.filter((m: any) => {
        const hour = new Date(m.createdAt).getHours();
        return m.timeOfDay === 'morning' || (!m.timeOfDay && hour < 12);
      }) || [];

    const eveningMoods =
      moodData?.filter((m: any) => {
        const hour = new Date(m.createdAt).getHours();
        return m.timeOfDay === 'evening' || (!m.timeOfDay && hour >= 12);
      }) || [];

    const morningStats = ['sad', 'anxious', 'neutral', 'happy', 'angry'].map(
      (mood) => {
        const count = morningMoods.filter((m) => m.mood === mood).length;
        const percentage = morningMoods.length
          ? (count / morningMoods.length) * 100
          : 0;
        return { mood, count, percentage, color: getMoodColor(mood) };
      }
    );

    const eveningStats = ['sad', 'anxious', 'neutral', 'happy', 'angry'].map(
      (mood) => {
        const count = eveningMoods.filter((m) => m.mood === mood).length;
        const percentage = eveningMoods.length
          ? (count / eveningMoods.length) * 100
          : 0;
        return { mood, count, percentage, color: getMoodColor(mood) };
      }
    );

    return {
      chartData: allData,
      morningData: morningStats,
      eveningData: eveningStats,
    };
  }, [moodData]);

  // Calculate summary stats
  const totalEntries = moodData?.length || 0;
  const mostFrequentMood = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((prev, current) =>
      current.count > prev.count ? current : prev
    );
  }, [chartData]);

  const averageMoodScore = useMemo(() => {
    if (!moodData?.length) return 0;
    const total = moodData.reduce((sum, entry) => {
      const rating = (entry as any).rating as number | undefined;
      if (typeof rating === 'number') return sum + rating;
      // Fallback from mood category
      return sum + mapMoodToRating(entry.mood);
    }, 0);
    return total / moodData.length; // 1-10 scale
  }, [moodData]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={handleBack} className="me-4">
          <SymbolView name="arrow.left" size={24} tintColor="#5A4A3A" />
        </Pressable>
        <Text variant="title2" className="text-[#2D3748] font-bold">
          {t('mood.analytics.title')}
        </Text>
      </View>

      <View className="flex-1 p-6">
        {/* Summary Stats */}
        <View className="flex-row mb-6">
          <View
            className="flex-1 rounded-2xl p-4 me-3 border border-gray-200"
            style={{
              backgroundColor: 'rgba(90, 74, 58, 0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text
              variant="title3"
              className="text-[#5A4A3A] font-bold text-center"
            >
              {totalEntries}
            </Text>
            <Text variant="caption1" className="text-gray-600 text-center mt-1">
              {t('mood.stats.totalEntries')}
            </Text>
          </View>

          <View
            className="flex-1 rounded-2xl p-4 ms-3 border border-gray-200"
            style={{
              backgroundColor: 'rgba(90, 74, 58, 0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text
              variant="title3"
              className="text-[#5A4A3A] font-bold text-center"
            >
              {averageMoodScore.toFixed(1)}/10
            </Text>
            <Text variant="caption1" className="text-gray-600 text-center mt-1">
              {t('mood.analytics.averageScore')}
            </Text>
          </View>
        </View>

        {/* Most Frequent Mood */}
        {mostFrequentMood && mostFrequentMood.count > 0 && (
          <View
            className="rounded-2xl p-4 mb-6 border border-gray-200"
            style={{
              backgroundColor: mostFrequentMood.color + '15',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center me-3"
                style={{
                  backgroundColor: mostFrequentMood.color + '20',
                  borderWidth: 2,
                  borderColor: mostFrequentMood.color,
                }}
              >
                <Text style={{ fontSize: 24 }}>
                  {renderMoodIcon(mostFrequentMood.mood, 24)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  variant="body"
                  className="text-[#5A4A3A] font-bold capitalize"
                >
                  {t('mood.analytics.mostFrequent')}:{' '}
                  {t(`mood.moods.${mostFrequentMood.mood}`)}
                </Text>
                <Text variant="caption1" className="text-gray-600 mt-1">
                  {t('mood.analytics.timeCount', {
                    count: mostFrequentMood.count,
                  })}{' '}
                  ({mostFrequentMood.percentage.toFixed(0)}%)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Mood Distribution Chart */}
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
            {t('mood.analytics.distribution')}
          </Text>

          <SimpleMoodVisualization data={chartData} />

          {/* Morning vs Evening Comparison */}
          {moodData && moodData.length > 0 && (
            <View className="mt-6 pt-6 border-t border-gray-200">
              <Text
                variant="body"
                className="text-[#5A4A3A] font-semibold mb-4"
              >
                {t('mood.analytics.morningVsEvening')}
              </Text>
              <View className="flex-row justify-between">
                <View className="flex-1 mr-2">
                  <Text
                    variant="caption1"
                    className="text-center text-gray-600 mb-2"
                  >
                    🌅 {t('mood.morning')}
                  </Text>
                  <View className="bg-gray-50 rounded-xl p-3">
                    {morningData
                      .filter((m) => m.count > 0)
                      .slice(0, 2)
                      .map((item) => (
                        <View
                          key={item.mood}
                          className="flex-row justify-between items-center mb-1"
                        >
                          <Text variant="caption1" className="capitalize">
                            {t(`mood.moods.${item.mood}`)}
                          </Text>
                          <Text
                            variant="caption1"
                            style={{ color: item.color }}
                          >
                            {item.percentage.toFixed(0)}%
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <Text
                    variant="caption1"
                    className="text-center text-gray-600 mb-2"
                  >
                    🌙 {t('mood.evening')}
                  </Text>
                  <View className="bg-gray-50 rounded-xl p-3">
                    {eveningData
                      .filter((m) => m.count > 0)
                      .slice(0, 2)
                      .map((item) => (
                        <View
                          key={item.mood}
                          className="flex-row justify-between items-center mb-1"
                        >
                          <Text variant="caption1" className="capitalize">
                            {t(`mood.moods.${item.mood}`)}
                          </Text>
                          <Text
                            variant="caption1"
                            style={{ color: item.color }}
                          >
                            {item.percentage.toFixed(0)}%
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {totalEntries > 0 && (
            <View className="mt-6 pt-4 border-t border-gray-200">
              <Text variant="caption1" className="text-center text-gray-600">
                {t('mood.analytics.basedOn', { count: totalEntries })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
