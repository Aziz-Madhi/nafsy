import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { WeekDayDot } from './WeekDayDot';
import { Doc } from '../../../convex/_generated/dataModel';
import { subDays, isSameDay, format } from 'date-fns';
import { Text } from '~/components/ui/text';
import { IconRenderer } from '~/components/ui/IconRenderer';
import { MotiView, AnimatePresence } from 'moti';
import { useMoodColor, useColors } from '~/hooks/useColors';

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

  // Colors for React Native styling
  const colors = useColors();

  // Get all mood colors at the top level for all possible moods
  const sadColor = useMoodColor('sad');
  const anxiousColor = useMoodColor('anxious');
  const neutralColor = useMoodColor('neutral');
  const happyColor = useMoodColor('happy');
  const angryColor = useMoodColor('angry');

  // Helper function to get mood color without calling hooks
  const getMoodColor = (mood: string): string => {
    switch (mood) {
      case 'sad':
        return sadColor;
      case 'anxious':
        return anxiousColor;
      case 'neutral':
        return neutralColor;
      case 'happy':
        return happyColor;
      case 'angry':
        return angryColor;
      default:
        return '#E5E7EB';
    }
  };

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

  const handleCloseOverlay = () => {
    setSelectedDayIndex(null);
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
    <>
      <View className="py-4">
        <View className="flex-row justify-around">
          {last7Days.map((day, index) => (
            <WeekDayDot
              key={index}
              day={day.dayName}
              color={day.mood ? getMoodColor(day.mood.mood) : '#E5E7EB'}
              isToday={day.isToday}
              hasData={!!day.mood}
              onPress={() => handleDayPress(index)}
              isSelected={selectedDayIndex === index}
              mood={day.mood?.mood}
            />
          ))}
        </View>
      </View>

      {/* Overlay Detail View */}
      <AnimatePresence>
        {selectedDay && selectedDay.mood && (
          <Pressable
            onPress={handleCloseOverlay}
            style={{
              position: 'absolute',
              top: 120,
              left: 8,
              right: 8,
              zIndex: 1001,
            }}
          >
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
                  borderBottomColor: '#F4F1ED',
                  zIndex: 1,
                }}
              />

              <View
                style={{
                  padding: 24,
                  backgroundColor: '#F4F1ED',
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 6,
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
                      backgroundColor: getMoodColor(selectedDay.mood.mood),
                    }}
                  >
                    <IconRenderer
                      iconType="mood"
                      iconName={selectedDay.mood.mood}
                      size={24}
                      color={colors.foreground}
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
                  <View
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(90, 74, 58, 0.2)',
                      shadowColor: 'rgba(90, 74, 58, 0.3)',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 4,
                          height: 16,
                          backgroundColor: 'rgba(90, 74, 58, 0.6)',
                          borderRadius: 2,
                          marginRight: 8,
                        }}
                      />
                      <Text
                        variant="caption1"
                        className="text-[#5A4A3A] font-bold"
                        style={{ fontSize: 13, letterSpacing: 0.5 }}
                      >
                        NOTE
                      </Text>
                    </View>
                    <Text
                      variant="body"
                      className="text-[#2D3748]"
                      style={{
                        fontSize: 15,
                        lineHeight: 22,
                        fontStyle: 'italic',
                      }}
                    >
                      "{selectedDay.mood.note}"
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(90, 74, 58, 0.15)',
                      borderStyle: 'dashed',
                    }}
                  >
                    <Text
                      variant="body"
                      className="text-gray-500 italic font-medium text-center"
                      style={{ fontSize: 14 }}
                    >
                      No notes for this day
                    </Text>
                  </View>
                )}
              </View>
            </MotiView>
          </Pressable>
        )}
      </AnimatePresence>
    </>
  );
}
