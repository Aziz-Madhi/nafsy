import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import { MotiPressable } from 'moti/interactions';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

interface WeekDayDotProps {
  day: string;
  color?: string;
  isToday?: boolean;
  size?: number;
  hasData?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function WeekDayDot({
  day,
  color = '#E5E7EB',
  isToday = false,
  size = 44,
  hasData = false,
  onPress,
  isSelected = false,
}: WeekDayDotProps) {
  const dotStyle = React.useMemo(
    () => ({
      width: size,
      height: size,
      backgroundColor: hasData ? color : 'transparent',
    }),
    [size, hasData, color]
  );

  const todayIndicatorStyle = React.useMemo(
    () => ({
      width: 10,
      height: 10,
      backgroundColor: '#1F2937', // Darker gray dot
      borderRadius: 5,
    }),
    []
  );

  const handlePress = () => {
    if (hasData || isToday) {
      // Haptic feedback
      try {
        impactAsync(ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptic feedback error:', error);
      }
      onPress?.();
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <MotiPressable
        onPress={handlePress}
        disabled={!hasData && !isToday}
        animate={({ pressed }) => {
          'worklet';
          return {
            scale: pressed ? 0.85 : 1,
          };
        }}
        transition={{
          type: 'spring',
          damping: 15,
          stiffness: 300,
        }}
        style={{ alignItems: 'center' }}
      >
        <View
          className={cn(
            'rounded-2xl items-center justify-center',
            isSelected && 'border-3 border-primary',
            !hasData && !isToday && !isSelected && 'border-2 border-gray-300'
          )}
          style={{
            ...dotStyle,
            shadowColor: hasData ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: hasData ? 0.15 : 0,
            shadowRadius: 6,
            elevation: hasData ? 4 : 0,
          }}
        >
          {isToday && <View style={todayIndicatorStyle} />}
        </View>
      </MotiPressable>
      <Text
        variant="caption1"
        className={cn(
          'mt-3',
          isSelected ? 'text-primary font-bold' : 'text-gray-600 font-medium'
        )}
        style={{ textAlign: 'center', fontSize: 12, letterSpacing: 0.1 }}
      >
        {isToday ? 'Today' : day}
      </Text>
    </View>
  );
}
