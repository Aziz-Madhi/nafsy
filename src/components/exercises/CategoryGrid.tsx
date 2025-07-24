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
    color: '#EF4444', // Ultra vibrant coral red
    description: 'Stay present',
    icon: '🧘‍♀️',
  },
  {
    id: 'breathing',
    name: 'Breathing',
    color: '#06B6D4', // Ultra vibrant turquoise
    description: 'Breathe deeply',
    icon: '🌬️',
  },
  {
    id: 'movement',
    name: 'Movement',
    color: '#3B82F6', // Ultra vibrant sky blue
    description: 'Move gently',
    icon: '🚶‍♀️',
  },
  {
    id: 'journaling',
    name: 'Journaling',
    color: '#10B981', // Ultra vibrant mint green
    description: 'Write freely',
    icon: '✍️',
  },
  {
    id: 'relaxation',
    name: 'Relaxation',
    color: '#F59E0B', // Ultra vibrant warm yellow
    description: 'Find peace',
    icon: '🛀',
  },
  {
    id: 'reminders',
    name: 'Reminders',
    color: '#A855F7', // Ultra vibrant plum
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
