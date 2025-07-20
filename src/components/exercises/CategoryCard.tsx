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
import { Brain, Wind, Activity, BookOpen, Leaf, Heart } from 'lucide-react-native';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    color: string;
    description: string;
  };
  onPress: (categoryId: string) => void;
  index: number;
}

// Helper function to render category icons
function getCategoryIconComponent(categoryId: string) {
  const iconProps = { size: 64, color: '#5A4A3A' };
  
  switch (categoryId) {
    case 'mindfulness':
      return <Brain {...iconProps} />;
    case 'breathing':
      return <Wind {...iconProps} />;
    case 'movement':
      return <Activity {...iconProps} />;
    case 'journaling':
      return <BookOpen {...iconProps} />;
    case 'relaxation':
      return <Leaf {...iconProps} />;
    case 'reminders':
      return <Heart {...iconProps} />;
    default:
      return <Brain {...iconProps} />;
  }
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
          className="h-56 rounded-3xl flex justify-between items-center p-4 shadow-sm"
          style={{ 
            backgroundColor: category.color,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {/* Top section with icon */}
          <View className="w-full items-center justify-center flex-1">
            {getCategoryIconComponent(category.id)}
          </View>

          {/* Bottom section with title and description - Apple HIG: 14-15pt titles, 12-13pt descriptions */}
          <View className="w-full items-center justify-end px-2">
            {/* Primary Title - Apple HIG: 14-15pt for main titles (bold) */}
            <Text 
              className="text-[#5A4A3A] text-center font-bold leading-tight mb-2"
              style={{ fontSize: 15 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {category.name}
            </Text>
            {/* Secondary Description - Apple HIG: 12-13pt for descriptions (regular/medium) */}
            <Text 
              className="text-[#5A4A3A]/70 text-center font-medium leading-relaxed"
              style={{ fontSize: 13 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {category.description}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}