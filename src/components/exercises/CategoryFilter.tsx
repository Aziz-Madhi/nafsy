import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text } from '~/components/ui/text';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';
import { optimizedHaptic } from '~/lib/haptic-optimizer';
import { cn } from '~/lib/cn';
import { useTranslation } from '~/hooks/useTranslation';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const getCategoriesWithTranslations = (t: any): Category[] => [
  { id: 'all', name: t('exercises.categories.all'), icon: '✨', color: '#3B82F6' },
  { id: 'breathing', name: t('exercises.categories.breathing'), icon: '🌬️', color: '#06B6D4' },
  { id: 'mindfulness', name: t('exercises.categories.mindfulness'), icon: '🧘', color: '#8B5CF6' },
  { id: 'movement', name: t('exercises.categories.movement'), icon: '🏃', color: '#10B981' },
  { id: 'journaling', name: t('exercises.categories.journaling'), icon: '📝', color: '#F59E0B' },
  { id: 'relaxation', name: t('exercises.categories.relaxation'), icon: '💆', color: '#EC4899' },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export function CategoryFilter({ selectedCategory, onCategorySelect }: CategoryFilterProps) {
  const { t } = useTranslation();
  const categories = getCategoriesWithTranslations(t);
  
  // FlashList render functions
  const renderCategoryChip = useCallback(({ item, index }: { item: Category; index: number }) => (
    <CategoryChip
      category={item}
      isSelected={selectedCategory === item.id}
      onPress={() => onCategorySelect(item.id)}
      index={index}
    />
  ), [selectedCategory, onCategorySelect]);

  const keyExtractor = useCallback((item: Category) => item.id, []);

  const getItemType = useCallback((item: Category) => 'category', []);
  
  return (
    <View className="mb-6 h-12">
      <FlashList
        data={categories}
        renderItem={renderCategoryChip}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        horizontal
        estimatedItemSize={120}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      />
    </View>
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

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    optimizedHaptic.tap();
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <Animated.View style={animatedStyle}>
        <Pressable
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
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}