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
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';

interface MoodEntry {
  createdAt: string;
  mood: 'sad' | 'anxious' | 'neutral' | 'happy' | 'angry';
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
  const { t } = useTranslation();
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

  // Create mood map for quick lookup
  const moodDataMap = useMemo(() => {
    const map = new Map<string, string>();
    moodData?.forEach((entry) => {
      const dateKey = format(new Date(entry.createdAt), 'yyyy-MM-dd');
      map.set(dateKey, entry.mood);
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

  const getDayColor = (day: Date, isInMonth: boolean) => {
    // Days outside the current month should be transparent/invisible
    if (!isInMonth) {
      return 'transparent';
    }

    const dateKey = format(day, 'yyyy-MM-dd');
    const mood = moodDataMap.get(dateKey) as
      | keyof typeof moodColors
      | undefined;

    // If there's a mood, use the EXACT mood color
    if (mood && moodColors[mood]) {
      return moodColors[mood];
    }

    // No mood entry for this day - use very subtle background
    const isDarkMode = colors.background === '#0A1514';
    if (isFuture(day)) {
      return isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)';
    }

    return isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
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
            {format(currentDate, 'MMMM yyyy')}
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
                    const color = getDayColor(day, isInMonth);
                    const isTodayDate = isToday(day);
                    const dateKey = format(day, 'yyyy-MM-dd');

                    return (
                      <View
                        key={dateKey}
                        style={{
                          width: pixelSize,
                          height: pixelSize,
                          backgroundColor: color,
                          borderRadius: 8,
                          borderWidth: isTodayDate ? 2 : 0,
                          borderColor: isTodayDate
                            ? colors.primary
                            : 'transparent',
                        }}
                      />
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
