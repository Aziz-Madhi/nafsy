import { I18nManager } from 'react-native';

/**
 * RTL Utility functions for React Native with NativeWind
 * These utilities help with RTL-aware styling and layout
 */

/**
 * Get RTL-aware directional class names for NativeWind
 */
export const getRTLDirectionalClass = {
  /**
   * Margin classes that adapt to RTL
   */
  marginStart: (value: string) => `ms-${value}`,
  marginEnd: (value: string) => `me-${value}`,

  /**
   * Padding classes that adapt to RTL
   */
  paddingStart: (value: string) => `ps-${value}`,
  paddingEnd: (value: string) => `pe-${value}`,

  /**
   * Text alignment that adapts to RTL
   */
  textStart: 'text-start',
  textEnd: 'text-end',

  /**
   * Border classes that adapt to RTL
   */
  borderStart: (value: string) => `border-s-${value}`,
  borderEnd: (value: string) => `border-e-${value}`,

  /**
   * Positioning classes (these need manual handling)
   */
  start: (value: string) => `start-${value}`,
  end: (value: string) => `end-${value}`,
};

/**
 * Convert directional classes to RTL-aware logical properties
 */
export const convertToLogicalProperties = (className: string): string => {
  return (
    className
      // Margin conversions
      .replace(/\bml-(\w+)\b/g, 'ms-$1')
      .replace(/\bmr-(\w+)\b/g, 'me-$1')
      // Padding conversions
      .replace(/\bpl-(\w+)\b/g, 'ps-$1')
      .replace(/\bpr-(\w+)\b/g, 'pe-$1')
      // Text alignment conversions
      .replace(/\btext-left\b/g, 'text-start')
      .replace(/\btext-right\b/g, 'text-end')
      // Border conversions
      .replace(/\bborder-l-(\w+)\b/g, 'border-s-$1')
      .replace(/\bborder-r-(\w+)\b/g, 'border-e-$1')
  );
};

/**
 * Get flex direction based on RTL state
 */
export const getFlexDirection = (isRTL: boolean, reverse: boolean = false) => {
  if (reverse) {
    return isRTL ? 'flex-row' : 'flex-row-reverse';
  }
  return isRTL ? 'flex-row-reverse' : 'flex-row';
};

/**
 * Get text alignment based on RTL and desired alignment
 */
export const getTextAlignment = (
  alignment: 'start' | 'end' | 'center',
  isRTL: boolean
) => {
  switch (alignment) {
    case 'start':
      return isRTL ? 'text-right' : 'text-left';
    case 'end':
      return isRTL ? 'text-left' : 'text-right';
    case 'center':
      return 'text-center';
    default:
      return 'text-start';
  }
};

/**
 * RTL-aware conditional classes utility
 * @param ltrClass - Class to use for LTR layout
 * @param rtlClass - Class to use for RTL layout  
 * @param isRTL - RTL state (required - do not use I18nManager.isRTL fallback)
 */
export const rtlClass = (
  ltrClass: string,
  rtlClass: string,
  isRTL: boolean
): string => {
  return isRTL ? rtlClass : ltrClass;
};

/**
 * Combine multiple classes with RTL awareness
 */
export const rtlClasses = (...args: (string | undefined | false)[]): string => {
  return args
    .filter(Boolean)
    .map((cls) =>
      typeof cls === 'string' ? convertToLogicalProperties(cls) : ''
    )
    .join(' ')
    .trim();
};

/**
 * Helper to get icon rotation for RTL
 */
export const getIconRotation = (
  isRTL: boolean,
  shouldFlip: boolean = true
): number => {
  return isRTL && shouldFlip ? 180 : 0;
};

/**
 * RTL-aware positioning utilities
 */
export const getRTLPosition = {
  /**
   * Get left/right position values
   * @param isRTL - RTL state (required - do not use I18nManager.isRTL fallback)
   */
  horizontal: (leftValue: number, rightValue: number, isRTL: boolean) => {
    return isRTL
      ? { right: leftValue, left: rightValue }
      : { left: leftValue, right: rightValue };
  },

  /**
   * Get transform values for RTL
   * @param isRTL - RTL state (required - do not use I18nManager.isRTL fallback)
   */
  transform: (translateX: number, isRTL: boolean) => {
    return isRTL ? -translateX : translateX;
  },
};

/**
 * Layout direction helpers
 * @deprecated These functions read I18nManager.isRTL which can be stale during app initialization
 * Use useIsRTL() hook from useAppStore instead for consistent RTL state
 */
export const layoutDirection = {
  /**
   * @deprecated Use useIsRTL() hook from useAppStore instead
   */
  isRTL: () => {
    console.warn('layoutDirection.isRTL() is deprecated. Use useIsRTL() hook from useAppStore for consistent RTL state.');
    return I18nManager.isRTL;
  },
  
  /**
   * @deprecated Use useIsRTL() hook from useAppStore instead
   */
  direction: () => {
    console.warn('layoutDirection.direction() is deprecated. Use useIsRTL() hook from useAppStore for consistent RTL state.');
    return I18nManager.isRTL ? 'rtl' : 'ltr';
  },

  /**
   * Force layout direction update - for internal use only
   * @deprecated RTL should be applied during app initialization only
   */
  forceUpdate: (isRTL: boolean) => {
    console.warn('layoutDirection.forceUpdate() is deprecated. RTL should be applied during app initialization only.');
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  },
};

/**
 * Common RTL-aware style patterns
 */
export const rtlStyles = {
  /**
   * Chat bubble alignment
   */
  chatBubble: (isUser: boolean, isRTL: boolean) => ({
    alignSelf: isUser
      ? isRTL
        ? 'flex-start'
        : 'flex-end'
      : isRTL
        ? 'flex-end'
        : 'flex-start',
  }),

  /**
   * Navigation header alignment
   */
  headerButton: (position: 'start' | 'end', isRTL: boolean) => {
    const isStart = position === 'start';
    return {
      alignSelf: isStart
        ? isRTL
          ? 'flex-end'
          : 'flex-start'
        : isRTL
          ? 'flex-start'
          : 'flex-end',
    };
  },
};

export default {
  getRTLDirectionalClass,
  convertToLogicalProperties,
  getFlexDirection,
  getTextAlignment,
  rtlClass,
  rtlClasses,
  getIconRotation,
  getRTLPosition,
  layoutDirection,
  rtlStyles,
};
