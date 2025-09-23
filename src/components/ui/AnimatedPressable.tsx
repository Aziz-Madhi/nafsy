import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { safeHaptics } from '~/lib/haptics';

interface AnimatedPressableProps extends Omit<PressableProps, 'onPress'> {
  onPress?: () => void;
  children: React.ReactNode;
  scaleFrom?: number;
  scaleTo?: number;
  springConfig?: WithSpringConfig;
  hapticFeedback?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
}

const defaultSpringConfig: WithSpringConfig = {
  damping: 15,
  stiffness: 300,
};

const hapticMap = {
  light: () => safeHaptics.impact(ImpactFeedbackStyle.Light),
  medium: () => safeHaptics.impact(ImpactFeedbackStyle.Medium),
  heavy: () => safeHaptics.impact(ImpactFeedbackStyle.Heavy),
  selection: () => safeHaptics.selection(),
};

export const AnimatedPressable = React.memo(function AnimatedPressable({
  onPress,
  children,
  scaleFrom = 1,
  scaleTo = 0.95,
  springConfig = defaultSpringConfig,
  hapticFeedback = true,
  hapticType = 'light',
  style,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(scaleFrom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleTo, springConfig);
    if (hapticFeedback && hapticMap[hapticType]) {
      try {
        hapticMap[hapticType]();
      } catch (error) {
        // Silently ignore haptic errors
        console.warn('Haptic feedback error:', error);
      }
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(scaleFrom, springConfig);
  };

  const handlePress = () => {
    onPress?.();
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
});
