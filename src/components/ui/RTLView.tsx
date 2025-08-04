import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTranslation } from '~/hooks/useTranslation';

interface RTLViewProps extends ViewProps {
  children: React.ReactNode;
  rtlStyle?: any;
  ltrStyle?: any;
}

/**
 * RTLView - Optional RTL-aware container component
 *
 * Use this component when you explicitly want different styles or layouts
 * based on the current language direction. This is opt-in behavior.
 *
 * Note: After the RTL layout fix, most components should NOT need RTL layout changes.
 * Text components automatically handle RTL text alignment without affecting overall layout.
 */
export function RTLView({
  children,
  style,
  rtlStyle,
  ltrStyle,
  ...props
}: RTLViewProps) {
  const { isRTL } = useTranslation();

  // Merge styles based on direction
  const directionStyle = isRTL ? rtlStyle : ltrStyle;
  const combinedStyle = [style, directionStyle];

  return (
    <View style={combinedStyle} {...props}>
      {children}
    </View>
  );
}

/**
 * RTLFlex - Optional RTL-aware flex direction component
 *
 * Use this component ONLY when you explicitly need the flex direction to change
 * based on language direction. This is now opt-in behavior.
 *
 * Most UI components should maintain consistent layout regardless of language.
 * Use this only for specific content like text flow or directional navigation.
 */
interface RTLFlexProps extends ViewProps {
  children: React.ReactNode;
  reverse?: boolean;
}

export function RTLFlex({
  children,
  style,
  reverse = false,
  ...props
}: RTLFlexProps) {
  const { isRTL } = useTranslation();

  const flexDirection = isRTL
    ? reverse
      ? 'row'
      : 'row-reverse'
    : reverse
      ? 'row-reverse'
      : 'row';

  const rtlStyle = [style, { flexDirection }];

  return (
    <View style={rtlStyle} {...props}>
      {children}
    </View>
  );
}

/**
 * RTLTextContainer - Optional RTL-aware container alignment
 *
 * Use this for containers that need different alignment based on text direction.
 * This is now opt-in behavior - most containers should maintain consistent alignment.
 *
 * Note: Regular Text components handle their own RTL alignment automatically.
 */
interface RTLTextContainerProps extends ViewProps {
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
}

export function RTLTextContainer({
  children,
  style,
  align = 'start',
  ...props
}: RTLTextContainerProps) {
  const { isRTL } = useTranslation();

  let alignItems: 'flex-start' | 'flex-end' | 'center' = 'flex-start';

  if (align === 'center') {
    alignItems = 'center';
  } else if (align === 'start') {
    alignItems = isRTL ? 'flex-end' : 'flex-start';
  } else if (align === 'end') {
    alignItems = isRTL ? 'flex-start' : 'flex-end';
  }

  const rtlStyle = [style, { alignItems }];

  return (
    <View style={rtlStyle} {...props}>
      {children}
    </View>
  );
}

// Helper for RTL-aware margins
export const useRTLMargins = () => {
  const { isRTL } = useTranslation();

  return {
    marginStart: (value: number) =>
      isRTL ? { marginRight: value } : { marginLeft: value },
    marginEnd: (value: number) =>
      isRTL ? { marginLeft: value } : { marginRight: value },
    paddingStart: (value: number) =>
      isRTL ? { paddingRight: value } : { paddingLeft: value },
    paddingEnd: (value: number) =>
      isRTL ? { paddingLeft: value } : { paddingRight: value },
  };
};

// Helper for RTL-aware positions
export const useRTLPositions = () => {
  const { isRTL } = useTranslation();

  return {
    positionStart: (value: number) =>
      isRTL ? { right: value } : { left: value },
    positionEnd: (value: number) =>
      isRTL ? { left: value } : { right: value },
  };
};
