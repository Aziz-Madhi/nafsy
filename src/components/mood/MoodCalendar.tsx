import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '~/lib/utils';
import * as Haptics from 'expo-haptics';

interface MoodEntry {
  date: Date;
  mood: string;
  emoji: string;
  color: string;
}

interface MoodCalendarProps {
  moodEntries: MoodEntry[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

const MOOD_COLORS = {
  'very-sad': '#94A3B8',
  'sad': '#64748B',
  'neutral': '#7ED321',
  'happy': '#4ADE80',
  'very-happy': '#22C55E',
};

export function MoodCalendar({ moodEntries, selectedDate, onDateSelect }: MoodCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days to start from Sunday
  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const getMoodForDate = (date: Date) => {
    return moodEntries.find(entry => isSameDay(entry.date, date));
  };

  const handlePreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <View className="bg-card rounded-2xl p-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Pressable onPress={handlePreviousMonth} className="p-2">
          <ChevronLeft size={20} className="text-muted-foreground" />
        </Pressable>
        
        <Text variant="title3">
          {format(currentDate, 'MMMM yyyy')}
        </Text>
        
        <Pressable onPress={handleNextMonth} className="p-2">
          <ChevronRight size={20} className="text-muted-foreground" />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View className="flex-row mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text variant="muted" className="text-xs font-medium">
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {/* Padding days */}
        {paddingDays.map((_, index) => (
          <View key={`padding-${index}`} className="w-[14.28%] h-12" />
        ))}
        
        {/* Actual days */}
        {days.map((day) => {
          const mood = getMoodForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDateSelect?.(day);
              }}
              className="w-[14.28%] h-12 p-1"
            >
              <View
                className={cn(
                  'flex-1 items-center justify-center rounded-lg',
                  isSelected && 'ring-2 ring-primary',
                  isToday && 'border border-primary'
                )}
                style={{
                  backgroundColor: mood ? mood.color + '20' : 'transparent',
                }}
              >
                {mood ? (
                  <Text className="text-lg">{mood.emoji}</Text>
                ) : (
                  <Text
                    variant={isToday ? 'body' : 'muted'}
                    className={cn(
                      'text-sm',
                      !isSameMonth(day, currentDate) && 'opacity-30'
                    )}
                  >
                    {format(day, 'd')}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View className="mt-6 pt-4 border-t border-border/50">
        <View className="flex-row justify-around">
          {Object.entries(MOOD_COLORS).map(([mood, color]) => (
            <View key={mood} className="items-center">
              <View
                className="w-4 h-4 rounded-full mb-1"
                style={{ backgroundColor: color }}
              />
              <Text variant="muted" className="text-xs">
                {mood.split('-')[0]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}