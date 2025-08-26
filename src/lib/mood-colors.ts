import { useColors } from '~/hooks/useColors';
import { mapMoodToRating } from '~/lib/mood-exercise-mapping';

interface MoodEntry {
  mood?: 'sad' | 'anxious' | 'neutral' | 'happy' | 'angry';
  rating?: number;
  timeOfDay?: 'morning' | 'evening';
}

// Helper functions removed - using direct gradients without color blending

/**
 * Get color for a mood entry based on rating or mood type
 */
export function getMoodColor(
  entry: MoodEntry | undefined,
  colors: ReturnType<typeof useColors>
): string {
  if (!entry) {
    const isDarkMode = colors.background === '#0A1514';
    return isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  }

  const rating =
    entry.rating ?? (entry.mood ? mapMoodToRating(entry.mood) : undefined);
  if (rating) {
    const clamped = Math.max(1, Math.min(10, Math.round(rating)));
    const key = `ratingScale${clamped}` as keyof typeof colors;
    return colors[key] as string;
  }

  // Fallback to legacy mood colors
  switch (entry.mood) {
    case 'happy':
      return colors.moodHappy;
    case 'sad':
      return colors.moodSad;
    case 'anxious':
      return colors.moodAnxious;
    case 'neutral':
      return colors.moodNeutral;
    case 'angry':
      return colors.moodAngry;
    default:
      return colors.moodNeutral;
  }
}

/**
 * Get gradient style for a day with potentially two mood entries
 * Returns either a solid color or gradient configuration
 */
export function getMoodPixelStyle(
  morningMood: MoodEntry | undefined,
  eveningMood: MoodEntry | undefined,
  colors: ReturnType<typeof useColors>,
  isToday: boolean = false
): {
  type: 'solid' | 'gradient';
  color?: string;
  colors?: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
} {
  const morningColor = morningMood ? getMoodColor(morningMood, colors) : null;
  const eveningColor = eveningMood ? getMoodColor(eveningMood, colors) : null;

  // No moods logged
  if (!morningColor && !eveningColor) {
    const isDarkMode = colors.background === '#0A1514';
    return {
      type: 'solid',
      color: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    };
  }

  // Only morning mood logged
  if (morningColor && !eveningColor) {
    // For TODAY: show half-filled (expecting evening mood)
    if (isToday) {
      return {
        type: 'gradient',
        colors: [morningColor, morningColor, 'transparent', 'transparent'],
        locations: [0, 0.5, 0.5, 1],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
      };
    }
    // For PAST days: fill entire pixel
    return {
      type: 'solid',
      color: morningColor,
    };
  }

  // Only evening mood logged
  if (!morningColor && eveningColor) {
    // For TODAY: show half-filled (missed morning, but logged evening)
    if (isToday) {
      return {
        type: 'gradient',
        colors: ['transparent', 'transparent', eveningColor, eveningColor],
        locations: [0, 0.5, 0.5, 1],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
      };
    }
    // For PAST days: fill entire pixel
    return {
      type: 'solid',
      color: eveningColor,
    };
  }

  // Both moods logged - create beautiful horizontal gradient
  if (morningColor && eveningColor) {
    if (morningColor === eveningColor) {
      // Same mood for both - solid color
      return {
        type: 'solid',
        color: morningColor,
      };
    }

    // Different moods - create smooth left-to-right gradient
    return {
      type: 'gradient',
      colors: [morningColor, eveningColor],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    };
  }

  // Fallback
  return {
    type: 'solid',
    color: colors.moodNeutral,
  };
}

/**
 * Parse moods for a specific day from an array of mood entries
 * Returns morning and evening moods separately
 */
export function parseDayMoods(
  moods: MoodEntry[],
  date: Date
): { morning: MoodEntry | undefined; evening: MoodEntry | undefined } {
  const dayMoods = moods.filter((mood) => {
    const moodDate = new Date((mood as any).createdAt);
    return (
      moodDate.getDate() === date.getDate() &&
      moodDate.getMonth() === date.getMonth() &&
      moodDate.getFullYear() === date.getFullYear()
    );
  });

  const morningMood =
    dayMoods.find((m) => m.timeOfDay === 'morning') ||
    dayMoods.find((m) => {
      const hour = new Date((m as any).createdAt).getHours();
      return hour < 12;
    });

  const eveningMood =
    dayMoods.find((m) => m.timeOfDay === 'evening') ||
    dayMoods.find((m) => {
      const hour = new Date((m as any).createdAt).getHours();
      return hour >= 12 && m !== morningMood;
    });

  return { morning: morningMood, evening: eveningMood };
}
