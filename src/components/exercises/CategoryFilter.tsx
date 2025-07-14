import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '~/lib/utils';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'All', icon: '✨', color: '#3B82F6' },
  { id: 'breathing', name: 'Breathing', icon: '🌬️', color: '#06B6D4' },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', color: '#8B5CF6' },
  { id: 'movement', name: 'Movement', icon: '🏃', color: '#10B981' },
  { id: 'cbt', name: 'CBT', icon: '🧠', color: '#F59E0B' },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryFilter({ selectedCategory, onCategorySelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-6"
      contentContainerStyle={{ paddingHorizontal: 24 }}
    >
      {CATEGORIES.map((category, index) => (
        <CategoryChip
          key={category.id}
          category={category}
          isSelected={selectedCategory === category.id}
          onPress={() => onCategorySelect(category.id)}
          index={index}
        />
      ))}
    </ScrollView>
  );
}

interface CategoryChipProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

function CategoryChip({ category, isSelected, onPress, index }: CategoryChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <AnimatedPressable
      entering={FadeInRight.delay(index * 50).springify()}
      style={animatedStyle}
      onPress={handlePress}
      className={cn(
        'flex-row items-center px-4 py-2.5 rounded-full mr-3',
        isSelected
          ? 'bg-primary'
          : 'bg-secondary/20'
      )}
    >
      <Text className="text-base mr-2">{category.icon}</Text>
      <Text
        variant="body"
        className={cn(
          'font-medium',
          isSelected
            ? 'text-primary-foreground'
            : 'text-muted-foreground'
        )}
      >
        {category.name}
      </Text>
    </AnimatedPressable>
  );
}