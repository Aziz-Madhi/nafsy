/**
 * Color Type Definitions
 * Provides TypeScript types for color-related functionality
 * For actual colors, use CSS variables via Tailwind classes or the useColors hook
 */

// Core mood types used throughout the app
export type MoodType = 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry';

// Wellness category types
export type WellnessCategory =
  | 'mindfulness'
  | 'breathing'
  | 'movement'
  | 'journaling'
  | 'relaxation'
  | 'reminders';

// Color scheme types
export type ColorScheme = 'light' | 'dark';

// State color types
export type StateColor = 'success' | 'warning' | 'error' | 'info';

// Component color variant types
export type CardVariant = 'default' | 'subtle' | 'elevated';
export type InputState = 'default' | 'focused' | 'subtle';
export type OverlayIntensity = 'light' | 'medium' | 'heavy' | 'backdrop';
export type GlassVariant = 'light' | 'medium' | 'dark';

// Helper function to get color with opacity (for React Native components that need it)
export function withOpacity(
  color: string | undefined,
  opacity: number
): string {
  // Handle null/undefined inputs gracefully
  if (!color || typeof color !== 'string') {
    console.warn(
      `withOpacity received invalid color: ${color}. Falling back to transparent.`
    );
    return `rgba(0, 0, 0, ${Math.max(0, Math.min(1, opacity))})`;
  }

  // Ensure opacity is within valid range
  const validOpacity = Math.max(0, Math.min(1, opacity));

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    // Handle 3-character hex codes
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${validOpacity})`;
    }
    // Handle 6-character hex codes
    if (hex.length === 6) {
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${validOpacity})`;
    }
  }

  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${validOpacity})`;
    }
  }

  // If we can't parse the color, return it as-is with a warning
  console.warn(
    `withOpacity couldn't parse color: ${color}. Returning original color.`
  );
  return color;
}
