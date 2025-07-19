import React from 'react';
import { View } from 'react-native';
import { CategoryCard } from './CategoryCard';
import { useTranslation } from '~/hooks/useTranslation';

interface CategoryGridProps {
  onCategorySelect: (categoryId: string) => void;
}

interface Category {
  id: string;
  name: string;
  color: string;
  emoji: string;
  description: string;
}

const getCategoriesWithTranslations = (t: any): Category[] => [
  { 
    id: 'mindfulness', 
    name: t('exercises.categories.mindfulness'), 
    color: '#F5D4C1',
    emoji: '🧘‍♀️',
    description: t('exercises.descriptions.mindfulness') || 'Present moment awareness'
  },
  { 
    id: 'breathing', 
    name: t('exercises.categories.breathing'), 
    color: '#FDEBC9',
    emoji: '🌬️',
    description: t('exercises.descriptions.breathing') || 'Calm through breath'
  },
  { 
    id: 'movement', 
    name: t('exercises.categories.movement'), 
    color: '#D0F1EB',
    emoji: '🏃‍♀️',
    description: t('exercises.descriptions.movement') || 'Gentle body movement'
  },
  { 
    id: 'journaling', 
    name: t('exercises.categories.journaling'), 
    color: '#DED2F9',
    emoji: '📝',
    description: t('exercises.descriptions.journaling') || 'Express your thoughts'
  },
  { 
    id: 'relaxation', 
    name: t('exercises.categories.relaxation'), 
    color: '#C9EAFD',
    emoji: '💆‍♀️',
    description: t('exercises.descriptions.relaxation') || 'Release tension'
  },
  { 
    id: 'reminders', 
    name: t('exercises.categories.reminders') || 'Thoughtful Reminders', 
    color: '#FDC9D2',
    emoji: '💝',
    description: t('exercises.descriptions.reminders') || 'Positive affirmations'
  },
];

export function CategoryGrid({ onCategorySelect }: CategoryGridProps) {
  const { t } = useTranslation();
  const categories = getCategoriesWithTranslations(t);

  return (
    <View className="px-8">
      {/* First Row */}
      <View className="flex-row mb-6" style={{ gap: 16 }}>
        <CategoryCard
          category={categories[0]}
          onPress={onCategorySelect}
          index={0}
        />
        <CategoryCard
          category={categories[1]}
          onPress={onCategorySelect}
          index={1}
        />
      </View>

      {/* Second Row */}
      <View className="flex-row mb-6" style={{ gap: 16 }}>
        <CategoryCard
          category={categories[2]}
          onPress={onCategorySelect}
          index={2}
        />
        <CategoryCard
          category={categories[3]}
          onPress={onCategorySelect}
          index={3}
        />
      </View>

      {/* Third Row */}
      <View className="flex-row" style={{ gap: 16 }}>
        <CategoryCard
          category={categories[4]}
          onPress={onCategorySelect}
          index={4}
        />
        <CategoryCard
          category={categories[5]}
          onPress={onCategorySelect}
          index={5}
        />
      </View>
    </View>
  );
}