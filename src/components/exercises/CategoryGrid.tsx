import React from 'react';
import { View } from 'react-native';
import { GridList } from '~/components/ui/GenericList';
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
    color: '#FF6B6B', // Coral red
    description: 'Stay present',
    icon: '🧘‍♀️',
  },
  {
    id: 'breathing',
    name: 'Breathing',
    color: '#4ECDC4', // Turquoise
    description: 'Breathe deeply',
    icon: '🌬️',
  },
  {
    id: 'movement',
    name: 'Movement',
    color: '#45B7D1', // Sky blue
    description: 'Move gently',
    icon: '🚶‍♀️',
  },
  {
    id: 'journaling',
    name: 'Journaling',
    color: '#96CEB4', // Mint green
    description: 'Write freely',
    icon: '✍️',
  },
  {
    id: 'relaxation',
    name: 'Relaxation',
    color: '#FFEAA7', // Warm yellow
    description: 'Find peace',
    icon: '🛀',
  },
  {
    id: 'reminders',
    name: 'Reminders',
    color: '#DDA0DD', // Plum
    description: 'Daily wisdom',
    icon: '💭',
  },
];

export function CategoryGrid({ onCategorySelect }: CategoryGridProps) {
  const { t } = useTranslation();
  const categories = getCategoriesWithTranslations(t);

  return (
    <GridList
      data={categories}
      renderItem={(category, index) => (
        <View style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 8 }}>
          <CategoryCard
            category={category}
            onPress={onCategorySelect}
            index={index}
          />
        </View>
      )}
      keyExtractor={(item) => item.id}
      getItemType={() => 'category'}
      emptyMessage="No categories available"
    />
  );
}
