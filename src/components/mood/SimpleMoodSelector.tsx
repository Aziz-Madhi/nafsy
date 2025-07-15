import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface SimpleMoodSelectorProps {
  selectedMood?: string;
  onMoodSelect: (mood: { id: string }) => void;
}

export function SimpleMoodSelector({ selectedMood, onMoodSelect }: SimpleMoodSelectorProps) {
  return (
    <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
        How are you feeling today?
      </Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Pressable
          onPress={() => onMoodSelect({ id: 'happy' })}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: selectedMood === 'happy' ? '#4ADE80' : '#f0f0f0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 24 }}>😊</Text>
        </Pressable>
        
        <Pressable
          onPress={() => onMoodSelect({ id: 'neutral' })}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: selectedMood === 'neutral' ? '#7ED321' : '#f0f0f0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 24 }}>😐</Text>
        </Pressable>
        
        <Pressable
          onPress={() => onMoodSelect({ id: 'sad' })}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: selectedMood === 'sad' ? '#64748B' : '#f0f0f0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 24 }}>😔</Text>
        </Pressable>
      </View>
    </View>
  );
}