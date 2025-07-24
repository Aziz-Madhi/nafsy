import React, { useState } from 'react';
import { View } from 'react-native';
import { WeekDayDot } from './WeekDayDot';
import { Doc } from '../../../convex/_generated/dataModel';
import { subDays, isSameDay, format } from 'date-fns';
import { Text } from '~/components/ui/text';
import { IconRenderer } from '~/components/ui/IconRenderer';
import { MotiView, AnimatePresence } from 'moti';

// Use the same mood colors as the calendar in mood screen
const moodColors: Record<string, string> = {
  sad: '#DED2F9', // Light purple
  anxious: '#FDC9D2', // Light pink
  neutral: '#FDEBC9', // Light yellow
  happy: '#D0F1EB', // Light teal
  angry: '#F5D4C1', // Light orange
};

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

    // Each dot has 48px width, calculate center position
    const containerPadding = 16; // px-4 = 16px
    const totalWidth = 48 * 7; // 7 dots * 48px width
    const availableWidth = totalWidth;
    const dotCenterOffset = selectedDayIndex * 48 + 24; // center of selected dot
    const percentageFromLeft = (dotCenterOffset / availableWidth) * 100;

    return { left: `${Math.min(Math.max(percentageFromLeft, 10), 90)}%` };
  };

  return (
    <View>
      <View className="flex-row justify-around px-4">
        {last7Days.map((day, index) => (
          <WeekDayDot
            key={index}
            day={day.dayName}
            color={day.mood ? moodColors[day.mood.mood] : '#E5E7EB'}
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
              scale: 0.9,
              translateY: -10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              translateY: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              translateY: -10,
            }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
            }}
            style={{ marginTop: 16, marginHorizontal: 16 }}
          >
            {/* Triangular Pointer */}
            <MotiView
              from={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                ...getPointerPosition(),
              }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 400,
                delay: 0,
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

            <MotiView
              from={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 300,
                delay: 0,
              }}
              style={{
                padding: 16,
                backgroundColor: 'rgba(90, 74, 58, 0.05)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(90, 74, 58, 0.1)',
                shadowColor: '#5A4A3A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                variant="subhead"
                className="text-[#5A4A3A] font-semibold mb-2"
              >
                {format(selectedDay.date, 'EEEE, MMMM d')}
              </Text>

              <View className="flex-row items-center mb-3">
                <View
                  className="rounded-full p-2 mr-3"
                  style={{ backgroundColor: moodColors[selectedDay.mood.mood] }}
                >
                  <IconRenderer
                    iconType="mood"
                    iconName={selectedDay.mood.mood}
                    size={20}
                  />
                </View>
                <Text variant="body" className="text-[#5A4A3A] font-medium">
                  Feeling {moodNames[selectedDay.mood.mood]}
                </Text>
              </View>

              {selectedDay.mood.note ? (
                <View className="bg-white/50 rounded-xl p-3">
                  <Text
                    variant="caption1"
                    className="text-[#5A4A3A] opacity-70 mb-1"
                  >
                    Note:
                  </Text>
                  <Text variant="body" className="text-[#5A4A3A]">
                    {selectedDay.mood.note}
                  </Text>
                </View>
              ) : (
                <Text
                  variant="body"
                  className="text-[#5A4A3A] opacity-60 italic"
                >
                  No notes for this day
                </Text>
              )}
            </MotiView>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
