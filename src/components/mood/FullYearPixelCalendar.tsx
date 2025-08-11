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
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  format,
  isToday,
  isFuture,
  differenceInDays,
  endOfYear,
  endOfMonth,
  getDaysInYear,
  getDayOfYear,
} from 'date-fns';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MoodEntry {
  createdAt: string;
  mood: 'sad' | 'anxious' | 'neutral' | 'happy' | 'angry';
}

interface FullYearPixelCalendarProps {
  moodData?: MoodEntry[];
  year?: number;
}

export function FullYearPixelCalendar({
  moodData = [],
  year = new Date().getFullYear(),
}: FullYearPixelCalendarProps) {
  const today = new Date();
  const currentYear = year;
  const yearEnd = endOfYear(new Date(currentYear, 0, 1));

  // Colors for React Native styling
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

  // Calculate days left in the year
  const daysLeft =
    today.getFullYear() === currentYear
      ? Math.max(0, differenceInDays(yearEnd, today))
      : 0;

  // State for progressive rendering
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const opacity = useSharedValue(0);

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Calculate optimal layout
  const COLUMNS = 14; // 14 columns for balanced layout
  const HORIZONTAL_PADDING = 32; // Side padding (16px each side)
  const GAP = 4; // More spacing between pixels
  const HEADER_HEIGHT = 60; // Header with back button
  const BOTTOM_INFO_HEIGHT = 60; // Bottom info bar
  const SAFE_AREA_PADDING = 100; // Approximate safe area padding

  // Calculate pixel size based on screen width
  const availableWidth = screenWidth - HORIZONTAL_PADDING;
  const pixelSize = Math.floor(
    (availableWidth - GAP * (COLUMNS - 1)) / COLUMNS
  );

  // Calculate number of rows needed
  const totalDays = getDaysInYear(new Date(currentYear, 0, 1));
  const ROWS = Math.ceil(totalDays / COLUMNS);

  // Progressive rendering effect
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
      opacity.value = withTiming(1, { duration: 300 });

      // Scroll to current month after render
      if (today.getFullYear() === currentYear && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: initialScrollOffset,
            animated: false,
          });
        }, 100);
      }
    });

    return () => interaction.cancel();
  }, [opacity, initialScrollOffset, currentYear]);

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
  }, [currentYear, pixelSize, GAP, COLUMNS]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Create mood data map for quick lookup
  const moodDataMap = useMemo(() => {
    const map = new Map<string, string>();
    moodData?.forEach((entry) => {
      const dateKey = format(new Date(entry.createdAt), 'yyyy-MM-dd');
      map.set(dateKey, entry.mood);
    });
    return map;
  }, [moodData]);

  // Generate year grid organized by months
  const yearGrid = useMemo(() => {
    const monthNames = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
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
        const mood = moodDataMap.get(dateKey);

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
  }, [currentYear, moodDataMap]);

  // Get color for a day
  const getDayColor = (day: any) => {
    // If it's a filler day (not a real date), make it transparent
    if (!day.isReal) {
      return 'transparent';
    }

    // If there's a mood, use the EXACT mood color
    if (day.mood && moodColors[day.mood as keyof typeof moodColors]) {
      return moodColors[day.mood as keyof typeof moodColors];
    }

    // No mood entry for this day - use very subtle background
    if (day.isFuture) {
      return 'rgba(0, 0, 0, 0.03)'; // Very subtle for future untracked days
    }

    return 'rgba(0, 0, 0, 0.05)'; // Slightly more visible for past untracked days
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
            <Text variant="body" className="text-gray-600 text-lg ml-0.5">
              Back
            </Text>
          </Pressable>

          <Text
            variant="title2"
            className="text-gray-900 text-2xl font-bold"
            style={{
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
              variant="subheadline"
              style={{
                fontSize: 15,
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: 16,
                letterSpacing: 0.1,
              }}
            >
              Your emotional journey
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
              }}
            >
              Discover patterns in your moods and reflect on your growth
              throughout the year.
            </Text>
          </View>

          {!isReady ? (
            // Loading placeholder
            <View
              className="items-center justify-center py-20"
              style={{ backgroundColor: 'transparent' }}
            >
              <Text variant="caption1" className="text-gray-500">
                Loading calendar...
              </Text>
            </View>
          ) : (
            // Optimized grid with month organization
            <Animated.View style={animatedContainerStyle}>
              <Pressable onPress={handleGridPress} ref={containerRef}>
                {(() => {
                  const result = [];
                  const currentMonthRows = [];

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
                            backgroundColor: 'rgba(63, 81, 117, 0.08)',
                            borderRadius: 16,
                            padding: 12,
                            marginHorizontal: -4,
                            marginVertical: 6,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                          }}
                        >
                          {currentMonthRows.map(
                            ({ row: monthRow, rowIndex: monthRowIndex }) => (
                              <View key={`month-row-${monthRowIndex}`}>
                                {/* Month label above the pixels for first row of each month */}
                                {monthRow.isMonthStart && (
                                  <Text
                                    variant="subheadline"
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
                                  {monthRow.days.map((day) => {
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

                                    const color = getDayColor(day);

                                    return (
                                      <View
                                        key={day.dateKey}
                                        style={{
                                          width: pixelSize,
                                          height: pixelSize,
                                          backgroundColor: color,
                                          borderRadius: 4,
                                          borderWidth: day.isToday ? 2 : 0,
                                          borderColor: day.isToday
                                            ? colors.primary
                                            : 'transparent',
                                        }}
                                      />
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
                              variant="subheadline"
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
                            {row.days.map((day) => {
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

                              const color = getDayColor(day);

                              return (
                                <View
                                  key={day.dateKey}
                                  style={{
                                    width: pixelSize,
                                    height: pixelSize,
                                    backgroundColor: color,
                                    borderRadius: 4,
                                    borderWidth: day.isToday ? 2 : 0,
                                    borderColor: day.isToday
                                      ? colors.primary
                                      : 'transparent',
                                  }}
                                />
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
