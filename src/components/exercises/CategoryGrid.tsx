import React, { useCallback } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CategoryCard } from './CategoryCard';
import { useTranslation } from '~/hooks/useTranslation';

interface CategoryGridProps {
  onCategorySelect: (categoryId: string) => void;
}

interface Category {
  id: string;
  name: string;
  color: string;
  description: string;
  icon: string;
}

const getCategoriesWithTranslations = (t: any): Category[] => [
  { 
    id: 'mindfulness', 
    name: 'Mindfulness', 
    color: '#FF6B6B',    // Coral red
    description: 'Stay present',
    icon: '🧘‍♀️'
  },
  { 
    id: 'breathing', 
    name: 'Breathing', 
    color: '#4ECDC4',    // Turquoise
    description: 'Breathe deeply',
    icon: '🌬️'
  },
  { 
    id: 'movement', 
    name: 'Movement', 
    color: '#45B7D1',    // Sky blue
    description: 'Move gently',
    icon: '🚶‍♀️'
  },
  { 
    id: 'journaling', 
    name: 'Journaling', 
    color: '#96CEB4',    // Mint green
    description: 'Write freely',
    icon: '✍️'
  },
  { 
    id: 'relaxation', 
    name: 'Relaxation', 
    color: '#FFEAA7',    // Warm yellow
    description: 'Find peace',
    icon: '🛀'
  },
  { 
    id: 'reminders', 
    name: 'Reminders', 
    color: '#DDA0DD',    // Plum
    description: 'Daily wisdom',
    icon: '💭'
  },
];

export function CategoryGrid({ onCategorySelect }: CategoryGridProps) {
  const { t } = useTranslation();
  const categories = getCategoriesWithTranslations(t);

  // FlashList render functions  
  const renderCategoryCard = useCallback(({ item, index }: { item: any; index: number }) => (
    <View style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 8 }}>
      <CategoryCard
        category={item}
        onPress={onCategorySelect}
        index={index}
      />
    </View>
  ), [onCategorySelect]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const getItemType = useCallback(() => 'category', []);

  return (
    <View style={{ flex: 1, paddingHorizontal: 8 }}>
      <FlashList
        data={categories}
        renderItem={renderCategoryCard}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        numColumns={2}
        estimatedItemSize={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}