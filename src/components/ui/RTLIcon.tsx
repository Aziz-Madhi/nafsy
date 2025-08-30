import React from 'react';
import { View } from 'react-native';
import { useIsCurrentLanguageRTL } from '~/lib/rtl-utils';

interface RTLIconProps {
  children: React.ReactNode;
  /**
   * Whether the icon should flip in RTL mode
   * @default true
   */
  shouldFlip?: boolean;
  /**
   * Custom RTL state override (for testing or special cases)
   */
  forceRTL?: boolean;
}

/**
 * RTL-aware icon wrapper that automatically flips directional icons in RTL layouts
 *
 * Examples of icons that should flip:
 * - Arrows (left/right, chevrons)
 * - Navigation icons (back, forward)
 * - Directional shapes
 *
 * Examples of icons that should NOT flip:
 * - Numbers, text
 * - Symmetrical icons (circle, square)
 * - Logos, brands
 * - Up/down arrows (vertical)
 */
export const RTLIcon: React.FC<RTLIconProps> = ({
  children,
  shouldFlip = true,
  forceRTL,
}) => {
  const isRTLFromStore = useIsCurrentLanguageRTL();

  // Determine if we should actually flip
  const isRTL = forceRTL !== undefined ? forceRTL : isRTLFromStore;
  const shouldApplyFlip = shouldFlip && isRTL;

  if (!shouldApplyFlip) {
    return <>{children}</>;
  }

  return (
    <View
      style={{
        transform: [{ scaleX: -1 }],
      }}
    >
      {children}
    </View>
  );
};

/**
 * Hook to determine if current language is RTL (for text direction only)
 * UI layout always stays LTR
 */
export const useRTLDirection = () => {
  const isRTLFromStore = useIsCurrentLanguageRTL();

  return {
    isRTL: isRTLFromStore,
    // Note: isRTLNative removed to avoid stale state during app initialization
    // Use isRTL which is consistent with store state
    // Helper for conditional styles
    direction: isRTLFromStore ? 'rtl' : 'ltr',
  };
};

/**
 * Hook to get directional values based on RTL state
 * Useful for dynamic styling based on RTL state
 */
export const useDirectionalValue = <T,>(
  ltrValue: T,
  rtlValue: T,
  isRTL?: boolean
): T => {
  const isRTLFromStore = useIsCurrentLanguageRTL();
  const rtl = isRTL !== undefined ? isRTL : isRTLFromStore;
  return rtl ? rtlValue : ltrValue;
};

/**
 * Utility function to get directional values
 * For use in non-React contexts - requires explicit isRTL parameter
 */
export const getDirectionalValue = <T,>(
  ltrValue: T,
  rtlValue: T,
  isRTL: boolean
): T => {
  return isRTL ? rtlValue : ltrValue;
};

export default RTLIcon;
