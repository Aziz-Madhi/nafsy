import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import { MotiPressable } from 'moti/interactions';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { IconRenderer } from '~/components/ui/IconRenderer';
import { useTranslation } from '~/hooks/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';

interface WeekDayDotProps {
  day: string;
  color?: string;
  isToday?: boolean;
  size?: number;
  hasData?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
  mood?: string;
  hasGradient?: boolean;
  gradientColors?: string[];
  gradientLocations?: number[];
  morningMood?: string;
  eveningMood?: string;
}

export function WeekDayDot({
  day,
  color = '#E5E7EB',
  isToday = false,
  size = 44,
  hasData = false,
  onPress,
  isSelected = false,
  mood,
  hasGradient = false,
  gradientColors = [],
  gradientLocations = [],
  morningMood,
  eveningMood,
}: WeekDayDotProps) {
  const { t } = useTranslation();
  const dotStyle = React.useMemo(
    () => ({
      width: size,
      height: size,
      backgroundColor: hasGradient
        ? 'transparent'
        : hasData
          ? color
          : 'transparent',
    }),
    [size, hasData, color, hasGradient]
  );

  const todayIndicatorStyle = React.useMemo(
    () => ({
      width: 10,
      height: 10,
      backgroundColor: 'rgba(0,0,0,0.8)',
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
            'rounded-2xl items-center justify-center overflow-hidden',
            isSelected && 'border-3 border-primary',
            !hasData && !isToday && !isSelected && 'border-2 border-gray-300',
            isToday && hasData && hasGradient && 'border-2 border-gray-300'
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
          {/* Gradient background for dual moods */}
          {hasGradient && gradientColors.length > 1 && (
            <LinearGradient
              colors={gradientColors}
              locations={gradientLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                ...StyleSheet.absoluteFillObject,
              }}
            />
          )}

          {/* Today indicator only - no mood icons */}
          {isToday && !hasData ? <View style={todayIndicatorStyle} /> : null}
        </View>
      </MotiPressable>
      <Text
        variant="caption1"
        className={cn(
          'mt-3',
          isSelected
            ? 'text-primary font-bold'
            : 'text-muted-foreground font-medium'
        )}
        style={{ textAlign: 'center', letterSpacing: 0.1 }}
      >
        {isToday ? t('common.today') : day}
      </Text>
    </View>
  );
}
