import React, { memo, useCallback, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { VerticalList } from '~/components/ui/GenericList';
import { Text } from '~/components/ui/text';
import { ExerciseCard } from './ExerciseCard';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category:
    | 'breathing'
    | 'mindfulness'
    | 'movement'
    | 'cbt'
    | 'journaling'
    | 'relaxation';
  icon: string;
  color: string;
  steps?: string[];
  benefits?: string[];
}

interface CategoryExerciseListProps {
  categoryId: string;
  exercises: Exercise[];
  onExercisePress: (exercise: Exercise) => void;
  onBackPress: () => void;
}

const getCategoryName = (categoryId: string, t: any): string => {
  const categoryNames: Record<string, string> = {
    mindfulness: t('exercises.categories.mindfulness') || 'Mindfulness',
    breathing: t('exercises.categories.breathing') || 'Breathing',
    movement: t('exercises.categories.movement') || 'Movement',
    journaling: t('exercises.categories.journaling') || 'Journaling',
    relaxation: t('exercises.categories.relaxation') || 'Relaxation',
    reminders: t('exercises.categories.reminders') || 'Reminders',
  };
  return (
    categoryNames[categoryId] ||
    categoryId.charAt(0).toUpperCase() + categoryId.slice(1)
  );
};

function CategoryExerciseListComponent({
  categoryId,
  exercises,
  onExercisePress,
  onBackPress,
}: CategoryExerciseListProps) {
  const { t } = useTranslation();

  // Memoize category name computation
  const categoryName = useMemo(
    () => getCategoryName(categoryId, t),
    [categoryId, t]
  );

  const handleBackPress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    onBackPress();
  }, [onBackPress]);

  // Memoize filtered exercises to prevent re-computation
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      if (categoryId === 'reminders') {
        return (
          exercise.category === 'relaxation' ||
          exercise.category === 'mindfulness'
        );
      }
      return exercise.category === categoryId;
    });
  }, [exercises, categoryId]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 mb-4">
        <Pressable onPress={handleBackPress} className="p-2 mr-2">
          <SymbolView name="chevron.left" size={28} tintColor="#9CA3AF" />
        </Pressable>
        <Text
          className="text-foreground flex-1 text-center"
          style={{ fontFamily: 'CrimsonPro-Bold', fontSize: 24, lineHeight: 28 }}
        >
          {categoryName}
        </Text>
        {/* Spacer to balance the centered title against the back icon width */}
        <View style={{ width: 44 }} />
      </View>

      {/* Exercise List */}
      <VerticalList
        data={filteredExercises}
        renderItem={(exercise, index) => (
          <ExerciseCard
            exercise={exercise}
            onPress={onExercisePress}
            index={index}
          />
        )}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.difficulty}
        emptyMessage={
          t('exercises.noExercisesInCategory') ||
          'No exercises available in this category yet.'
        }
      />
    </View>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export const CategoryExerciseList = memo(CategoryExerciseListComponent);
