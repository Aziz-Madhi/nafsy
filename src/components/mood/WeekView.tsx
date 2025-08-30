import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { WeekDayDot } from './WeekDayDot';
import { Doc } from '../../../convex/_generated/dataModel';
import { subDays, isSameDay, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Text } from '~/components/ui/text';
import { MotiView, AnimatePresence } from 'moti';
import { useMoodColor, useColors } from '~/hooks/useColors';
import { mapMoodToRating } from '~/lib/mood-exercise-mapping';
import { useTranslation } from '~/hooks/useTranslation';
import { getMoodColor, getMoodPixelStyle } from '~/lib/mood-colors';

// Mood names will be localized using translation hook

interface WeekViewProps {
  moodData: Doc<'moods'>[] | undefined;
}

export function WeekView({ moodData }: WeekViewProps) {
  const { t, i18n } = useTranslation();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const today = new Date();
  const weekDays = [
    t('mood.calendar.days.sun'),
    t('mood.calendar.days.mon'),
    t('mood.calendar.days.tue'),
    t('mood.calendar.days.wed'),
    t('mood.calendar.days.thu'),
    t('mood.calendar.days.fri'),
    t('mood.calendar.days.sat'),
  ];

  // Colors for React Native styling
  const colors = useColors();

  // Get all mood colors at the top level for all possible moods
  const sadColor = useMoodColor('sad');
  const anxiousColor = useMoodColor('anxious');
  const neutralColor = useMoodColor('neutral');
  const happyColor = useMoodColor('happy');
  const angryColor = useMoodColor('angry');

  // Get unified color from rating scale, falling back to legacy mood mapping
  const getEntryColor = (entry: Doc<'moods'> | undefined): string => {
    if (!entry) return '#E5E7EB';
    const rating =
      entry.rating ?? (entry.mood ? mapMoodToRating(entry.mood) : undefined);
    if (rating) {
      const clamped = Math.max(1, Math.min(10, Math.round(rating)));
      const key = `ratingScale${clamped}` as keyof typeof colors;
      return colors[key] as string;
    }
    // Fallback to legacy mood color if rating couldn't be derived
    switch (entry.mood) {
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

  // Get last 7 days with morning and evening moods
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dayName = weekDays[date.getDay()];
    const dayMoods =
      moodData?.filter((m) => isSameDay(new Date(m.createdAt), date)) || [];

    // Separate morning and evening moods
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

    // Use latest mood for backward compatibility
    const mood =
      dayMoods.length > 0 ? dayMoods[dayMoods.length - 1] : undefined;
    const isToday = isSameDay(date, today);

    return {
      date,
      dayName,
      mood,
      morningMood,
      eveningMood,
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
    if (selectedDayIndex === null) return { left: '50%' as const };
    // Calculate px offset instead of percentage to satisfy RN typing
    const containerWidth = 320; // approximate; pointer is purely decorative
    const step = containerWidth / 7;
    const x = step * (selectedDayIndex + 0.5);
    return { left: x } as const;
  };

  return (
    <>
      <View className="py-4">
        <View className="flex-row justify-around">
          {last7Days.map((day, index) => {
            // Calculate gradient for dual moods
            const pixelStyle = getMoodPixelStyle(
              day.morningMood as any,
              day.eveningMood as any,
              colors,
              day.isToday
            );

            const hasGradient = pixelStyle.type === 'gradient';
            const gradientColors = hasGradient ? pixelStyle.colors || [] : [];
            const gradientLocations = hasGradient
              ? pixelStyle.locations || []
              : [];
            const solidColor =
              pixelStyle.type === 'solid' ? pixelStyle.color : '#E5E7EB'; // Default gray for when gradient is used

            return (
              <WeekDayDot
                key={index}
                day={day.dayName}
                color={solidColor}
                isToday={day.isToday}
                hasData={!!day.mood}
                onPress={() => handleDayPress(index)}
                isSelected={selectedDayIndex === index}
                mood={day.mood?.mood}
                hasGradient={hasGradient}
                gradientColors={gradientColors}
                gradientLocations={gradientLocations}
                morningMood={day.morningMood?.mood}
                eveningMood={day.eveningMood?.mood}
              />
            );
          })}
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
                className="bg-background"
                style={{
                  padding: 24,
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
                  variant="callout"
                  className="text-[#2D3748] font-bold mb-3"
                  style={{ letterSpacing: 0.3 }}
                >
                  {format(selectedDay.date, 'EEEE, MMMM d', {
                    locale: i18n.language === 'ar' ? (ar as any) : (enUS as any),
                  })}
                </Text>

                <View
                  className={
                    i18n.language === 'ar'
                      ? 'flex-row-reverse items-center mb-4'
                      : 'flex-row items-center mb-4'
                  }
                >
                  <View
                    className={
                      i18n.language === 'ar'
                        ? 'w-14 h-14 rounded-2xl items-center justify-center ml-4 overflow-hidden'
                        : 'w-14 h-14 rounded-2xl items-center justify-center mr-4 overflow-hidden'
                    }
                    style={{
                      backgroundColor: getEntryColor(selectedDay.mood as any),
                    }}
                  >
                    {(() => {
                      // Prefer explicit rating, fallback to mapping from legacy mood
                      const raw =
                        (selectedDay.mood as any)?.rating ??
                        (selectedDay.mood?.mood
                          ? mapMoodToRating(selectedDay.mood.mood)
                          : undefined);
                      const ratingValue = raw ? Math.max(1, Math.min(10, Math.round(raw))) : undefined;

                      // Convert digits to Eastern Arabic if needed
                      return (
                        <Text
                          variant="title1"
                          autoAlign={false}
                          className="text-foreground"
                          style={{
                            fontWeight: '700',
                            // Force Latin font for numerals in Arabic to match English appearance
                            fontFamily:
                              i18n.language === 'ar' ? 'AveriaSerif-Bold' : undefined,
                          }}
                        >
                          {ratingValue ? String(ratingValue) : '—'}
                        </Text>
                      );
                    })()}
                  </View>
                  <Text
                    variant="callout"
                    className="text-[#2D3748] font-bold"
                    style={{ letterSpacing: 0.3 }}
                  >
                    {(() => {
                      const raw =
                        (selectedDay.mood as any)?.rating ??
                        (selectedDay.mood?.mood
                          ? mapMoodToRating(selectedDay.mood.mood)
                          : undefined);
                      const ratingValue = raw ? Math.max(1, Math.min(10, Math.round(raw))) : undefined;
                      const label = ratingValue
                        ? t(`mood.rating.labels.${ratingValue}` as any)
                        : t(`mood.moods.${selectedDay.mood.mood}`);
                      return `${t('mood.feeling')} ${label}`;
                    })()}
                  </Text>
                </View>

                {selectedDay.mood.note ? (
                  <View
                    className="bg-card"
                    style={{
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
                        className="bg-foreground/60"
                        style={{
                          width: 4,
                          height: 16,
                          borderRadius: 2,
                          marginRight: 8,
                        }}
                      />
                      <Text
                        variant="footnote"
                        className="text-[#5A4A3A] font-bold"
                        style={{ letterSpacing: 0.5 }}
                      >
                        {t('mood.note')}
                      </Text>
                    </View>
                    <Text
                      variant="callout"
                      className="text-[#2D3748] italic"
                      style={{ lineHeight: 22 }}
                    >
                      {`"${selectedDay.mood.note}"`}
                    </Text>
                  </View>
                ) : (
                  <View
                    className="bg-white/70"
                    style={{
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(90, 74, 58, 0.15)',
                      borderStyle: 'dashed',
                    }}
                  >
                    <Text
                      variant="subhead"
                      className="text-gray-500 italic font-medium text-center"
                    >
                      {t('mood.noNotesForDay')}
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
