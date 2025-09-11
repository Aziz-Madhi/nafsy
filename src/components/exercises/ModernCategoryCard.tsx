import React, { memo, useState, useCallback, useMemo } from 'react';
import { View, Pressable, ImageBackground, ImageSourcePropType } from 'react-native';
import type { ImageStyle } from 'react-native';
import { BlurView } from 'expo-blur';
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

// Background image mapping by stable category id (not translated name)
// Exported for reuse (e.g., AudioPlayer backdrop) so visuals stay consistent
export const CATEGORY_BACKGROUNDS: Record<
  WellnessCategory,
  ImageSourcePropType
> = {
  mindfulness: require('../../../assets/Cards/New colored cards/Mindfulness new card.jpg'),
  breathing: require('../../../assets/Cards/New colored cards/Breathing new card.jpg'),
  movement: require('../../../assets/Cards/New colored cards/Movement new card.jpg'),
  journaling: require('../../../assets/Cards/New colored cards/Journaling new card.jpg'),
  relaxation: require('../../../assets/Cards/New colored cards/Relaxation new card..jpeg'),
  reminders: require('../../../assets/Cards/New colored cards/Reminders new card.jpg'),
};

function ModernCategoryCardComponent({
  category,
  onPress,
  index,
  height,
}: ModernCategoryCardProps) {
  // Track image errors only. Local require() assets load synchronously,
  // so we avoid showing any loading state that might persist visually.
  const [imageError, setImageError] = useState(false);

  // Use the id so images work for all locales (Arabic/English)
  const backgroundImage = CATEGORY_BACKGROUNDS[category.id];

  // Colors for React Native styling
  const colors = useColors();
  const shadowStyle = useShadowStyle('medium');

  const handlePress = useCallback(() => {
    onPress(category.id);
  }, [onPress, category.id]);

  // Calculate proportions - 65% image, 35% text - Memoized for performance
  const { containerHeight, imageHeight, textHeight } = useMemo(() => {
    const h = Math.round(height * 0.9); // slightly shorter overall
    const imgH = Math.round(h * 0.62); // dedicated top image area
    return { containerHeight: h, imageHeight: imgH, textHeight: h - imgH };
  }, [height]);

  return (
    <Pressable
      className="bg-white rounded-3xl overflow-hidden"
      style={{ height: containerHeight, ...shadowStyle }}
      onPress={handlePress}
    >
      <View style={{ height: imageHeight, width: '100%' }}>
        {/** Reposition relaxation artwork: ensure top edge is covered and shift subject down */}
        {(() => {
          const isRelax = category.id === 'relaxation';
          const backgroundStyle = isRelax
            ? {
                position: 'absolute' as const,
                left: 0,
                right: 0,
                top: -2, // tiny overscan to avoid any top gap
                bottom: -6, // slight overscan at bottom so we can position lower without gaps
              }
            : { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };
          return backgroundImage && !imageError ? (
            <ImageBackground
              source={backgroundImage}
              style={backgroundStyle}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#F2F2EC' }} />
          );
        })()}
      </View>

      <BlurView
        tint="light"
        intensity={28}
        style={{
          height: textHeight,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.55)',
        }}
      >
        <Text
          className="text-gray-900 text-lg font-semibold"
          style={{ marginBottom: 0 }}
          numberOfLines={1}
        >
          {category.name}
        </Text>
        <Text
          className="text-gray-700 text-sm"
          style={{ lineHeight: 18 }}
          numberOfLines={2}
        >
          {category.description}
        </Text>
      </BlurView>
    </Pressable>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export const ModernCategoryCard = memo(ModernCategoryCardComponent);

export default ModernCategoryCard;
