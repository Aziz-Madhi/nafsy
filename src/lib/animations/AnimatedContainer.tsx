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

  // Initialize and trigger entrance animations
  useEffect(() => {
    if (animateOnMount && entrance === 'custom') {
      initializeEntranceValues(opacity, translateY, scale);

      if (staggerIndex !== undefined) {
        // Staggered entrance
        opacity.value = staggered(1, staggerIndex, staggerDelay, springPreset);
        translateY.value = staggered(
          0,
          staggerIndex,
          staggerDelay,
          springPreset
        );
        if (entrance === 'scale') {
          scale.value = staggered(1, staggerIndex, staggerDelay, 'bouncy');
        }
      } else {
        // Regular entrance with delay
        entranceSequence(opacity, translateY, entranceDelay, springPreset);
        if (entrance === 'scale') {
          scaleEntrance(scale, entranceDelay, 'bouncy');
        }
      }
    }
  }, [
    animateOnMount,
    entrance,
    entranceDelay,
    staggerIndex,
    staggerDelay,
    springPreset,
  ]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Built-in Reanimated entering animations (more performant)
  const getEnteringAnimation = () => {
    const delay =
      staggerIndex !== undefined
        ? entranceDelay +
          staggerIndex *
            (staggerDelay === 'quick'
              ? 50
              : staggerDelay === 'slow'
                ? 150
                : 100)
        : entranceDelay;

    switch (entrance) {
      case 'fadeIn':
        return FadeIn.delay(delay).springify();
      case 'slideInDown':
        return FadeInDown.delay(delay).springify();
      case 'slideInUp':
        return FadeInUp.delay(delay).springify();
      case 'slideInLeft':
        return FadeInLeft.delay(delay).springify();
      case 'slideInRight':
        return FadeInRight.delay(delay).springify();
      case 'scale':
        return FadeIn.delay(delay).springify().damping(8).stiffness(200);
      case 'staggered':
        return FadeInDown.delay(delay).springify().damping(15).stiffness(150);
      default:
        return undefined;
    }
  };

  // Choose component based on pressable requirement
  if (pressable && pressHandlers) {
    return (
      <Animated.View
        style={[animatedStyle]}
        className={className}
        entering={entrance !== 'custom' ? getEnteringAnimation() : undefined}
      >
        <Pressable
          style={style}
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
      style={[style, entrance === 'custom' ? animatedStyle : style]}
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
