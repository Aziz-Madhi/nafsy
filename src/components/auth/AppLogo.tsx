import React from 'react';
import { View, Image } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useColors } from '~/hooks/useColors';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export function AppLogo({ size = 'medium', showIcon = true }: AppLogoProps) {
  const colors = useColors();

  const sizeMap = {
    small: 48,
    medium: 64,
    large: 80,
  };

  const iconSize = sizeMap[size];

  if (showIcon) {
    // Try to use the app icon if available, otherwise use a fallback icon
    try {
      return (
        <View className="items-center justify-center">
          <Image
            source={require('../../../assets/icon.png')}
            style={{ width: iconSize, height: iconSize }}
            resizeMode="contain"
          />
        </View>
      );
    } catch {
      // Fallback to a heart icon if image not found
      return (
        <View
          className="items-center justify-center rounded-2xl"
          style={{
            width: iconSize,
            height: iconSize,
            backgroundColor: colors.primary + '15',
          }}
        >
          <Heart
            size={iconSize * 0.6}
            color={colors.primary}
            strokeWidth={1.5}
            fill={colors.primary}
          />
        </View>
      );
    }
  }

  return null;
}
