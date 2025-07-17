import { I18nManager } from 'react-native';
import { isRTL } from './i18n';

// RTL layout utilities
export const RTLUtils = {
  // Check if RTL is enabled
  isRTL: (): boolean => {
    return isRTL();
  },

  // Force RTL layout (requires app restart)
  forceRTL: (enable: boolean): void => {
    I18nManager.forceRTL(enable);
  },

  // Check if RTL is allowed
  isRTLAllowed: (): boolean => {
    return I18nManager.isRTL;
  },

  // Get margin/padding for RTL
  getMarginStart: (value: number): { marginLeft?: number; marginRight?: number } => {
    return isRTL() ? { marginRight: value } : { marginLeft: value };
  },

  getMarginEnd: (value: number): { marginLeft?: number; marginRight?: number } => {
    return isRTL() ? { marginLeft: value } : { marginRight: value };
  },

  getPaddingStart: (value: number): { paddingLeft?: number; paddingRight?: number } => {
    return isRTL() ? { paddingRight: value } : { paddingLeft: value };
  },

  getPaddingEnd: (value: number): { paddingLeft?: number; paddingRight?: number } => {
    return isRTL() ? { paddingLeft: value } : { paddingRight: value };
  },

  // Get position for RTL
  getPositionStart: (value: number): { left?: number; right?: number } => {
    return isRTL() ? { right: value } : { left: value };
  },

  getPositionEnd: (value: number): { left?: number; right?: number } => {
    return isRTL() ? { left: value } : { right: value };
  },

  // Get border radius for RTL
  getBorderRadiusStart: (value: number): { borderTopLeftRadius?: number; borderTopRightRadius?: number; borderBottomLeftRadius?: number; borderBottomRightRadius?: number } => {
    return isRTL() 
      ? { borderTopRightRadius: value, borderBottomRightRadius: value }
      : { borderTopLeftRadius: value, borderBottomLeftRadius: value };
  },

  getBorderRadiusEnd: (value: number): { borderTopLeftRadius?: number; borderTopRightRadius?: number; borderBottomLeftRadius?: number; borderBottomRightRadius?: number } => {
    return isRTL() 
      ? { borderTopLeftRadius: value, borderBottomLeftRadius: value }
      : { borderTopRightRadius: value, borderBottomRightRadius: value };
  },

  // Get transform for RTL
  getScaleX: (): number => {
    return isRTL() ? -1 : 1;
  },

  // Get text alignment
  getTextAlign: (): 'left' | 'right' | 'center' => {
    return isRTL() ? 'right' : 'left';
  },

  // Get flex direction
  getFlexDirection: (): 'row' | 'row-reverse' => {
    return isRTL() ? 'row-reverse' : 'row';
  },

  // Get writing direction
  getWritingDirection: (): 'ltr' | 'rtl' => {
    return isRTL() ? 'rtl' : 'ltr';
  },

  // Transform style object for RTL
  transformStyle: (style: any): any => {
    if (!style || typeof style !== 'object') return style;

    const transformedStyle = { ...style };

    // Handle margin
    if (style.marginLeft !== undefined && style.marginRight !== undefined) {
      if (isRTL()) {
        transformedStyle.marginLeft = style.marginRight;
        transformedStyle.marginRight = style.marginLeft;
      }
    }

    // Handle padding
    if (style.paddingLeft !== undefined && style.paddingRight !== undefined) {
      if (isRTL()) {
        transformedStyle.paddingLeft = style.paddingRight;
        transformedStyle.paddingRight = style.paddingLeft;
      }
    }

    // Handle position
    if (style.left !== undefined && style.right !== undefined) {
      if (isRTL()) {
        transformedStyle.left = style.right;
        transformedStyle.right = style.left;
      }
    }

    return transformedStyle;
  }
};

// Higher-order component for RTL support
export const withRTL = <T extends object>(Component: React.ComponentType<T>) => {
  return (props: T) => {
    const rtlProps = {
      ...props,
      style: RTLUtils.transformStyle((props as any).style),
    };
    return <Component {...rtlProps} />;
  };
};

// Custom hook for RTL utilities
export const useRTL = () => {
  return {
    isRTL: RTLUtils.isRTL(),
    getFlexDirection: RTLUtils.getFlexDirection,
    getTextAlign: RTLUtils.getTextAlign,
    getMarginStart: RTLUtils.getMarginStart,
    getMarginEnd: RTLUtils.getMarginEnd,
    getPaddingStart: RTLUtils.getPaddingStart,
    getPaddingEnd: RTLUtils.getPaddingEnd,
    transformStyle: RTLUtils.transformStyle,
  };
};