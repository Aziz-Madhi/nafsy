/**
 * Animation hooks
 * Custom hooks for common animation patterns
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import {
  spring,
  staggered,
  entranceSequence,
  createPressHandlers,
  slideAnimation,
  bounceSequence,
  fadeAnimation,
  initializeEntranceValues,
} from './utils';
import {
  type SpringPreset,
  type TimingPreset,
  type StaggerDelay,
  type PressScale,
} from './presets';

/**
 * Hook for staggered list animations
 */
export function useStaggeredAnimation(
  items: any[],
  staggerDelay: StaggerDelay = 'normal',
  springPreset: SpringPreset = 'gentle'
) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const triggerAnimation = (index: number) => {
    opacity.value = staggered(1, index, staggerDelay, springPreset);
    translateY.value = staggered(0, index, staggerDelay, springPreset);
  };

  return {
    animatedStyle,
    triggerAnimation,
    reset: () => {
      opacity.value = 0;
      translateY.value = 20;
    },
  };
}

/**
 * Hook for press animations with haptic feedback
 */
export function usePressAnimation(
  pressScale: PressScale = 'normal',
  hapticType: ImpactFeedbackStyle = ImpactFeedbackStyle.Light,
  onPress?: () => void
) {
  const scale = useSharedValue(1);
  const pressHandlers = createPressHandlers(scale, pressScale, hapticType);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (onPress) {
      runOnJS(onPress)();
    }
  };

  return {
    animatedStyle,
    pressIn: pressHandlers.handlePressIn,
    pressOut: pressHandlers.handlePressOut,
    onPress: handlePress,
  };
}

/**
 * Hook for entrance animations
 */
export function useEntranceAnimation(
  delay: number = 0,
  springPreset: SpringPreset = 'gentle',
  autoTrigger: boolean = true
) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.8);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const triggerAnimation = () => {
    entranceSequence(opacity, translateY, delay, springPreset);
    scale.value = spring(1, 'bouncy');
  };

  useEffect(() => {
    if (autoTrigger) {
      initializeEntranceValues(opacity, translateY, scale);
      triggerAnimation();
    }
  }, [autoTrigger]);

  return {
    animatedStyle,
    triggerAnimation,
    reset: () => initializeEntranceValues(opacity, translateY, scale),
  };
}

/**
 * Hook for slide animations (sidebars, modals)
 */
export function useSlideAnimation(
  direction: 'left' | 'right' | 'up' | 'down' = 'left',
  distance: number = 300
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const slideIn = () => {
    switch (direction) {
      case 'left':
        translateX.value = slideAnimation(translateX, -distance, 'sidebar');
        break;
      case 'right':
        translateX.value = slideAnimation(translateX, distance, 'sidebar');
        break;
      case 'up':
        translateY.value = slideAnimation(translateY, -distance, 'sidebar');
        break;
      case 'down':
        translateY.value = slideAnimation(translateY, distance, 'sidebar');
        break;
    }
  };

  const slideOut = () => {
    translateX.value = slideAnimation(translateX, 0, 'sidebar');
    translateY.value = slideAnimation(translateY, 0, 'sidebar');
  };

  return {
    animatedStyle,
    slideIn,
    slideOut,
    reset: slideOut,
  };
}

/**
 * Hook for bounce animation
 */
export function useBounceAnimation() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bounce = (bounceScale: number = 1.1) => {
    bounceSequence(scale, bounceScale);
  };

  return {
    animatedStyle,
    bounce,
  };
}

/**
 * Hook for fade animations
 */
export function useFadeAnimation(
  initialValue: number = 1,
  preset: TimingPreset = 'normal'
) {
  const opacity = useSharedValue(initialValue);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const fadeIn = () => {
    opacity.value = fadeAnimation(opacity, 1, preset);
  };

  const fadeOut = () => {
    opacity.value = fadeAnimation(opacity, 0, preset);
  };

  const fadeTo = (value: number) => {
    opacity.value = fadeAnimation(opacity, value, preset);
  };

  return {
    animatedStyle,
    fadeIn,
    fadeOut,
    fadeTo,
    opacity,
  };
}

/**
 * Hook for morphing animations (like tab bar)
 */
export function useMorphAnimation() {
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const borderRadius = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    height: height.value,
    borderRadius: borderRadius.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const morphTo = (
    newWidth: number,
    newHeight: number,
    newBorderRadius: number,
    newTranslateX: number = 0,
    newTranslateY: number = 0,
    preset: SpringPreset = 'gentle'
  ) => {
    width.value = spring(newWidth, preset);
    height.value = spring(newHeight, preset);
    borderRadius.value = spring(newBorderRadius, preset);
    translateX.value = spring(newTranslateX, preset);
    translateY.value = spring(newTranslateY, preset);
  };

  return {
    animatedStyle,
    morphTo,
    values: { width, height, borderRadius, translateX, translateY },
  };
}
