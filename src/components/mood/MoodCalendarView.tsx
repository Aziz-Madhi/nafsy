import React from 'react';
import { View, Text } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface MoodCalendarViewProps {
  currentMonth: Date;
  moodData?: Array<{
    mood: string;
    createdAt: string;
  }>;
}

export function MoodCalendarView({ currentMonth, moodData }: MoodCalendarViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getMoodForDate = (date: Date) => {
    return moodData?.find(mood => 
      isSameDay(new Date(mood.createdAt), date)
    );
  };

  return (
    <View className="mb-8">
      <View className="flex-row items-center mb-4">
        <Calendar size={20} color="#5A4A3A" />
        <Text 
          style={{ fontSize: 22, fontWeight: 'bold', color: '#5A4A3A', marginLeft: 8 }}
        >
          Monthly Overview
        </Text>
      </View>
      
      <View className="bg-white/40 rounded-3xl p-6 shadow-sm">
        <Text style={{ fontSize: 20, fontWeight: '600', color: '#5A4A3A', marginBottom: 16 }}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        
        {/* Days grid - first 14 days as preview */}
        <View className="flex-row flex-wrap">
          {days.slice(0, 14).map((day, index) => {
            const dayMood = getMoodForDate(day);
            return (
              <View 
                key={index}
                className="w-10 h-10 m-1 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: dayMood ? '#D0F1EB' : '#F3F4F6'
                }}
              >
                <Text 
                  style={{ 
                    fontSize: 11,
                    color: dayMood ? '#166534' : '#6B7280'
                  }}
                >
                  {format(day, 'd')}
                </Text>
              </View>
            );
          })}
        </View>
        
        <Text style={{ fontSize: 17, color: '#5A4A3A', marginTop: 16 }}>
          {moodData ? `${moodData.length} entries this month` : 'Loading...'}
        </Text>
      </View>
    </View>
  );
}