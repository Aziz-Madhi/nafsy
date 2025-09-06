import React, { memo, useMemo, useCallback } from 'react';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { ModernCategoryCard } from './ModernCategoryCard';
import { SimpleMasonryGrid } from '~/components/ui/SimpleMasonryGrid';
import { useTranslation } from '~/hooks/useTranslation';

interface PremiumCategoryGridProps {
  onCategorySelect: (categoryId: string) => void;
}

function PremiumCategoryGridComponent({
  onCategorySelect,
}: PremiumCategoryGridProps) {
  const { t } = useTranslation();

  // Memoize categories using translations
  const categories = useMemo(() => {
    const baseCategories = [
      {
        id: 'mindfulness' as const,
        name: t('exercises.categories.mindfulness'),
        color: '#FF6B6B',
        description: t('exercises.descriptions.mindfulness'),
        icon: '🧘‍♀️',
      },
      {
        id: 'relaxation' as const,
        name: t('exercises.categories.relaxation'),
        color: '#FFEAA7',
        description: t('exercises.descriptions.relaxation'),
        icon: '🛀',
      },
      {
        id: 'movement' as const,
        name: t('exercises.categories.movement'),
        color: '#45B7D1',
        description: t('exercises.descriptions.movement'),
        icon: '🚶‍♀️',
      },
      {
        id: 'journaling' as const,
        name: t('exercises.categories.journaling'),
        color: '#96CEB4',
        description: t('exercises.descriptions.journaling'),
        icon: '✍️',
      },
      {
        id: 'breathing' as const,
        name: t('exercises.categories.breathing'),
        color: '#4ECDC4',
        description: t('exercises.descriptions.breathing'),
        icon: '🌬️',
      },
      {
        id: 'reminders' as const,
        name: t('exercises.categories.reminders'),
        color: '#DDA0DD',
        description: t('exercises.descriptions.reminders'),
        icon: '💭',
      },
    ];

    return baseCategories;
  }, [t]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      impactAsync(ImpactFeedbackStyle.Medium);
      onCategorySelect(categoryId);
    },
    [onCategorySelect]
  );

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

// Memoize the component to prevent re-renders when props haven't changed
export const PremiumCategoryGrid = memo(PremiumCategoryGridComponent);

export default PremiumCategoryGrid;
