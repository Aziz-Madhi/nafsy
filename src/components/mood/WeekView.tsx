import React, { useState } from 'react';
import { View } from 'react-native';
import { WeekDayDot } from './WeekDayDot';
import { Doc } from '../../../convex/_generated/dataModel';
import { subDays, isSameDay, format } from 'date-fns';
import { Text } from '~/components/ui/text';
import { IconRenderer } from '~/components/ui/IconRenderer';
import { MotiView, AnimatePresence } from 'moti';
import { colors } from '~/lib/design-tokens';

const moodNames: Record<string, string> = {
  sad: 'Sad',
  anxious: 'Anxious',
  neutral: 'Neutral',
  happy: 'Happy',
  angry: 'Angry',
};

interface WeekViewProps {
  moodData: Doc<'moods'>[] | undefined;
}

export function WeekView({ moodData }: WeekViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const today = new Date();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dayName = weekDays[date.getDay()];
    const mood = moodData?.find((m) => isSameDay(new Date(m.createdAt), date));
    const isToday = isSameDay(date, today);

    return {
      date,
      dayName,
      mood,
      isToday,
    };
  });

  const handleDayPress = (index: number) => {
    setSelectedDayIndex(selectedDayIndex === index ? null : index);
  };

  const selectedDay =
    selectedDayIndex !== null ? last7Days[selectedDayIndex] : null;

  // Calculate pointer position for visual connection
  const getPointerPosition = () => {
    if (selectedDayIndex === null) return { left: '50%' };

    // Simple percentage calculation for justify-around layout
    const percentageFromLeft = ((selectedDayIndex + 0.5) / 7) * 100;

    return { left: `${percentageFromLeft}%` };
  };

  return (
    <View className="py-4">
      <View className="flex-row justify-around">
        {last7Days.map((day, index) => (
          <WeekDayDot
            key={index}
            day={day.dayName}
            color={day.mood ? colors.mood[day.mood.mood].primary : '#E5E7EB'}
            isToday={day.isToday}
            hasData={!!day.mood}
            onPress={() => handleDayPress(index)}
            isSelected={selectedDayIndex === index}
          />
        ))}
      </View>

      <AnimatePresence>
        {selectedDay && selectedDay.mood && (
          <MotiView
            key="insights-container"
            from={{
              opacity: 0,
              translateY: -5,
            }}
            animate={{
              opacity: 1,
              translateY: 0,
            }}
            exit={{
              opacity: 0,
              translateY: -5,
            }}
            transition={{
              type: 'timing',
              duration: 200,
            }}
            style={{ marginTop: 20, marginHorizontal: 8 }}
          >
            {/* Triangular Pointer */}
            <MotiView
              from={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
                ...getPointerPosition(),
              }}
              transition={{
                type: 'timing',
                duration: 150,
              }}
              style={{
                position: 'absolute',
                top: -8,
                marginLeft: -8,
                width: 0,
                height: 0,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderBottomWidth: 8,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: 'rgba(90, 74, 58, 0.1)',
                zIndex: 1,
              }}
            />

            <View
              style={{
                padding: 24,
                backgroundColor: 'rgba(90, 74, 58, 0.12)',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Text
                variant="subhead"
                className="text-[#2D3748] font-bold mb-3"
                style={{ fontSize: 16, letterSpacing: 0.3 }}
              >
                {format(selectedDay.date, 'EEEE, MMMM d')}
              </Text>

              <View className="flex-row items-center mb-4">
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4 overflow-hidden"
                  style={{
                    backgroundColor: colors.mood[selectedDay.mood.mood].primary,
                  }}
                >
                  <IconRenderer
                    iconType="mood"
                    iconName={selectedDay.mood.mood}
                    size={24}
                    color={colors.neutral[900]}
                  />
                </View>
                <Text
                  variant="body"
                  className="text-[#2D3748] font-bold"
                  style={{ fontSize: 16, letterSpacing: 0.3 }}
                >
                  Feeling {moodNames[selectedDay.mood.mood]}
                </Text>
              </View>

              {selectedDay.mood.note ? (
                <View className="bg-white/50 rounded-xl p-3">
                  <Text
                    variant="caption1"
                    className="text-gray-600 font-medium mb-1"
                    style={{ fontSize: 13 }}
                  >
                    Note:
                  </Text>
                  <Text
                    variant="body"
                    className="text-[#2D3748]"
                    style={{ fontSize: 15, lineHeight: 20 }}
                  >
                    {selectedDay.mood.note}
                  </Text>
                </View>
              ) : (
                <Text
                  variant="body"
                  className="text-gray-500 italic font-medium"
                  style={{ fontSize: 15 }}
                >
                  No notes for this day
                </Text>
              )}
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
