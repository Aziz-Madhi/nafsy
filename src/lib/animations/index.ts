/**
 * Animation system entry point
 * Consolidated animation utilities, components, and hooks
 */

// Presets and constants
export * from './presets';

// Utility functions
export * from './utils';

// Main components
export * from './AnimatedContainer';

// Hooks
export * from './hooks';

// Re-export commonly used Reanimated components with consistent naming
export {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  ZoomIn,
  ZoomOut,
  FlipInXUp,
  FlipInYLeft,
  RotateInDownLeft,
  RotateInUpRight,
  PinwheelIn,
  LinearTransition,
  FadingTransition,
  SequencedTransition,
} from 'react-native-reanimated';
