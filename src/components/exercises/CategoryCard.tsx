import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    color: string;
    emoji: string;
    description: string;
  };
  onPress: (categoryId: string) => void;
  index: number;
}

export function CategoryCard({ category, onPress, index }: CategoryCardProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(category.id);
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      className="flex-1"
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          className="h-56 rounded-3xl flex justify-between items-center p-6 shadow-sm"
          style={{ 
            backgroundColor: category.color,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {/* Top section with emoji */}
          <View className="w-full items-center justify-center flex-1">
            <Text className="text-7xl">
              {category.emoji}
            </Text>
          </View>

          {/* Bottom section with title and description */}
          <View className="w-full items-center justify-end">
            <Text 
              variant="heading"
              className="text-[#5A4A3A] text-center leading-tight mb-2 font-semibold"
              style={{ fontFamily: 'Raleway_600SemiBold' }}
            >
              {category.name}
            </Text>
            <Text 
              variant="subhead"
              className="text-[#5A4A3A]/75 text-center leading-tight px-2"
              numberOfLines={2}
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {category.description}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}