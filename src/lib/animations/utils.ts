/**
 * Animation utility functions
 * Common animation patterns and helpers
 */

import {
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import {
  SPRING_PRESETS,
  TIMING_PRESETS,
  STAGGER_DELAYS,
  PRESS_SCALES,
  ENTRANCE_VALUES,
  type SpringPreset,
  type TimingPreset,
  type StaggerDelay,
  type PressScale,
} from './presets';

// Animation helper functions

/**
 * Create a spring animation with preset configuration
 */
export function spring(toValue: number, preset: SpringPreset = 'gentle') {
  return withSpring(toValue, SPRING_PRESETS[preset]);
}

/**
 * Create a timing animation with preset configuration
 */
export function timing(toValue: number, preset: TimingPreset = 'normal') {
  return withTiming(toValue, TIMING_PRESETS[preset]);
}

/**
 * Create a staggered animation with delay
 */
export function staggered(
  toValue: number,
  index: number,
  staggerDelay: StaggerDelay = 'normal',
  preset: SpringPreset = 'gentle'
) {
  return withDelay(
    index * STAGGER_DELAYS[staggerDelay],
    withSpring(toValue, SPRING_PRESETS[preset])
  );
}

/**
 * Create entrance animation sequence (opacity + translateY)
 */
export function entranceSequence(
  opacity: SharedValue<number>,
  translateY: SharedValue<number>,
  delay: number = 0,
  preset: SpringPreset = 'gentle'
) {
  'worklet';

  opacity.value = withDelay(delay, withSpring(1, SPRING_PRESETS[preset]));
  translateY.value = withDelay(delay, withSpring(0, SPRING_PRESETS[preset]));
}

/**
 * Create scale entrance animation
 */
export function scaleEntrance(
  scale: SharedValue<number>,
  delay: number = 0,
  preset: SpringPreset = 'bouncy'
) {
  'worklet';

  scale.value = withDelay(delay, withSpring(1, SPRING_PRESETS[preset]));
}

/**
 * Press animation handlers with haptic feedback
 */
export function createPressHandlers(
  scale: SharedValue<number>,
  pressScale: PressScale = 'normal',
  hapticType: ImpactFeedbackStyle = ImpactFeedbackStyle.Light
) {
  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(
      PRESS_SCALES[pressScale],
      SPRING_PRESETS.ultraQuick
    );
    runOnJS(impactAsync)(hapticType);
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, SPRING_PRESETS.snappy);
  };

  return { handlePressIn, handlePressOut };
}

/**
 * Slide animation (for sidebars, modals)
 */
export function slideAnimation(
  translateX: SharedValue<number>,
  toValue: number,
  preset: TimingPreset = 'sidebar'
) {
  'worklet';
  return withTiming(toValue, TIMING_PRESETS[preset]);
}

/**
 * Bounce animation sequence (scale up then down)
 */
export function bounceSequence(
  scale: SharedValue<number>,
  bounceScale: number = 1.1
) {
  'worklet';

  scale.value = withSequence(
    withSpring(bounceScale, SPRING_PRESETS.quick),
    withSpring(1, SPRING_PRESETS.gentle)
  );
}

/**
 * Fade animation with timing
 */
export function fadeAnimation(
  opacity: SharedValue<number>,
  toValue: number,
  preset: TimingPreset = 'normal'
) {
  'worklet';
  return withTiming(toValue, TIMING_PRESETS[preset]);
}

/**
 * Initialize entrance values
 */
export function initializeEntranceValues(
  opacity: SharedValue<number>,
  translateY: SharedValue<number>,
  scale?: SharedValue<number>
) {
  'worklet';

  opacity.value = ENTRANCE_VALUES.opacityFrom;
  translateY.value = ENTRANCE_VALUES.slideDistance;
  if (scale) {
    scale.value = ENTRANCE_VALUES.scaleFrom;
  }
}

/**
 * Reset animation values to default state
 */
export function resetValues(values: Record<string, SharedValue<number>>) {
  'worklet';

  Object.entries(values).forEach(([key, sharedValue]) => {
    switch (key) {
      case 'opacity':
        sharedValue.value = 1;
        break;
      case 'scale':
        sharedValue.value = 1;
        break;
      case 'translateX':
      case 'translateY':
        sharedValue.value = 0;
        break;
      default:
        sharedValue.value = 0;
    }
  });
}
