export interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'breathing' | 'mindfulness' | 'movement' | 'cbt' | 'journaling' | 'relaxation';
  icon: string;
  color: string;
  steps?: string[];
  benefits?: string[];
  imageUrl?: string;
}

export type ExerciseCategory = Exercise['category'];
export type ExerciseDifficulty = Exercise['difficulty'];