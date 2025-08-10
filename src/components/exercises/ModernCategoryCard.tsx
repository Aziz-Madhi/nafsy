import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  ImageBackground,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { Text } from '~/components/ui/text';
import { useColors, useShadowStyle } from '~/hooks/useColors';
import type { WellnessCategory } from '~/lib/colors';

interface ModernCategoryCardProps {
  category: {
    id: WellnessCategory;
    name: string;
    description: string;
    color: string;
    icon: string;
  };
  onPress: (categoryId: string) => void;
  index: number;
  height: number;
}

// Background image mapping
const CATEGORY_BACKGROUNDS: Record<string, ImageSourcePropType> = {
  Mindfulness: require('../../../assets/mindfulness-card.png'),
  Movement: require('../../../assets/movement-card.png'),
  Breathing: require('../../../assets/breathing-card.jpg'),
  Journaling: require('../../../assets/journaling-card.png'),
  Relaxation: require('../../../assets/relaxation-card.png'),
  Reminders: require('../../../assets/reminders-card.png'),
};

function ModernCategoryCardComponent({
  category,
  onPress,
  index,
  height,
}: ModernCategoryCardProps) {
  // CRITICAL FIX: Initialize image as loaded to prevent flicker during navigation
  // Only show loading for genuinely slow-loading images
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const backgroundImage = CATEGORY_BACKGROUNDS[category.name];

  // Colors for React Native styling
  const colors = useColors();
  const shadowStyle = useShadowStyle('medium');

  // Use actual mood screen colors with light opacity for text readability
  const getMoodColor = (categoryId: string) => {
    const exerciseColors: Record<string, string> = {
      mindfulness: '#EF4444', // From your mood screen
      breathing: '#06B6D4', // From your mood screen
      movement: '#3B82F6', // From your mood screen
      journaling: '#10B981', // From your mood screen
      relaxation: '#F59E0B', // From your mood screen
      reminders: '#8B5CF6', // From your mood screen
    };
    return exerciseColors[categoryId] || '#FAFAFA';
  };

  // Use light opacity so text is visible
  const baseColor = getMoodColor(category.id);
  const textBackgroundColor = baseColor + '15'; // 15% opacity for readability

  const handlePress = useCallback(() => {
    onPress(category.id);
  }, [onPress, category.id]);

  // Calculate proportions - 65% image, 35% text - Memoized for performance
  const { imageHeight, textHeight } = useMemo(
    () => ({
      imageHeight: height * 0.65,
      textHeight: height * 0.35,
    }),
    [height]
  );

  return (
    <Pressable
      className="bg-white rounded-3xl overflow-hidden"
      style={{
        height: height,
        ...shadowStyle,
      }}
      onPress={handlePress}
    >
      {/* Image Section - No overlay */}
      {backgroundImage && !imageError ? (
        <>
          {imageLoading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: imageHeight,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: textBackgroundColor,
              }}
            >
              <ActivityIndicator size="large" color="#999" />
            </View>
          )}
          <ImageBackground
            source={backgroundImage}
            style={{ height: imageHeight, width: '100%' }}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </>
      ) : (
        /* Fallback colored section if no image */
        <View
          style={{
            height: imageHeight,
            backgroundColor: textBackgroundColor,
            opacity: 0.8,
          }}
        />
      )}

      {/* Text Section with solid background */}
      <View
        style={{
          height: textHeight,
          backgroundColor: textBackgroundColor,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
          justifyContent: 'space-between',
        }}
      >
        <Text
          className="text-gray-900 text-lg font-semibold"
          style={{
            marginBottom: 0,
          }}
          numberOfLines={1}
        >
          {category.name}
        </Text>
        <Text
          className="text-gray-700 text-sm"
          style={{
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {category.description}
        </Text>
      </View>
    </Pressable>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export const ModernCategoryCard = memo(ModernCategoryCardComponent);

export default ModernCategoryCard;
