import React, { useState } from 'react';
import {
  View,
  Pressable,
  ImageBackground,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { Text } from '~/components/ui/text';
import { colors, typography, shadows, spacing } from '~/lib/design-tokens';

interface ModernCategoryCardProps {
  category: {
    id: keyof typeof colors.wellness;
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

export function ModernCategoryCard({
  category,
  onPress,
  index,
  height,
}: ModernCategoryCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const backgroundImage = CATEGORY_BACKGROUNDS[category.name];

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
    return exerciseColors[categoryId] || colors.neutral[50];
  };

  // Use light opacity so text is visible
  const baseColor = getMoodColor(category.id);
  const textBackgroundColor = baseColor + '15'; // 15% opacity for readability

  const handlePress = () => {
    onPress(category.id);
  };

  // Calculate proportions - 65% image, 35% text
  const imageHeight = height * 0.65;
  const textHeight = height * 0.35;

  return (
    <Pressable
      style={{
        height: height,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        ...shadows.md,
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
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            ...typography.title3,
            color: colors.neutral[900],
            marginBottom: 0,
          }}
          numberOfLines={1}
        >
          {category.name}
        </Text>
        <Text
          style={{
            ...typography.subheadline,
            color: colors.neutral[700],
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

export default ModernCategoryCard;
