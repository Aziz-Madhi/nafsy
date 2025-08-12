// Mapping between moods and appropriate exercise categories
export type MoodType = 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry';
export type ExerciseCategory =
  | 'breathing'
  | 'mindfulness'
  | 'movement'
  | 'journaling'
  | 'relaxation';

// Map each mood to appropriate exercise categories
export const moodToExerciseCategories: Record<MoodType, ExerciseCategory[]> = {
  happy: ['movement', 'journaling'], // Maintain positive energy, celebrate
  sad: ['breathing', 'mindfulness', 'journaling'], // Process emotions, find peace
  anxious: ['breathing', 'relaxation', 'mindfulness'], // Calm the nervous system
  angry: ['movement', 'breathing'], // Release tension, regulate emotions
  neutral: ['mindfulness', 'breathing', 'movement', 'journaling', 'relaxation'], // Explore any wellness practice
};

// Get appropriate exercise categories for a mood
export function getExerciseCategoriesForMood(
  mood: MoodType
): ExerciseCategory[] {
  return moodToExerciseCategories[mood] || moodToExerciseCategories.neutral;
}

// Get a random category from mood-appropriate categories
export function getRandomCategoryForMood(mood: MoodType): ExerciseCategory {
  const categories = getExerciseCategoriesForMood(mood);
  const randomIndex = Math.floor(Math.random() * categories.length);
  return categories[randomIndex];
}

// Get encouraging message based on mood
export function getMoodBasedEncouragement(
  mood: MoodType,
  locale: 'en' | 'ar'
): string {
  const messages = {
    en: {
      happy: 'Keep the positive energy flowing',
      sad: 'Gentle care for your emotions',
      anxious: 'Find your calm center',
      angry: 'Release and restore balance',
      neutral: 'Explore your wellness journey',
    },
    ar: {
      happy: 'حافظ على طاقتك الإيجابية',
      sad: 'رعاية لطيفة لمشاعرك',
      anxious: 'اعثر على مركز هدوءك',
      angry: 'حرر واستعد التوازن',
      neutral: 'استكشف رحلتك الصحية',
    },
  };

  return messages[locale][mood] || messages[locale].neutral;
}

// Get category icon name for IconRenderer
export function getCategoryIcon(category: ExerciseCategory): string {
  const iconMap: Record<ExerciseCategory, string> = {
    breathing: 'wind',
    mindfulness: 'brain',
    movement: 'activity',
    journaling: 'book-open',
    relaxation: 'moon',
  };

  return iconMap[category] || 'heart';
}

// Get category color for styling
export function getCategoryColor(category: ExerciseCategory): string {
  const colorMap: Record<ExerciseCategory, string> = {
    breathing: 'info', // Blue
    mindfulness: 'moodSad', // Purple/Blue
    movement: 'success', // Green
    journaling: 'brandBrownish', // Brown
    relaxation: 'moodAnxious', // Purple
  };

  return colorMap[category] || 'primary';
}
