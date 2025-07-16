import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Exercise } from './types';

interface ExerciseState {
  // Exercise State
  exercises: Exercise[];
  currentExercise: Exercise | null;
  exerciseProgress: Record<string, number>; // exerciseId -> progress percentage
  
  // Actions
  setExercises: (exercises: Exercise[]) => void;
  setCurrentExercise: (exercise: Exercise | null) => void;
  completeExercise: (exerciseId: string) => void;
  updateExerciseProgress: (exerciseId: string, progress: number) => void;
  addExercise: (exercise: Omit<Exercise, 'id' | 'completed'>) => void;
  resetProgress: (exerciseId: string) => void;
}

export const useExerciseStore = create<ExerciseState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    exercises: [],
    currentExercise: null,
    exerciseProgress: {},

    // Actions
    setExercises: (exercises) =>
      set({ exercises }),

    setCurrentExercise: (exercise) =>
      set({ currentExercise: exercise }),

    completeExercise: (exerciseId) =>
      set((state) => ({
        exercises: state.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? { ...exercise, completed: true, completedAt: new Date() }
            : exercise
        ),
        exerciseProgress: {
          ...state.exerciseProgress,
          [exerciseId]: 100,
        },
      })),

    updateExerciseProgress: (exerciseId, progress) =>
      set((state) => ({
        exerciseProgress: {
          ...state.exerciseProgress,
          [exerciseId]: Math.max(0, Math.min(100, progress)),
        },
      })),

    addExercise: (exercise) =>
      set((state) => {
        const newExercise: Exercise = {
          ...exercise,
          id: Date.now().toString(),
          completed: false,
        };
        
        return {
          exercises: [...state.exercises, newExercise],
        };
      }),

    resetProgress: (exerciseId) =>
      set((state) => ({
        exerciseProgress: {
          ...state.exerciseProgress,
          [exerciseId]: 0,
        },
        exercises: state.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? { ...exercise, completed: false, completedAt: undefined }
            : exercise
        ),
      })),
  }))
);

// Selectors
export const useExercises = () =>
  useExerciseStore((state) => state.exercises);

export const useCurrentExercise = () =>
  useExerciseStore((state) => state.currentExercise);

export const useExerciseProgress = () =>
  useExerciseStore((state) => state.exerciseProgress);

// Computed selectors
export const useCompletedExercises = () =>
  useExerciseStore((state) => 
    state.exercises.filter((exercise) => exercise.completed)
  );

export const useExercisesByType = (type: Exercise['type']) =>
  useExerciseStore((state) => 
    state.exercises.filter((exercise) => exercise.type === type)
  );

export const useTodayCompletedExercises = () =>
  useExerciseStore((state) => {
    const today = new Date().toDateString();
    return state.exercises.filter(
      (exercise) => 
        exercise.completed && 
        exercise.completedAt?.toDateString() === today
    );
  });