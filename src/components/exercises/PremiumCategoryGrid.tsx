import React, { memo, useMemo, useCallback } from 'react';
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

function PremiumCategoryGridComponent({
  onCategorySelect,
}: PremiumCategoryGridProps) {
  const { t } = useTranslation();

  // Cache translated strings to prevent categories recreation when t function changes
  const translatedStrings = useMemo(() => {
    return {
      mindfulness: {
        name: t('exercises.categories.mindfulness') || 'Mindfulness',
        description: t('exercises.descriptions.mindfulness') || 'Stay present',
      },
      breathing: {
        name: t('exercises.categories.breathing') || 'Breathing',
        description: t('exercises.descriptions.breathing') || 'Breathe deeply',
      },
      movement: {
        name: t('exercises.categories.movement') || 'Movement',
        description: t('exercises.descriptions.movement') || 'Move gently',
      },
      journaling: {
        name: t('exercises.categories.journaling') || 'Journaling',
        description: t('exercises.descriptions.journaling') || 'Write freely',
      },
      relaxation: {
        name: t('exercises.categories.relaxation') || 'Relaxation',
        description: t('exercises.descriptions.relaxation') || 'Find peace',
      },
      reminders: {
        name: t('exercises.categories.reminders') || 'Reminders',
        description: t('exercises.descriptions.reminders') || 'Daily wisdom',
      },
    };
  }, [t]);

  // Memoize categories using cached translations
  const categories = useMemo(() => {
    const baseCategories = [
      {
        id: 'mindfulness' as const,
        name: translatedStrings.mindfulness.name,
        color: colors.wellness.mindfulness.primary,
        description: translatedStrings.mindfulness.description,
        icon: '🧘‍♀️',
      },
      {
        id: 'breathing' as const,
        name: translatedStrings.breathing.name,
        color: colors.wellness.breathing.primary,
        description: translatedStrings.breathing.description,
        icon: '🌬️',
      },
      {
        id: 'movement' as const,
        name: translatedStrings.movement.name,
        color: colors.wellness.movement.primary,
        description: translatedStrings.movement.description,
        icon: '🚶‍♀️',
      },
      {
        id: 'journaling' as const,
        name: translatedStrings.journaling.name,
        color: colors.wellness.journaling.primary,
        description: translatedStrings.journaling.description,
        icon: '✍️',
      },
      {
        id: 'relaxation' as const,
        name: translatedStrings.relaxation.name,
        color: colors.wellness.relaxation.primary,
        description: translatedStrings.relaxation.description,
        icon: '🛀',
      },
      {
        id: 'reminders' as const,
        name: translatedStrings.reminders.name,
        color: colors.wellness.reminders.primary,
        description: translatedStrings.reminders.description,
        icon: '💭',
      },
    ];

    return baseCategories;
  }, [translatedStrings]);

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
