import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  Dimensions,
  InteractionManager,
  ScrollView,
} from 'react-native';
import { Text } from '~/components/ui/text';
import { useColors } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { format, isToday, isFuture, endOfMonth, getDayOfYear } from 'date-fns';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '~/hooks/useTranslation';
import { mapMoodToRating } from '~/lib/mood-exercise-mapping';
import { LinearGradient } from 'expo-linear-gradient';
import { getMoodPixelStyle } from '~/lib/mood-colors';

interface MoodEntry {
  createdAt: string;
  mood?: 'sad' | 'anxious' | 'neutral' | 'happy' | 'angry';
  rating?: number;
  timeOfDay?: 'morning' | 'evening';
}

interface FullYearPixelCalendarProps {
  moodData?: MoodEntry[];
  year?: number;
}

export function FullYearPixelCalendar({
  moodData = [],
  year = new Date().getFullYear(),
}: FullYearPixelCalendarProps) {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const currentYear = year;
  // const yearEnd = endOfYear(new Date(currentYear, 0, 1));

  // Colors for React Native styling
  const colors = useColors();
  const isDarkMode = colors.background === '#0A1514';

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

  // Calculate days left in the year (not currently displayed)
  // const daysLeft =
  //   today.getFullYear() === currentYear
  //     ? Math.max(0, differenceInDays(yearEnd, today))
  //     : 0;

  // State for progressive rendering
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const opacity = useSharedValue(0);

  // Get screen width
  const { width: screenWidth } = Dimensions.get('window');

  // Calculate optimal layout
  const COLUMNS = 14; // 14 columns for balanced layout
  const HORIZONTAL_PADDING = 32; // Side padding (16px each side)
  const GAP = 4; // More spacing between pixels

  // Calculate pixel size based on screen width
  const availableWidth = screenWidth - HORIZONTAL_PADDING;
  const pixelSize = Math.floor(
    (availableWidth - GAP * (COLUMNS - 1)) / COLUMNS
  );

  // const totalDays = getDaysInYear(new Date(currentYear, 0, 1));
  // const ROWS = Math.ceil(totalDays / COLUMNS);

  // Progressive rendering effect
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
      opacity.value = withTiming(1, { duration: 300 });
    });

    return () => interaction.cancel();
  }, [opacity]);

  // Scroll to current month after render
  const [shouldScroll, setShouldScroll] = useState(false);

  // Calculate initial scroll position to open directly on current month
  const initialScrollOffset = useMemo(() => {
    if (today.getFullYear() !== currentYear) return 0;

    const currentMonth = today.getMonth();
    let yOffset = 0;

    // Add height of introduction section
    yOffset += 100; // Approximate height of intro context

    // Calculate height of months before current month
    for (let monthIndex = 0; monthIndex < currentMonth; monthIndex++) {
      const monthStart = new Date(currentYear, monthIndex, 1);
      const monthEnd = endOfMonth(monthStart);
      const daysInMonth = monthEnd.getDate();

      // Month label height + margin
      yOffset += monthIndex === 0 ? 17 : 29; // First month has less margin

      // Calculate rows for this month
      const totalPixelsNeeded = Math.ceil(daysInMonth / COLUMNS) * COLUMNS;
      const monthRows = Math.ceil(totalPixelsNeeded / COLUMNS);

      // Add height of month rows (pixel size + gap)
      yOffset += monthRows * (pixelSize + GAP);
    }

    return yOffset;
  }, [currentYear, pixelSize, GAP, COLUMNS, today]);

  useEffect(() => {
    if (!isReady) return;
    if (today.getFullYear() === currentYear) {
      setShouldScroll(true);
    }
  }, [isReady, today, currentYear]);

  useEffect(() => {
    if (!shouldScroll || !scrollViewRef.current) return;
    scrollViewRef.current?.scrollTo({
      y: initialScrollOffset,
      animated: false,
    });
    setShouldScroll(false);
  }, [shouldScroll, initialScrollOffset]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Create mood data map for quick lookup with morning/evening separation
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

  // Generate year grid organized by months
  const yearGrid = useMemo(() => {
    const monthNames = [
      t('mood.calendar.months.jan'),
      t('mood.calendar.months.feb'),
      t('mood.calendar.months.mar'),
      t('mood.calendar.months.apr'),
      t('mood.calendar.months.may'),
      t('mood.calendar.months.jun'),
      t('mood.calendar.months.jul'),
      t('mood.calendar.months.aug'),
      t('mood.calendar.months.sep'),
      t('mood.calendar.months.oct'),
      t('mood.calendar.months.nov'),
      t('mood.calendar.months.dec'),
    ];
    const currentMonth =
      today.getFullYear() === currentYear ? today.getMonth() : -1;
    const allRows = [];

    // Process each month separately
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthStart = new Date(currentYear, monthIndex, 1);
      const monthEnd = endOfMonth(monthStart);
      const daysInMonth = monthEnd.getDate();
      const monthDays = [];

      // Create all days for this month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(currentYear, monthIndex, day);
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const rec = moodDataMap.get(dateKey);
        const mood = rec?.mood;

        monthDays.push({
          date: currentDate,
          dateKey,
          mood,
          isToday: isToday(currentDate),
          isFuture: isFuture(currentDate),
          month: monthIndex,
          dayOfMonth: day,
          dayOfYear: getDayOfYear(currentDate),
          isReal: true, // Mark as real day
        });
      }

      // Calculate how many filler pixels we need to complete the rows
      const totalPixelsNeeded = Math.ceil(monthDays.length / COLUMNS) * COLUMNS;
      const fillersNeeded = totalPixelsNeeded - monthDays.length;

      // Add filler pixels
      for (let i = 0; i < fillersNeeded; i++) {
        monthDays.push({
          date: null,
          dateKey: `filler-${monthIndex}-${i}`,
          mood: null,
          isToday: false,
          isFuture: false,
          month: monthIndex,
          dayOfMonth: 0,
          dayOfYear: 0,
          isReal: false, // Mark as filler
        });
      }

      // Organize month days into rows
      const monthRows = [];
      for (let i = 0; i < monthDays.length; i += COLUMNS) {
        const row = monthDays.slice(i, i + COLUMNS);
        // Add month label to the first row of each month
        if (i === 0) {
          monthRows.push({
            monthLabel: monthNames[monthIndex],
            days: row,
            isMonthStart: true,
            isCurrentMonth: monthIndex === currentMonth,
          });
        } else {
          monthRows.push({
            monthLabel: null,
            days: row,
            isMonthStart: false,
            isCurrentMonth: monthIndex === currentMonth,
          });
        }
      }

      allRows.push(...monthRows);
    }

    return allRows;
  }, [currentYear, moodDataMap, today]);

  // Get pixel style for a day (solid color or gradient)
  const getDayPixelStyle = (day: any) => {
    // If it's a filler day (not a real date), make it transparent
    if (!day.isReal) {
      return { type: 'solid' as const, color: 'transparent' };
    }

    const entry = moodDataMap.get(day.dateKey);

    if (entry && (entry.morning || entry.evening)) {
      return getMoodPixelStyle(entry.morning, entry.evening, colors, day.isToday);
    }

    // No mood entry for this day - use very subtle background
    if (day.isFuture) {
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

  // Get color for a day (backward compatibility)
  const getDayColor = (day: any) => {
    const pixelStyle = getDayPixelStyle(day);
    return pixelStyle.type === 'solid' ? pixelStyle.color : colors.moodNeutral;
  };

  // Handle touch on the grid container
  const handleGridPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    // Calculate which pixel was pressed (no offset needed now)
    const column = Math.floor(locationX / (pixelSize + GAP));

    // Find which row was clicked based on Y position
    // Account for month labels and variable spacing
    let accumulatedHeight = 0;
    let clickedRowIndex = -1;

    for (let i = 0; i < yearGrid.length; i++) {
      // Add height for month label if it's a month start
      if (yearGrid[i].isMonthStart) {
        accumulatedHeight += i === 0 ? 17 : 29; // Label height + margins
      }

      const rowHeight = pixelSize + GAP;
      if (
        locationY >= accumulatedHeight &&
        locationY < accumulatedHeight + rowHeight
      ) {
        clickedRowIndex = i;
        break;
      }
      accumulatedHeight += rowHeight;
    }

    // Validate bounds and get the day
    if (clickedRowIndex >= 0 && column >= 0 && column < COLUMNS) {
      const day = yearGrid[clickedRowIndex]?.days[column];
      if (day && day.isReal && !day.isFuture) {
        // Day press disabled - mood entry modal removed
        // Can be re-enabled with different functionality later
        impactAsync(ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleBack = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Minimal Header */}
      <View
        className="px-4"
        style={{ backgroundColor: colors.background, paddingVertical: 2 }}
      >
        <View
          style={{
            position: 'relative',
            minHeight: 44,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <Pressable
            onPress={handleBack}
            className="flex-row items-center"
            style={{
              minHeight: 44,
              minWidth: 44,
              paddingHorizontal: 8,
              paddingVertical: 8,
              marginLeft: -8, // Extend touch area to edge
              zIndex: 1,
            }}
          >
            <ChevronLeft size={20} color={colors.foreground} />
            <Text
              variant="body"
              style={{
                color: withOpacity(colors.foreground, 0.85),
                fontSize: 18,
                marginLeft: 2,
              }}
            >
              {t('common.back')}
            </Text>
          </Pressable>

          <Text
            variant="title2"
            style={{
              color: colors.foreground,
              fontSize: 24,
              fontWeight: '700',
              letterSpacing: -0.2,
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
            }}
          >
            {currentYear}
          </Text>
        </View>
      </View>

      {/* Main Grid Container with ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 0 }}
      >
        <View className="px-4">
          {/* Introduction Context */}
          <View style={{ marginBottom: 20, marginTop: 0 }}>
            {/* Subtitle */}
            <Text
              variant="body"
              style={{
                fontSize: 15,
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: 16,
                letterSpacing: 0.1,
                color: withOpacity(colors.foreground, 0.85),
              }}
            >
              {t('mood.yearView.subtitle')}
            </Text>

            {/* Description */}
            <Text
              variant="caption1"
              style={{
                fontSize: 13,
                lineHeight: 19,
                textAlign: 'center',
                paddingHorizontal: 20,
                fontWeight: '400',
                color: withOpacity(colors.foreground, 0.75),
              }}
            >
              {t('mood.yearView.description')}
            </Text>
          </View>

          {!isReady ? (
            // Loading placeholder
            <View className="items-center justify-center py-20 bg-transparent">
              <Text variant="caption1" className="text-muted-foreground">
                {t('mood.calendar.loading')}
              </Text>
            </View>
          ) : (
            // Optimized grid with month organization
            <Animated.View style={animatedContainerStyle}>
              <Pressable onPress={handleGridPress} ref={containerRef}>
                {(() => {
                  const result: React.ReactNode[] = [];
                  const currentMonthRows: { row: any; rowIndex: number }[] = [];

                  // First pass: collect all current month rows
                  yearGrid.forEach((row, rowIndex) => {
                    if (row.isCurrentMonth) {
                      currentMonthRows.push({ row, rowIndex });
                    }
                  });

                  // Second pass: render everything
                  let currentMonthRendered = false;

                  yearGrid.forEach((row, rowIndex) => {
                    const isMonthStart = row.isMonthStart;
                    const isCurrentMonth = row.isCurrentMonth;

                    // If this is current month start and we haven't rendered the container yet
                    if (
                      isCurrentMonth &&
                      isMonthStart &&
                      !currentMonthRendered
                    ) {
                      currentMonthRendered = true;

                      // Render current month container with ALL current month rows
                      result.push(
                        <View
                          key={`current-month-container`}
                          style={{
                            borderRadius: 16,
                            padding: 12,
                            marginHorizontal: -4,
                            marginVertical: 6,
                            backgroundColor: isDarkMode
                              ? 'rgba(255, 255, 255, 0.06)'
                              : 'rgba(0, 0, 0, 0.03)',
                          }}
                        >
                          {currentMonthRows.map(
                            ({ row: monthRow, rowIndex: monthRowIndex }) => (
                              <View key={`month-row-${monthRowIndex}`}>
                                {/* Month label above the pixels for first row of each month */}
                                {monthRow.isMonthStart && (
                                  <Text
                                    variant="body"
                                    style={{
                                      color: colors.primary,
                                      fontSize: 14,
                                      fontWeight: '700',
                                      letterSpacing: 0.5,
                                      marginBottom: 8,
                                      marginTop: 4,
                                    }}
                                  >
                                    {monthRow.monthLabel}
                                  </Text>
                                )}

                                {/* Day pixels row */}
                                <View
                                  className="flex-row justify-center"
                                  style={{
                                    marginBottom: GAP,
                                    gap: GAP,
                                  }}
                                >
                                  {monthRow.days.map((day: any) => {
                                    // Skip rendering filler pixels (make them invisible)
                                    if (!day.isReal) {
                                      return (
                                        <View
                                          key={day.dateKey}
                                          style={{
                                            width: pixelSize,
                                            height: pixelSize,
                                          }}
                                        />
                                      );
                                    }

                                    const pixelStyle = getDayPixelStyle(day);

                                    return (
                                      <View
                                        key={day.dateKey}
                                        style={{
                                          width: pixelSize,
                                          height: pixelSize,
                                          backgroundColor:
                                            pixelStyle.type === 'solid'
                                              ? pixelStyle.color
                                              : 'transparent',
                                          overflow: 'hidden',
                                          borderRadius: 8,
                                          borderWidth: day.isToday ? 2 : 0,
                                          borderColor: day.isToday
                                            ? colors.primary
                                            : 'transparent',
                                        }}
                                      >
                                        {pixelStyle.type === 'gradient' &&
                                          pixelStyle.colors && (
                                            <LinearGradient
                                              colors={pixelStyle.colors}
                                              locations={pixelStyle.locations}
                                              start={
                                                pixelStyle.start || {
                                                  x: 0,
                                                  y: 0,
                                                }
                                              }
                                              end={
                                                pixelStyle.end || { x: 0, y: 1 }
                                              }
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
                              </View>
                            )
                          )}
                        </View>
                      );
                    }
                    // Skip rendering current month rows individually (already rendered in container)
                    else if (isCurrentMonth) {
                      // Do nothing - already rendered in container above
                    }
                    // Regular month row (not current month)
                    else {
                      result.push(
                        <View key={`row-${rowIndex}`}>
                          {/* Month label above the pixels for first row of each month */}
                          {isMonthStart && (
                            <Text
                              variant="body"
                              style={{
                                color: colors.foreground,
                                fontSize: 14,
                                fontWeight: '600',
                                letterSpacing: 0.5,
                                marginBottom: 8,
                                marginTop: rowIndex === 0 ? 0 : 18,
                              }}
                            >
                              {row.monthLabel}
                            </Text>
                          )}

                          {/* Day pixels row */}
                          <View
                            className="flex-row justify-center"
                            style={{
                              marginBottom: GAP,
                              gap: GAP,
                            }}
                          >
                            {row.days.map((day: any) => {
                              // Skip rendering filler pixels (make them invisible)
                              if (!day.isReal) {
                                return (
                                  <View
                                    key={day.dateKey}
                                    style={{
                                      width: pixelSize,
                                      height: pixelSize,
                                    }}
                                  />
                                );
                              }

                              const pixelStyle = getDayPixelStyle(day);

                              return (
                                <View
                                  key={day.dateKey}
                                  style={{
                                    width: pixelSize,
                                    height: pixelSize,
                                    backgroundColor:
                                      pixelStyle.type === 'solid'
                                        ? pixelStyle.color
                                        : 'transparent',
                                    overflow: 'hidden',
                                    borderRadius: 8,
                                    borderWidth: day.isToday ? 2 : 0,
                                    borderColor: day.isToday
                                      ? colors.primary
                                      : 'transparent',
                                  }}
                                >
                                  {pixelStyle.type === 'gradient' &&
                                    pixelStyle.colors && (
                                      <LinearGradient
                                        colors={pixelStyle.colors}
                                        locations={pixelStyle.locations}
                                        start={
                                          pixelStyle.start || { x: 0, y: 0 }
                                        }
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
                        </View>
                      );
                    }
                  });

                  return result;
                })()}
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
