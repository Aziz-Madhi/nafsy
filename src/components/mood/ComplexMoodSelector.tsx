import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { 
  CloudRain, 
  TrendingDown,
  Minus,
  TrendingUp,
  Star,
  AlertTriangle,
  Zap
} from 'lucide-react-native';

const moods = [
  { id: 'very-sad', label: 'Very Sad', value: 'sad', color: '#94A3B8' },
  { id: 'sad', label: 'Sad', value: 'sad', color: '#64748B' },
  { id: 'neutral', label: 'Neutral', value: 'neutral', color: '#7ED321' },
  { id: 'happy', label: 'Happy', value: 'happy', color: '#4ADE80' },
  { id: 'very-happy', label: 'Very Happy', value: 'happy', color: '#22C55E' },
];

const renderMoodIcon = (moodId: string, size: number = 32) => {
  const baseProps = { size, strokeWidth: 3 };
  
  switch (moodId) {
    case 'very-sad':
      return <CloudRain {...baseProps} color="#1F2937" fill="#93C5FD" />;
    case 'sad':
      return <TrendingDown {...baseProps} color="#374151" fill="#DBEAFE" />;
    case 'neutral':
      return <Minus {...baseProps} color="#374151" strokeWidth={4} />;
    case 'happy':
      return <TrendingUp {...baseProps} color="#065F46" fill="#A7F3D0" />;
    case 'very-happy':
      return <Star {...baseProps} color="#DC2626" fill="#FEF3C7" />;
    case 'anxious':
      return <AlertTriangle {...baseProps} color="#7C2D12" fill="#FED7AA" />;
    case 'angry':
      return <Zap {...baseProps} color="#991B1B" fill="#FECACA" />;
    default:
      return <Minus {...baseProps} color="#374151" strokeWidth={4} />;
  }
};

interface ComplexMoodSelectorProps {
  selectedMood: string;
  onMoodSelect: (moodId: string) => void;
  onSaveMood: () => void;
  isSaving: boolean;
}

export function ComplexMoodSelector({ selectedMood, onMoodSelect, onSaveMood, isSaving }: ComplexMoodSelectorProps) {
  return (
    <View className="bg-white/40 rounded-3xl p-6 shadow-sm">
      <Text 
        style={{ fontSize: 20, fontWeight: '600', color: '#5A4A3A', textAlign: 'center', marginBottom: 32 }}
      >
        How are you feeling today?
      </Text>
      
      <View className="flex-row justify-between mb-8">
        {moods.map((mood) => (
          <Pressable
            key={mood.id}
            onPress={() => onMoodSelect(mood.id)}
            className="items-center"
          >
            <View 
              className="w-16 h-16 rounded-full border-2 items-center justify-center mb-2"
              style={{
                backgroundColor: selectedMood === mood.id ? mood.color : 'white',
                borderColor: selectedMood === mood.id ? mood.color : '#E5E7EB',
                transform: selectedMood === mood.id ? [{ scale: 1.1 }] : [{ scale: 1 }],
              }}
            >
              {renderMoodIcon(mood.id, 32)}
            </View>
            <Text 
              style={{ 
                fontSize: 12,
                fontWeight: selectedMood === mood.id ? '600' : '400',
                color: selectedMood === mood.id ? mood.color : '#6B7280'
              }}
            >
              {mood.label}
            </Text>
          </Pressable>
        ))}
      </View>
      
      {selectedMood && (
        <Pressable
          onPress={onSaveMood}
          disabled={isSaving}
          className={`bg-blue-500 py-4 rounded-2xl items-center ${
            isSaving ? 'opacity-60' : ''
          }`}
        >
          <Text 
            style={{ color: 'white', fontSize: 16, fontWeight: '600' }}
          >
            {isSaving ? 'Saving...' : 'Save Mood'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}