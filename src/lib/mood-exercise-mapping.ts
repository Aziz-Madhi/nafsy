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

// --- Rating helpers ---

/**
 * Map a 1-10 rating to a mood category for backward compatibility with exercises.
 * Note: Tags now use rating-based system directly.
 */
export function getMoodCategoryFromRating(rating: number): MoodType {
  if (rating <= 2) return 'sad';
  if (rating <= 4) return 'anxious';
  if (rating <= 6) return 'neutral';
  if (rating <= 10) return 'happy';
  return 'neutral';
}

/**
 * Get appropriate exercise categories based on rating (more granular than mood categories).
 */
export function getExerciseCategoriesForRating(
  rating: number
): ExerciseCategory[] {
  // Ratings 1-2: Severely distressed - focus on breathing and relaxation
  if (rating <= 2) {
    return ['breathing', 'relaxation', 'mindfulness'];
  }
  // Ratings 3-4: Low mood - breathing, mindfulness, gentle movement
  if (rating <= 4) {
    return ['breathing', 'mindfulness', 'relaxation', 'journaling'];
  }
  // Ratings 5-6: Neutral - all options available
  if (rating <= 6) {
    return ['mindfulness', 'breathing', 'movement', 'journaling', 'relaxation'];
  }
  // Ratings 7-8: Good mood - maintain energy, explore growth
  if (rating <= 8) {
    return ['movement', 'journaling', 'mindfulness'];
  }
  // Ratings 9-10: Excellent mood - celebration and maintaining positivity
  return ['movement', 'journaling'];
}

/**
 * Get a rating-based encouraging message.
 */
export function getRatingBasedEncouragement(
  rating: number,
  locale: 'en' | 'ar'
): string {
  const messages = {
    en: {
      low: 'Gentle care for difficult moments', // 1-3
      challenging: 'Small steps toward feeling better', // 4-5
      neutral: 'A balanced place to be', // 6
      good: 'Building on positive momentum', // 7-8
      excellent: 'Celebrating this wonderful feeling', // 9-10
    },
    ar: {
      low: 'رعاية لطيفة للحظات الصعبة',
      challenging: 'خطوات صغيرة نحو الشعور بتحسن',
      neutral: 'مكان متوازن للوجود',
      good: 'البناء على الزخم الإيجابي',
      excellent: 'الاحتفال بهذا الشعور الرائع',
    },
  };

  let category: keyof typeof messages.en;
  if (rating <= 3) category = 'low';
  else if (rating <= 5) category = 'challenging';
  else if (rating === 6) category = 'neutral';
  else if (rating <= 8) category = 'good';
  else category = 'excellent';

  return messages[locale][category];
}

/**
 * Fallback mapping for legacy mood entries without rating.
 */
export function mapMoodToRating(mood: string): number {
  switch (mood) {
    case 'sad':
      return 2;
    case 'anxious':
      return 4;
    case 'neutral':
      return 6;
    case 'happy':
      return 8;
    case 'angry':
      return 3;
    default:
      return 5;
  }
}
