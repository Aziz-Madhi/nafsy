import React from 'react';
import { InteractiveCard } from '~/components/ui/InteractiveCard';
import type { Exercise, ExerciseCardProps } from '~/types';
import { useTranslation } from '~/hooks/useTranslation';

export function ExerciseCard({ exercise, onPress, index }: ExerciseCardProps) {
  const { currentLanguage } = useTranslation();

  const title =
    currentLanguage === 'ar' && exercise.titleAr
      ? exercise.titleAr
      : exercise.title;

  const description =
    currentLanguage === 'ar' && exercise.descriptionAr
      ? exercise.descriptionAr
      : exercise.description;

  return (
    <InteractiveCard
      title={title}
      description={description}
      iconType="category"
      iconName={exercise.icon}
      color={exercise.color}
      onPress={() => onPress(exercise)}
      index={index}
      duration={exercise.duration}
      difficulty={exercise.difficulty}
      variant="exercise"
    />
  );
}
