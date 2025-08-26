import React, { useState, useCallback, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useMoodData } from '~/hooks/useSharedData';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '~/lib/cn';
import { useColors } from '~/hooks/useColors';
import { mapMoodToRating } from '~/lib/mood-exercise-mapping';
import { LinearGradient } from 'expo-linear-gradient';
import { getMoodPixelStyle } from '~/lib/mood-colors';
import { Frown, Zap, Minus, Smile, Flame } from 'lucide-react-native';
import { useTranslation } from '~/hooks/useTranslation';

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

export default function CalendarModal() {
  const { t } = useTranslation();
  const { month: monthParam } = useLocalSearchParams<{ month: string }>();
  const moodData = useMoodData();
  const colors = useColors();

  // Unified color: derive from rating (1–10), fallback to legacy mood mapping
  const getEntryColor = (entry: any): string => {
    if (!entry) return colors.muted;
    const rating =
      entry.rating ?? (entry.mood ? mapMoodToRating(entry.mood) : undefined);
    if (rating) {
      const clamped = Math.max(1, Math.min(10, Math.round(rating)));
      const key = `ratingScale${clamped}` as keyof typeof colors;
      return colors[key] as string;
    }
    // Fallback to legacy mood colors
    switch (entry.mood) {
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

  // Parse month from URL parameter (format: YYYY-MM)
  const currentMonth = useMemo(() => {
    if (monthParam) {
      return parseISO(`${monthParam}-01`);
    }
    return new Date();
  }, [monthParam]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Navigation handlers
  const handlePreviousMonth = useCallback(() => {
    const prevMonth = subMonths(currentMonth, 1);
    const monthString = format(prevMonth, 'yyyy-MM');
    router.push(`/tabs/mood/calendar/${monthString}`);
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    const nextMonth = addMonths(currentMonth, 1);
    const monthString = format(nextMonth, 'yyyy-MM');
    router.push(`/tabs/mood/calendar/${monthString}`);
  }, [currentMonth]);

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const getMoodsForDate = useCallback(
    (date: Date) => {
      const dayMoods =
        moodData?.filter((mood) => isSameDay(new Date(mood.createdAt), date)) ||
        [];

      const morningMood = dayMoods.find(
        (m: any) =>
          m.timeOfDay === 'morning' ||
          (!m.timeOfDay && new Date(m.createdAt).getHours() < 12)
      );
      const eveningMood = dayMoods.find(
        (m: any) =>
          m.timeOfDay === 'evening' ||
          (!m.timeOfDay &&
            new Date(m.createdAt).getHours() >= 12 &&
            m !== morningMood)
      );

      return {
        any: dayMoods.length > 0 ? dayMoods[dayMoods.length - 1] : undefined,
        morning: morningMood,
        evening: eveningMood,
      };
    },
    [moodData]
  );

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

      const moods = getMoodsForDate(item.date);
      const isToday = isSameDay(item.date, new Date());
      const isSelected = selectedDate && isSameDay(item.date, selectedDate);

      const pixelStyle = getMoodPixelStyle(
        moods.morning as any,
        moods.evening as any,
        colors,
        isToday
      );

      return (
        <Pressable
          onPress={() => {
            impactAsync(ImpactFeedbackStyle.Light);
            setSelectedDate(item.date);
          }}
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
              backgroundColor: moods.any
                ? pixelStyle.type === 'solid'
                  ? pixelStyle.color
                  : 'transparent'
                : isSelected
                  ? '#E0F2FE'
                  : isToday
                    ? '#F3F4F6'
                    : 'transparent',
              borderWidth: moods.any ? 2 : isSelected ? 2 : 0,
              borderColor: moods.any
                ? pixelStyle.type === 'solid'
                  ? pixelStyle.color
                  : colors.primary
                : colors.primary,
              shadowColor: moods.any ? colors.primary : '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: moods.any ? 0.2 : 0,
              shadowRadius: 2,
              elevation: moods.any ? 2 : 0,
              overflow: 'hidden',
            }}
          >
            {pixelStyle.type === 'gradient' && pixelStyle.colors && (
              <LinearGradient
                colors={pixelStyle.colors as [string, string, ...string[]]}
                locations={
                  pixelStyle.locations as [number, number, ...number[]]
                }
                start={pixelStyle.start || { x: 0, y: 0 }}
                end={pixelStyle.end || { x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                }}
              />
            )}
            {moods.any ? (
              moods.morning &&
              moods.evening &&
              moods.morning.mood &&
              moods.evening.mood ? (
                // Show both icons for dual moods - side by side
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderMoodIcon(moods.morning.mood, 14, colors.foreground)}
                  {renderMoodIcon(moods.evening.mood, 14, colors.foreground)}
                </View>
              ) : moods.any?.mood ? (
                renderMoodIcon(moods.any.mood, 20, colors.foreground)
              ) : null
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
    [selectedDate, setSelectedDate, getMoodsForDate, colors]
  );

  const keyExtractor = useCallback((item: any) => item.id, []);
  const getItemType = useCallback((item: any) => item.type, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={handleBack} className="me-4">
          <SymbolView name="arrow.left" size={24} tintColor="#5A4A3A" />
        </Pressable>
        <Text variant="title2" className="text-[#2D3748] font-bold">
          {t('mood.calendar.title')}
        </Text>
      </View>

      <View className="flex-1 p-6">
        <View
          className="rounded-3xl p-6 border border-gray-200"
          style={{
            backgroundColor: colors.card,
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
              onPress={handlePreviousMonth}
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
              onPress={handleNextMonth}
              className="p-3 bg-gray-100 rounded-xl"
            >
              <Text variant="callout" className="text-[#5A4A3A]">
                →
              </Text>
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            {[
              t('mood.calendar.days.sun'),
              t('mood.calendar.days.mon'),
              t('mood.calendar.days.tue'),
              t('mood.calendar.days.wed'),
              t('mood.calendar.days.thu'),
              t('mood.calendar.days.fri'),
              t('mood.calendar.days.sat'),
            ].map((day, index) => (
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
                backgroundColor: colors.muted,
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
                const selectedMoods = getMoodsForDate(selectedDate);
                const selectedMoodData = selectedMoods.any;
                if (selectedMoodData) {
                  // Check if we have both morning and evening moods with valid mood values
                  const hasBothMoods =
                    selectedMoods.morning?.mood && selectedMoods.evening?.mood;

                  return (
                    <View>
                      {hasBothMoods ? (
                        // Show both morning and evening moods
                        <>
                          <View style={{ marginBottom: 16 }}>
                            <Text
                              variant="caption1"
                              className="text-gray-500 mb-2 font-medium"
                            >
                              🌅 {t('mood.morning')}
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 8,
                              }}
                            >
                              <View
                                className="w-12 h-12 rounded-2xl items-center justify-center me-3 overflow-hidden"
                                style={{
                                  backgroundColor: getEntryColor(
                                    selectedMoods.morning
                                  ),
                                }}
                              >
                                {selectedMoods.morning?.mood &&
                                  renderMoodIcon(
                                    selectedMoods.morning.mood,
                                    22,
                                    colors.foreground
                                  )}
                              </View>
                              <Text
                                variant="body"
                                className="text-[#5A4A3A] capitalize font-medium"
                              >
                                {selectedMoods.morning?.mood &&
                                  t(`mood.moods.${selectedMoods.morning.mood}`)}
                              </Text>
                            </View>
                            {selectedMoods.morning?.note && (
                              <Text
                                variant="caption1"
                                className="text-gray-600 italic"
                              >
                                {`"${selectedMoods.morning.note}"`}
                              </Text>
                            )}
                          </View>

                          <View>
                            <Text
                              variant="caption1"
                              className="text-gray-500 mb-2 font-medium"
                            >
                              🌙 {t('mood.evening')}
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 8,
                              }}
                            >
                              <View
                                className="w-12 h-12 rounded-2xl items-center justify-center me-3 overflow-hidden"
                                style={{
                                  backgroundColor: getEntryColor(
                                    selectedMoods.evening
                                  ),
                                }}
                              >
                                {selectedMoods.evening?.mood &&
                                  renderMoodIcon(
                                    selectedMoods.evening.mood,
                                    22,
                                    colors.foreground
                                  )}
                              </View>
                              <Text
                                variant="body"
                                className="text-[#5A4A3A] capitalize font-medium"
                              >
                                {selectedMoods.evening?.mood &&
                                  t(`mood.moods.${selectedMoods.evening.mood}`)}
                              </Text>
                            </View>
                            {selectedMoods.evening?.note && (
                              <Text
                                variant="caption1"
                                className="text-gray-600 italic"
                              >
                                {`"${selectedMoods.evening.note}"`}
                              </Text>
                            )}
                          </View>
                        </>
                      ) : (
                        // Show single mood (morning or evening)
                        <>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginBottom: 12,
                            }}
                          >
                            <View
                              className="w-12 h-12 rounded-2xl items-center justify-center me-3 overflow-hidden"
                              style={{
                                backgroundColor:
                                  getEntryColor(selectedMoodData),
                              }}
                            >
                              {selectedMoodData.mood &&
                                renderMoodIcon(
                                  selectedMoodData.mood,
                                  22,
                                  colors.foreground
                                )}
                            </View>
                            <Text
                              variant="body"
                              className="text-[#5A4A3A] capitalize font-medium"
                            >
                              {t('mood.feeling')}{' '}
                              {selectedMoodData.mood &&
                                t(`mood.moods.${selectedMoodData.mood}`)}
                            </Text>
                          </View>
                          {selectedMoodData.note && (
                            <View className="bg-white rounded-xl p-3 border border-gray-100">
                              <Text
                                variant="caption1"
                                className="text-gray-500 mb-1 font-medium"
                              >
                                {t('mood.note')}
                              </Text>
                              <Text
                                variant="body"
                                className="text-[#5A4A3A] leading-5"
                              >
                                {selectedMoodData.note}
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  );
                } else {
                  return (
                    <Text variant="body" className="text-muted-foreground">
                      {t('mood.calendar.noMoodLogged')}
                    </Text>
                  );
                }
              })()}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
