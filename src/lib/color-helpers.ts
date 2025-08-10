/**
 * Color Helper Functions - Tailwind Class Generators
 * Provides utility functions for generating Tailwind classes
 * Use these for dynamic class generation only - prefer direct Tailwind classes when possible
 */

// Helper to get CSS variable value (for runtime CSS variable access)
export function getCssVariable(variable: string): string {
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(variable).trim();
    return value;
  }
  return '';
}

// Helper to format RGB CSS variable for use with opacity
export function formatRgbWithOpacity(cssVar: string, opacity: number): string {
  const rgb = getCssVariable(cssVar);
  if (rgb) {
    return `rgb(${rgb} / ${opacity})`;
  }
  return `rgb(0 0 0 / ${opacity})`;
}

// Mood button class helper - generates dynamic Tailwind classes
export function getMoodButtonClass(
  isSelected: boolean,
  moodType: 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry'
): string {
  if (isSelected) {
    return `bg-mood-${moodType}`;
  }
  return 'bg-black/5';
}

// Card background class helper
export function getCardBackgroundClass(
  variant: 'default' | 'subtle' | 'elevated' = 'default'
): string {
  switch (variant) {
    case 'subtle':
      return 'bg-background';
    case 'elevated':
      return 'bg-card-elevated';
    default:
      return 'bg-card';
  }
}

// Container background class based on mood state
export function getContainerBackgroundClass(
  hasLoggedMood: boolean,
  moodType?: 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry'
): string {
  if (hasLoggedMood && moodType) {
    return `bg-mood-${moodType}/30`;
  }
  return 'bg-card';
}

// Input background class based on state
export function getInputBackgroundClass(
  state: 'default' | 'focused' | 'subtle' = 'default'
): string {
  switch (state) {
    case 'focused':
      return 'bg-input-focused';
    case 'subtle':
      return 'bg-black/[0.04]';
    default:
      return 'bg-input';
  }
}

// State background class (success, error, etc.)
export function getStateBackgroundClass(
  state: 'success' | 'warning' | 'error' | 'info'
): string {
  return `bg-${state}/10`;
}

// State border class
export function getStateBorderClass(
  state: 'success' | 'warning' | 'error' | 'info'
): string {
  return `border-${state}/20`;
}

// Overlay background class
export function getOverlayBackgroundClass(
  intensity: 'light' | 'medium' | 'heavy' | 'backdrop' = 'medium'
): string {
  switch (intensity) {
    case 'light':
      return 'bg-white/20 dark:bg-black/20';
    case 'heavy':
      return 'bg-white/60 dark:bg-black/60';
    case 'backdrop':
      return 'bg-black/80';
    default:
      return 'bg-white/40 dark:bg-black/40';
  }
}

// Glass effect class
export function getGlassEffectClass(
  variant: 'light' | 'medium' | 'dark' = 'light'
): string {
  return `glass-${variant}`;
}

// Navigation icon color class
export function getNavigationIconClass(isActive: boolean): string {
  return isActive ? 'text-tab-active' : 'text-tab-inactive';
}

// Chat bubble background class
export function getChatBubbleClass(isUser: boolean): string {
  return isUser ? 'bg-chat-bubble-user' : 'bg-chat-bubble-ai';
}

// Text color class based on theme
export function getTextColorClass(
  variant: 'primary' | 'secondary' | 'muted' | 'foreground' = 'foreground'
): string {
  switch (variant) {
    case 'primary':
      return 'text-primary';
    case 'secondary':
      return 'text-secondary-foreground';
    case 'muted':
      return 'text-muted-foreground';
    default:
      return 'text-foreground';
  }
}
