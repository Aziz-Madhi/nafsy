import React from 'react';
import { InteractiveCard } from '~/components/ui/InteractiveCard';
import type { Exercise, ExerciseCardProps } from '~/types';

export function ExerciseCard({ exercise, onPress, index }: ExerciseCardProps) {
  return (
    <InteractiveCard
      title={exercise.title}
      description={exercise.description}
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
