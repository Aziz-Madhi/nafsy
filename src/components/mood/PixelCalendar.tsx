import React, { useMemo, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColors } from '~/hooks/useColors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  startOfMonth,
  endOfMonth,
  format,
  isToday,
  isFuture,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';
import { mapMoodToRating } from '~/lib/mood-exercise-mapping';
import { LinearGradient } from 'expo-linear-gradient';
import { getMoodPixelStyle } from '~/lib/mood-colors';

interface MoodEntry {
  createdAt: string;
  mood?: 'sad' | 'anxious' | 'neutral' | 'happy' | 'angry';
  rating?: number;
}

interface PixelCalendarProps {
  moodData?: MoodEntry[];
  onPress?: () => void;
  currentDate?: Date;
}

export function PixelCalendar({
  moodData = [],
  onPress,
  currentDate = new Date(),
}: PixelCalendarProps) {
  const { t, i18n } = useTranslation();
  // Animation for entire calendar
  const opacity = useSharedValue(0);

  // Colors for React Native styling (need hex values)
  const colors = useColors();

  // Use static mood colors for calendar consistency
  // These should not change based on current mood selection
  const moodColors = useMemo(
    () => ({
      happy: colors.moodHappy,
      sad: colors.moodSad,
      anxious: colors.moodAnxious,
      neutral: colors.moodNeutral,
      angry: colors.moodAngry,
    }),
    [colors]
  );

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, [currentDate, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  // Get current month range with complete weeks
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get complete weeks (Sunday to Saturday)
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Get all days in the calendar view
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Create mood map for quick lookup with morning/evening separation
  const moodDataMap = useMemo(() => {
    const map = new Map<
      string,
      {
        mood?: MoodEntry['mood'];
        rating?: number;
        morning?: MoodEntry;
        evening?: MoodEntry;
      }
    >();

    moodData?.forEach((entry: any) => {
      const dateKey = format(new Date(entry.createdAt), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || {};
      const hour = new Date(entry.createdAt).getHours();
      const isMorning =
        entry.timeOfDay === 'morning' || (!entry.timeOfDay && hour < 12);

      if (isMorning) {
        existing.morning = entry;
      } else {
        existing.evening = entry;
      }

      // Keep latest mood for backward compatibility
      existing.mood = entry.mood;
      existing.rating = entry.rating;

      map.set(dateKey, existing);
    });
    return map;
  }, [moodData]);

  // Organize days into rows of 7 (standard calendar layout)
  const weekRows = useMemo(() => {
    const rows: Date[][] = [];
    let currentRow: Date[] = [];

    allDays.forEach((day, index) => {
      currentRow.push(day);
      if ((index + 1) % 7 === 0) {
        rows.push(currentRow);
        currentRow = [];
      }
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }, [allDays]);

  const getDayPixelStyle = (day: Date, isInMonth: boolean) => {
    // Days outside the current month should be transparent/invisible
    if (!isInMonth) {
      return { type: 'solid' as const, color: 'transparent' };
    }

    const dateKey = format(day, 'yyyy-MM-dd');
    const entry = moodDataMap.get(dateKey);

    if (entry && (entry.morning || entry.evening)) {
      return getMoodPixelStyle(
        entry.morning,
        entry.evening,
        colors,
        isToday(day)
      );
    }

    // No mood entry for this day - use very subtle background
    const isDarkMode = colors.background === '#0A1514';
    if (isFuture(day)) {
      return {
        type: 'solid' as const,
        color: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
      };
    }

    return {
      type: 'solid' as const,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    };
  };

  const handlePress = () => {
    if (onPress) {
      impactAsync(ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Fixed pixel size and gap
  const pixelSize = 38;
  const gap = 8;

  return (
    <Pressable onPress={handlePress} disabled={!onPress}>
      <View className="p-2">
        {/* Month Header */}
        <View className="mb-3 flex-row justify-between items-center">
          <Text
            variant="body"
            className="font-semibold text-foreground text-lg"
          >
            {format(currentDate, 'MMMM yyyy', {
              locale: i18n.language === 'ar' ? (ar as any) : (enUS as any),
            })}
          </Text>
          {onPress && (
            <Text variant="caption1" className="text-muted-foreground text-sm">
              {t('mood.calendar.tapToViewYear')}
            </Text>
          )}
        </View>

        {/* Calendar Grid Container - CENTERED */}
        <View className="items-center">
          <View>
            {/* Day Labels on Top */}
            <View className="flex-row mb-3" style={{ gap }}>
              {[
                t('mood.calendar.days.sun'),
                t('mood.calendar.days.mon'),
                t('mood.calendar.days.tue'),
                t('mood.calendar.days.wed'),
                t('mood.calendar.days.thu'),
                t('mood.calendar.days.fri'),
                t('mood.calendar.days.sat'),
              ].map((label, index) => (
                <View
                  key={index}
                  style={{
                    width: pixelSize,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    variant="caption1"
                    className="text-muted-foreground text-xs font-semibold"
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid - Rows */}
            <Animated.View style={[{ gap }, animatedStyle]}>
              {weekRows.map((week, weekIndex) => (
                <View key={weekIndex} className="flex-row" style={{ gap }}>
                  {week.map((day) => {
                    const isInMonth = day >= monthStart && day <= monthEnd;
                    const pixelStyle = getDayPixelStyle(day, isInMonth);
                    const isTodayDate = isToday(day);
                    const dateKey = format(day, 'yyyy-MM-dd');

                    return (
                      <View
                        key={dateKey}
                        style={{
                          width: pixelSize,
                          height: pixelSize,
                          borderRadius: 8,
                          borderWidth: isTodayDate ? 2 : 0,
                          borderColor: isTodayDate
                            ? colors.primary
                            : 'transparent',
                          backgroundColor:
                            pixelStyle.type === 'solid'
                              ? pixelStyle.color
                              : 'transparent',
                          overflow: 'hidden',
                        }}
                      >
                        {pixelStyle.type === 'gradient' &&
                          pixelStyle.colors && (
                            <LinearGradient
                              colors={pixelStyle.colors}
                              locations={pixelStyle.locations}
                              start={pixelStyle.start || { x: 0, y: 0 }}
                              end={pixelStyle.end || { x: 1, y: 0 }}
                              style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                              }}
                            />
                          )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </Animated.View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
