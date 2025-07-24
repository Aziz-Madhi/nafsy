/**
 * AnimatedContainer - Unified animation component
 * Consolidates common animation patterns across the app
 */

import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  FadeIn,
} from 'react-native-reanimated';
import { ImpactFeedbackStyle } from 'expo-haptics';
import {
  spring,
  staggered,
  entranceSequence,
  scaleEntrance,
  createPressHandlers,
  initializeEntranceValues,
} from './utils';
import {
  type SpringPreset,
  type StaggerDelay,
  type PressScale,
  ENTRANCE_VALUES,
} from './presets';

type EntranceAnimation =
  | 'fadeIn'
  | 'slideInDown'
  | 'slideInUp'
  | 'slideInLeft'
  | 'slideInRight'
  | 'scale'
  | 'staggered'
  | 'custom';

interface AnimatedContainerProps {
  children: React.ReactNode;

  // Entrance animations
  entrance?: EntranceAnimation;
  entranceDelay?: number;
  staggerIndex?: number;
  staggerDelay?: StaggerDelay;
  springPreset?: SpringPreset;

  // Press interactions
  pressable?: boolean;
  pressScale?: PressScale;
  hapticFeedback?: ImpactFeedbackStyle;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;

  // Custom styling
  style?: any;
  className?: string;

  // Animation control
  animateOnMount?: boolean;
  disabled?: boolean;
}

// Fix: Don't use Animated.createAnimatedComponent(Pressable) directly
// as it conflicts with layout animations. Use wrapper pattern instead.

export function AnimatedContainer({
  children,
  entrance = 'fadeIn',
  entranceDelay = 0,
  staggerIndex,
  staggerDelay = 'normal',
  springPreset = 'gentle',
  pressable = false,
  pressScale = 'normal',
  hapticFeedback = ImpactFeedbackStyle.Light,
  onPress,
  onPressIn,
  onPressOut,
  style,
  className,
  animateOnMount = true,
  disabled = false,
}: AnimatedContainerProps) {
  // Shared values for custom animations
  const opacity = useSharedValue(entrance === 'custom' ? 0 : 1);
  const translateY = useSharedValue(
    entrance === 'custom' ? ENTRANCE_VALUES.slideDistance : 0
  );
  const translateX = useSharedValue(0);
  const scale = useSharedValue(
    entrance === 'custom' || entrance === 'scale'
      ? ENTRANCE_VALUES.scaleFrom
      : 1
  );

  // Press handlers
  const pressHandlers = pressable
    ? createPressHandlers(scale, pressScale, hapticFeedback)
    : undefined;

  // Initialize and trigger entrance animations (no delays)
  useEffect(() => {
    if (animateOnMount && entrance === 'custom') {
      initializeEntranceValues(opacity, translateY, scale);

      // All animations start immediately - no stagger delays
      opacity.value = staggered(1, 0, staggerDelay, springPreset);
      translateY.value = staggered(0, 0, staggerDelay, springPreset);
      if (entrance === 'scale') {
        scale.value = staggered(1, 0, staggerDelay, 'bouncy');
      }
    }
  }, [animateOnMount, entrance, springPreset]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Built-in Reanimated entering animations (disabled for performance)
  const getEnteringAnimation = () => {
    // All animations disabled - return undefined for immediate display
    return undefined;
  };

  // Choose component based on pressable requirement
  if (pressable && pressHandlers) {
    return (
      <Animated.View
        style={entrance === 'custom' ? [animatedStyle] : [style]}
        className={className}
        entering={entrance !== 'custom' ? getEnteringAnimation() : undefined}
      >
        <Pressable
          style={entrance !== 'custom' ? style : undefined}
          onPress={onPress}
          onPressIn={() => {
            pressHandlers.handlePressIn();
            onPressIn?.();
          }}
          onPressOut={() => {
            pressHandlers.handlePressOut();
            onPressOut?.();
          }}
          disabled={disabled}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={entrance === 'custom' ? [animatedStyle] : [style]}
      className={className}
      entering={entrance !== 'custom' ? getEnteringAnimation() : undefined}
    >
      {children}
    </Animated.View>
  );
}

// Convenience components with preset configurations
export function StaggeredListItem({
  index,
  children,
  ...props
}: Omit<AnimatedContainerProps, 'staggerIndex' | 'entrance'> & {
  index: number;
}) {
  return (
    <AnimatedContainer entrance="staggered" staggerIndex={index} {...props}>
      {children}
    </AnimatedContainer>
  );
}

export function PressableCard({
  children,
  onPress,
  ...props
}: Omit<AnimatedContainerProps, 'pressable'> & { onPress: () => void }) {
  return (
    <AnimatedContainer
      pressable
      entrance="fadeIn"
      pressScale="normal"
      onPress={onPress}
      {...props}
    >
      {children}
    </AnimatedContainer>
  );
}

export function EntranceCard({
  delay = 0,
  children,
  ...props
}: Omit<AnimatedContainerProps, 'entrance' | 'entranceDelay'> & {
  delay?: number;
}) {
  return (
    <AnimatedContainer
      entrance="slideInDown"
      entranceDelay={delay}
      springPreset="gentle"
      {...props}
    >
      {children}
    </AnimatedContainer>
  );
}
