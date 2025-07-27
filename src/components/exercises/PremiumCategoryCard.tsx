import React, { useState } from 'react';
import {
  View,
  Pressable,
  ImageBackground,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Text } from '~/components/ui/text';
import { getCategoryTheme } from '~/lib/design-tokens';
import type { colors } from '~/lib/design-tokens';

interface PremiumCategoryCardProps {
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
  width?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Background image mapping for each category
const CATEGORY_BACKGROUNDS: Record<string, ImageSourcePropType> = {
  Mindfulness: require('../../../assets/mindfulness-card.png'),
  Movement: require('../../../assets/movement-card.png'),
  Breathing: require('../../../assets/breathing-card.jpg'),
  Journaling: require('../../../assets/journaling-card.png'),
  Relaxation: require('../../../assets/relaxation-card.png'),
  Reminders: require('../../../assets/reminders-card.png'),
};

export function PremiumCategoryCard({
  category,
  onPress,
  index,
  height,
  width,
}: PremiumCategoryCardProps) {
  const scale = useSharedValue(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Get background image for this category
  const backgroundImage = CATEGORY_BACKGROUNDS[category.name];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(0.94, {
      damping: 15,
      stiffness: 400,
    });
    runOnJS(impactAsync)(ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePress = () => {
    'worklet';
    runOnJS(impactAsync)(ImpactFeedbackStyle.Medium);
    runOnJS(onPress)(category.id);
  };

  return (
    <AnimatedPressable
      style={[
        {
          height: height,
          width: width,
          borderRadius: 24,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 5,
        },
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${category.name} exercises. ${category.description}`}
      accessibilityHint="Tap to view exercises in this category"
    >
      {/* Background Image with loading state */}
      {backgroundImage && !imageError ? (
        <>
          {imageLoading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: getCategoryTheme(category.id).background,
              }}
            >
              <ActivityIndicator
                size="large"
                color={getCategoryTheme(category.id).primary}
              />
            </View>
          )}
          <ImageBackground
            source={backgroundImage}
            style={{ flex: 1 }}
            imageStyle={{ borderRadius: 24 }}
            resizeMode="cover"
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          >
            {/* Ultra-light overlay for text readability */}
            <LinearGradient
              colors={[
                'rgba(0, 0, 0, 0.0)',
                'rgba(0, 0, 0, 0.0)',
                'rgba(0, 0, 0, 0.0)',
                'rgba(0, 0, 0, 0.25)',
              ]}
              locations={[0, 0.5, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}
            >
              {/* Clean text overlay at bottom */}
              <View>
                <Text
                  style={{
                    fontSize: height > 220 ? 32 : 28,
                    fontWeight: '700',
                    color: 'white',
                    marginBottom: 4,
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                    letterSpacing: -0.5,
                  }}
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
                <Text
                  style={{
                    fontSize: height > 220 ? 17 : 15,
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.95)',
                    textShadowColor: 'rgba(0, 0, 0, 0.4)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                    letterSpacing: 0.1,
                  }}
                  numberOfLines={2}
                >
                  {category.description}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </>
      ) : (
        /* Fallback gradient if no image */
        <LinearGradient
          colors={getCategoryTheme(category.id).gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}
        >
          <View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '800',
                color: 'white',
                marginBottom: 4,
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
              numberOfLines={1}
            >
              {category.name}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
              }}
              numberOfLines={1}
            >
              {category.description}
            </Text>
          </View>
        </LinearGradient>
      )}
    </AnimatedPressable>
  );
}

export default PremiumCategoryCard;
