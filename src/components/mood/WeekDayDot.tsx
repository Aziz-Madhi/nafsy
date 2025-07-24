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
  size = 32,
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
      width: 6,
      height: 6,
      backgroundColor: '#374151', // Dark gray dot
      borderRadius: 3,
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
    <View style={{ width: 48, alignItems: 'center' }}>
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
            'rounded-full items-center justify-center',
            isSelected && 'border-2 border-primary',
            !hasData && !isToday && !isSelected && 'border border-gray-300'
          )}
          style={dotStyle}
        >
          {isToday && <View style={todayIndicatorStyle} />}
        </View>
      </MotiPressable>
      <Text
        variant="caption2"
        className={cn(
          'mt-2',
          isSelected ? 'text-primary font-semibold' : 'text-gray-500'
        )}
        style={{ textAlign: 'center', width: 48 }}
      >
        {isToday ? 'Today' : day}
      </Text>
    </View>
  );
}
