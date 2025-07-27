import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './text';
import { useTranslation } from '~/hooks/useTranslation';

interface UniversalScreenTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  style?: any;
}

/**
 * Universal screen title component that ensures consistent positioning
 * across all screens with proper safe area handling.
 *
 * Fixes clipping issues and provides unified spacing.
 */
export function UniversalScreenTitle({
  title,
  subtitle,
  className,
  style,
}: UniversalScreenTitleProps) {
  const insets = useSafeAreaInsets();

  // Safely get translation hook
  let locale = 'en';
  try {
    const translation = useTranslation();
    locale = translation.locale;
  } catch (error) {
    console.warn(
      'UniversalScreenTitle: useTranslation failed, using fallback locale:',
      error
    );
  }

  // For EdgeToEdgeScrollView context, reduce spacing to reclaim top area
  const topSpacing = 4;

  return (
    <View
      className={`px-6 pb-4 ${className || ''}`}
      style={[{ paddingTop: topSpacing }, style]}
    >
      <Text
        className="text-[#5A4A3A]"
        style={{
          fontFamily: 'CrimsonPro-Bold',
          fontSize: 34,
          fontWeight: 'normal',
          lineHeight: 42,
          textAlign: locale === 'ar' ? 'right' : 'left',
        }}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          variant="caption1"
          className="text-[#5A4A3A]/70 mt-1"
          style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export default UniversalScreenTitle;
