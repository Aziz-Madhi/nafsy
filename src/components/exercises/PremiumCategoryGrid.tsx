import React from 'react';
import { View } from 'react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { ModernCategoryCard } from './ModernCategoryCard';
import { SimpleMasonryGrid } from '~/components/ui/SimpleMasonryGrid';
import { useTranslation } from '~/hooks/useTranslation';
import { colors } from '~/lib/design-tokens';

interface PremiumCategoryGridProps {
  onCategorySelect: (categoryId: string) => void;
}

interface Category {
  id: keyof typeof colors.wellness;
  name: string;
  color: string;
  description: string;
  icon: string;
}

const getCategoriesWithTranslations = (t: any): Category[] => {
  const baseCategories = [
    {
      id: 'mindfulness' as const,
      name: t('exercises.categories.mindfulness') || 'Mindfulness',
      color: colors.wellness.mindfulness.primary,
      description: t('exercises.descriptions.mindfulness') || 'Stay present',
      icon: '🧘‍♀️',
    },
    {
      id: 'breathing' as const,
      name: t('exercises.categories.breathing') || 'Breathing',
      color: colors.wellness.breathing.primary,
      description: t('exercises.descriptions.breathing') || 'Breathe deeply',
      icon: '🌬️',
    },
    {
      id: 'movement' as const,
      name: t('exercises.categories.movement') || 'Movement',
      color: colors.wellness.movement.primary,
      description: t('exercises.descriptions.movement') || 'Move gently',
      icon: '🚶‍♀️',
    },
    {
      id: 'journaling' as const,
      name: t('exercises.categories.journaling') || 'Journaling',
      color: colors.wellness.journaling.primary,
      description: t('exercises.descriptions.journaling') || 'Write freely',
      icon: '✍️',
    },
    {
      id: 'relaxation' as const,
      name: t('exercises.categories.relaxation') || 'Relaxation',
      color: colors.wellness.relaxation.primary,
      description: t('exercises.descriptions.relaxation') || 'Find peace',
      icon: '🛀',
    },
    {
      id: 'reminders' as const,
      name: t('exercises.categories.reminders') || 'Reminders',
      color: colors.wellness.reminders.primary,
      description: t('exercises.descriptions.reminders') || 'Daily wisdom',
      icon: '💭',
    },
  ];

  return baseCategories;
};

export function PremiumCategoryGrid({
  onCategorySelect,
}: PremiumCategoryGridProps) {
  const { t } = useTranslation();
  const categories = getCategoriesWithTranslations(t);

  const handleCategorySelect = (categoryId: string) => {
    impactAsync(ImpactFeedbackStyle.Medium);
    onCategorySelect(categoryId);
  };

  return (
    <SimpleMasonryGrid
      outerHorizontalPadding={6}
      data={categories}
      renderItem={(category, index, height) => (
        <ModernCategoryCard
          category={category}
          onPress={handleCategorySelect}
          index={index}
          height={height}
        />
      )}
      keyExtractor={(category) => category.id}
    />
  );
}

export default PremiumCategoryGrid;
