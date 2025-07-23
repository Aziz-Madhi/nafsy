/**
 * Animation Presets for React Native Reanimated
 * Standardized configurations for consistent animations across the app
 */

import type {
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated';

// Spring animation presets based on analysis of existing patterns
export const SPRING_PRESETS = {
  // Gentle animations for most UI transitions (damping: 15, stiffness: 150)
  gentle: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  } satisfies WithSpringConfig,

  // Bouncy animations for scale effects (damping: 8, stiffness: 200)
  bouncy: {
    damping: 8,
    stiffness: 200,
    mass: 1,
  } satisfies WithSpringConfig,

  // Snappy animations for press feedback (damping: 15, stiffness: 400)
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 1,
  } satisfies WithSpringConfig,

  // Quick animations for rapid interactions (damping: 10, stiffness: 300)
  quick: {
    damping: 10,
    stiffness: 300,
    mass: 1,
  } satisfies WithSpringConfig,

  // Ultra-quick for immediate feedback (damping: 12, stiffness: 400)
  ultraQuick: {
    damping: 12,
    stiffness: 400,
    mass: 1,
  } satisfies WithSpringConfig,
} as const;

// Timing animation presets
export const TIMING_PRESETS = {
  fast: { duration: 150 } satisfies WithTimingConfig,
  normal: { duration: 300 } satisfies WithTimingConfig,
  slow: { duration: 500 } satisfies WithTimingConfig,
  sidebar: { duration: 300 } satisfies WithTimingConfig, // Common for slide animations
} as const;

// Stagger timing constants
export const STAGGER_DELAYS = {
  quick: 50, // Quick succession
  normal: 100, // Standard stagger
  slow: 150, // Slow reveal
} as const;

// Press interaction scales
export const PRESS_SCALES = {
  subtle: 0.98, // Minimal feedback
  normal: 0.95, // Standard press
  strong: 0.92, // Pronounced feedback
} as const;

// Entrance animation values
export const ENTRANCE_VALUES = {
  slideDistance: 20, // Default slide distance for entrance
  scaleFrom: 0.8, // Default scale start value
  opacityFrom: 0, // Default opacity start value
} as const;

export type SpringPreset = keyof typeof SPRING_PRESETS;
export type TimingPreset = keyof typeof TIMING_PRESETS;
export type StaggerDelay = keyof typeof STAGGER_DELAYS;
export type PressScale = keyof typeof PRESS_SCALES;
