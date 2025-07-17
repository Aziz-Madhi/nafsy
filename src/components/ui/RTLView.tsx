import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTranslation } from '~/hooks/useTranslation';

interface RTLViewProps extends ViewProps {
  children: React.ReactNode;
  rtlStyle?: any;
  ltrStyle?: any;
}

export function RTLView({ children, style, rtlStyle, ltrStyle, ...props }: RTLViewProps) {
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

// Helper component for RTL-aware flex direction
interface RTLFlexProps extends ViewProps {
  children: React.ReactNode;
  reverse?: boolean;
}

export function RTLFlex({ children, style, reverse = false, ...props }: RTLFlexProps) {
  const { isRTL } = useTranslation();
  
  const flexDirection = isRTL 
    ? (reverse ? 'row' : 'row-reverse') 
    : (reverse ? 'row-reverse' : 'row');
  
  const rtlStyle = [
    style,
    { flexDirection }
  ];
  
  return (
    <View style={rtlStyle} {...props}>
      {children}
    </View>
  );
}

// Helper component for RTL-aware text alignment
interface RTLTextContainerProps extends ViewProps {
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
}

export function RTLTextContainer({ children, style, align = 'start', ...props }: RTLTextContainerProps) {
  const { isRTL } = useTranslation();
  
  let alignItems: 'flex-start' | 'flex-end' | 'center' = 'flex-start';
  
  if (align === 'center') {
    alignItems = 'center';
  } else if (align === 'start') {
    alignItems = isRTL ? 'flex-end' : 'flex-start';
  } else if (align === 'end') {
    alignItems = isRTL ? 'flex-start' : 'flex-end';
  }
  
  const rtlStyle = [
    style,
    { alignItems }
  ];
  
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
    marginStart: (value: number) => isRTL ? { marginRight: value } : { marginLeft: value },
    marginEnd: (value: number) => isRTL ? { marginLeft: value } : { marginRight: value },
    paddingStart: (value: number) => isRTL ? { paddingRight: value } : { paddingLeft: value },
    paddingEnd: (value: number) => isRTL ? { paddingLeft: value } : { paddingRight: value },
  };
};

// Helper for RTL-aware positions
export const useRTLPositions = () => {
  const { isRTL } = useTranslation();
  
  return {
    positionStart: (value: number) => isRTL ? { right: value } : { left: value },
    positionEnd: (value: number) => isRTL ? { left: value } : { right: value },
  };
};