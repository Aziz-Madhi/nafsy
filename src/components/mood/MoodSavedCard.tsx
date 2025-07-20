import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle } from 'lucide-react-native';

interface MoodSavedCardProps {
  todayMood?: {
    mood: string;
    createdAt: string;
  };
}

export function MoodSavedCard({ todayMood }: MoodSavedCardProps) {
  return (
    <View className="bg-white/40 rounded-3xl p-8 items-center shadow-sm">
      <View className="w-20 h-20 bg-[#D0F1EB] rounded-full items-center justify-center mb-4">
        <CheckCircle size={48} color="#059669" fill="#D1FAE5" />
      </View>
      <Text 
        style={{ fontSize: 22, fontWeight: 'bold', color: '#5A4A3A', marginBottom: 8 }}
      >
        Mood Saved!
      </Text>
      <Text 
        style={{ fontSize: 17, color: '#5A4A3A', opacity: 0.7, textAlign: 'center' }}
      >
        Great job tracking your emotions today
      </Text>
      {todayMood && (
        <View className="flex-row items-center mt-4 bg-gray-100 px-5 py-3 rounded-2xl">
          <Text 
            style={{ fontSize: 15, fontWeight: '500', color: '#5A4A3A' }}
          >
            Today you felt {todayMood.mood}
          </Text>
        </View>
      )}
    </View>
  );
}