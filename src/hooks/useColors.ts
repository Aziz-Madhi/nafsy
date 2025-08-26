/**
 * Minimal color hook for React Native components requiring hex values
 * These colors mirror the CSS variables in global.css
 * Use only for SymbolView tintColor, shadowColor, and similar React Native-specific props
 * For 90% of components, use Tailwind classes instead!
 */

import { useAppStore } from '~/store/useAppStore';

const nativeColors = {
  light: {
    // Core colors - match CSS variables in global.css
    primary: '#2196F3', // matches --primary: 33 150 243
    background: '#F4F1ED', // matches --background: 244 241 237
    foreground: '#5A4A3A', // matches --foreground: 90 74 58

    // Navigation colors - for SymbolView only
    tabActive: '#2F6A8D', // matches --tab-active: 47 106 141
    tabInactive: '#A3A3A3', // matches --tab-inactive: 163 163 163

    // Chat colors - for React Native specific styling only
    chatBubbleUser: '#2F6A8D', // matches --chat-bubble-user: 47 106 141
    chatBubbleAi: '#202020', // matches --chat-bubble-ai: 32 32 32

    // Brand colors - matches CSS variables
    brandDarkBlue: '#2F6A8D', // matches --brand-dark-blue: 47 106 141

    // Mood colors - for React Native specific components
    moodHappy: '#FCD34D', // matches --mood-happy: 252 211 77
    moodSad: '#6B7FDE', // matches --mood-sad: 107 127 222
    moodAnxious: '#9370DB', // matches --mood-anxious: 147 112 219
    moodNeutral: '#94A3B8', // matches --mood-neutral: 148 163 184
    moodAngry: '#F87171', // matches --mood-angry: 248 113 113
    // Mood light/dark variants to enable layered scaling
    moodHappyLight: '#FEF3C7', // --mood-happy-light
    moodHappyDark: '#F59E0B', // --mood-happy-dark
    moodSadLight: '#E0E7FF', // --mood-sad-light
    moodSadDark: '#4C5EBD', // --mood-sad-dark
    moodAnxiousLight: '#F3F4F6', // --mood-anxious-light (soft gray for relief)
    moodAnxiousDark: '#6B7280', // --mood-anxious-dark
    moodNeutralLight: '#E2E8F0', // --mood-neutral-light
    moodNeutralDark: '#64748B', // --mood-neutral-dark
    moodAngryLight: '#FEE2E2', // --mood-angry-light
    moodAngryDark: '#EF4444', // --mood-angry-dark
    // Mood solid background pastels (warmer, identical across themes)
    moodHappyBg: '#FFD79A', // 255 215 154
    moodSadBg: '#E7CCFF', // 231 204 255
    moodAnxiousBg: '#E3CDFF', // 227 205 255
    moodNeutralBg: '#EEDFC6', // 238 223 198
    moodAngryBg: '#FFBABA', // 255 186 186

    // Mood Rating Scale (1–10)
    moodScale1: '#DC2626',
    moodScale2: '#EF4444',
    moodScale3: '#F97316',
    moodScale4: '#F59E0B',
    moodScale5: '#FACC15',
    moodScale6: '#A3E635',
    moodScale7: '#84CC16',
    moodScale8: '#22C55E',
    moodScale9: '#10B981',
    moodScale10: '#14B8A6',

    // Rating Scale (1–10) per product spec
    ratingScale1: '#2F3A56',
    ratingScale2: '#355B87',
    ratingScale3: '#4E7FAE',
    ratingScale4: '#4FA0A6',
    ratingScale5: '#58B78C',
    ratingScale6: '#8CC56A',
    ratingScale7: '#C9D453',
    ratingScale8: '#F0D247',
    ratingScale9: '#F4B649',
    ratingScale10: '#F19A3E',

    // Shadow colors
    shadow: '#000000', // for shadowColor props
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowMedium: 'rgba(0, 0, 0, 0.1)',
    shadowHeavy: 'rgba(0, 0, 0, 0.15)',

    // State colors
    success: '#22C55E', // matches --success: 34 197 94
    warning: '#F59E0B', // matches --warning: 245 158 11
    error: '#EF4444', // matches --error: 239 68 68
    info: '#3B82F6', // matches --info: 59 130 246

    // Wellness category colors - matches CSS variables
    wellnessMindfulness: '#FF6B6B', // matches --wellness-mindfulness: 255 107 107
    wellnessBreathing: '#4ECDC4', // matches --wellness-breathing: 78 205 196
    wellnessMovement: '#45B7D1', // matches --wellness-movement: 69 183 209
    wellnessJournaling: '#96CEB4', // matches --wellness-journaling: 150 206 180
    wellnessRelaxation: '#FFEA07', // matches --wellness-relaxation: 255 234 167
    wellnessReminders: '#DDA0DD', // matches --wellness-reminders: 221 160 221
    // Wellness background pastels (warmer, unified across themes)
    wellnessMindfulnessBg: '#FFC4C4', // 255 196 196
    wellnessBreathingBg: '#DCEEE5', // 220 238 229
    wellnessMovementBg: '#CEE6F0', // 206 230 240
    wellnessJournalingBg: '#DCECE1', // 220 236 225
    wellnessRelaxationBg: '#FFECC2', // 255 236 194
    wellnessRemindersBg: '#F2C8EE', // 242 200 238

    // Additional UI colors for profile and components
    brandBrownish: '#8B7355', // warm brownish color for profile sections
    card: '#E8E2DB', // matches --card: 232 226 219 (warmer, slightly darker)
    cardElevated: '#F4F0EB', // matches --card-elevated: 244 240 235
    cardDarker: '#E4E1DD', // darker card background - matches --card-darker: 228 225 221
    muted: '#F3F4F6', // muted background
    mutedForeground: '#9CA3AF', // muted text color
  },
  dark: {
    // Core colors - match dark mode CSS variables
    primary: '#60A5FA', // matches dark --primary: 96 165 250
    background: '#0A1514', // matches dark --background: 10 21 20
    foreground: '#F5F5F5', // matches dark --foreground: 245 245 245

    // Navigation colors - dark mode
    tabActive: '#2F6A8D', // matches dark --tab-active: 47 106 141
    tabInactive: '#737373', // matches dark --tab-inactive: 115 115 115

    // Chat colors - dark mode
    chatBubbleUser: '#2F6A8D', // matches dark --chat-bubble-user: 47 106 141
    chatBubbleAi: '#404040', // matches dark --chat-bubble-ai: 64 64 64

    // Brand colors - same in dark mode
    brandDarkBlue: '#2F6A8D', // matches --brand-dark-blue: 47 106 141

    // Mood colors - unified with light mode for consistency
    moodHappy: '#FCD34D', // unified with light
    moodSad: '#6B7FDE', // unified with light
    moodAnxious: '#9370DB', // unified with light
    moodNeutral: '#94A3B8', // unified with light
    moodAngry: '#F87171', // unified with light
    // Mood light/dark variants to enable layered scaling
    moodHappyLight: '#FEF3C7',
    moodHappyDark: '#F59E0B',
    moodSadLight: '#E0E7FF',
    moodSadDark: '#4C5EBD',
    moodAnxiousLight: '#F3F4F6',
    moodAnxiousDark: '#6B7280',
    moodNeutralLight: '#E2E8F0',
    moodNeutralDark: '#64748B',
    moodAngryLight: '#FEE2E2',
    moodAngryDark: '#EF4444',
    // Mood solid background pastels (warmer, identical across themes)
    moodHappyBg: '#FFD79A', // 255 215 154
    moodSadBg: '#E7CCFF', // 231 204 255
    moodAnxiousBg: '#E3CDFF', // 227 205 255
    moodNeutralBg: '#EEDFC6', // 238 223 198
    moodAngryBg: '#FFBABA', // 255 186 186

    // Mood Rating Scale (1–10)
    moodScale1: '#DC2626',
    moodScale2: '#EF4444',
    moodScale3: '#F97316',
    moodScale4: '#F59E0B',
    moodScale5: '#FACC15',
    moodScale6: '#A3E635',
    moodScale7: '#84CC16',
    moodScale8: '#22C55E',
    moodScale9: '#10B981',
    moodScale10: '#14B8A6',

    // Rating Scale (1–10) per product spec
    ratingScale1: '#2F3A56',
    ratingScale2: '#355B87',
    ratingScale3: '#4E7FAE',
    ratingScale4: '#4FA0A6',
    ratingScale5: '#58B78C',
    ratingScale6: '#8CC56A',
    ratingScale7: '#C9D453',
    ratingScale8: '#F0D247',
    ratingScale9: '#F4B649',
    ratingScale10: '#F19A3E',

    // Shadow colors - darker for dark mode
    shadow: '#000000',
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.3)',
    shadowHeavy: 'rgba(0, 0, 0, 0.4)',

    // State colors - adjusted for dark mode
    success: '#4ADE80', // matches dark --success: 74 222 128
    warning: '#FBB00F', // matches dark --warning: 251 191 36
    error: '#F87171', // matches dark --error: 248 113 113
    info: '#60A5FA', // matches dark --info: 96 165 250

    // Wellness category colors - same vibrant colors for dark mode
    wellnessMindfulness: '#FF6B6B', // matches --wellness-mindfulness: 255 107 107
    wellnessBreathing: '#4ECDC4', // matches --wellness-breathing: 78 205 196
    wellnessMovement: '#45B7D1', // matches --wellness-movement: 69 183 209
    wellnessJournaling: '#96CEB4', // matches --wellness-journaling: 150 206 180
    wellnessRelaxation: '#FFEA07', // matches --wellness-relaxation: 255 234 167
    wellnessReminders: '#DDA0DD', // matches --wellness-reminders: 221 160 221
    // Wellness background pastels (warmer, unified across themes)
    wellnessMindfulnessBg: '#FFC4C4', // 255 196 196
    wellnessBreathingBg: '#DCEEE5', // 220 238 229
    wellnessMovementBg: '#CEE6F0', // 206 230 240
    wellnessJournalingBg: '#DCECE1', // 220 236 225
    wellnessRelaxationBg: '#FFECC2', // 255 236 194
    wellnessRemindersBg: '#F2C8EE', // 242 200 238

    // Additional UI colors for profile and components - dark mode
    brandBrownish: '#A68B5B', // lighter brownish for dark mode
    card: '#0E1C1B', // ~14 28 27, aligns with --card
    cardElevated: '#102220', // ~16 34 32, aligns with --card-elevated
    cardDarker: '#1C1C1C', // darker card background - matches --card-darker: 28 28 28
    muted: '#404040', // dark muted background
    mutedForeground: '#A3A3A3', // dark muted text color
  },
} as const;

/**
 * Hook to get hex colors for React Native components that require them
 * Use sparingly - prefer Tailwind classes for 90% of styling!
 */
export function useColors() {
  const currentTheme = useAppStore((state) => state.currentTheme);
  return nativeColors[currentTheme === 'dark' ? 'dark' : 'light'];
}

/**
 * Get mood color by mood type - for React Native specific components only
 */
export function useMoodColor(
  mood: 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry'
) {
  const colors = useColors();
  const moodKey =
    `mood${mood.charAt(0).toUpperCase() + mood.slice(1)}` as keyof typeof colors;
  return colors[moodKey] as string;
}

/**
 * Get shadow style for React Native components
 */
export function useShadowStyle(
  intensity: 'light' | 'medium' | 'heavy' = 'medium'
) {
  const colors = useColors();

  const shadowStyles = {
    light: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    heavy: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8,
    },
  };

  return shadowStyles[intensity];
}

/**
 * Get navigation colors for React Native specific components
 */
export function useNavigationColors() {
  const colors = useColors();
  return {
    active: colors.tabActive,
    inactive: colors.tabInactive,
  };
}

/**
 * Get chat colors for React Native specific components
 */
export function useChatColors() {
  const colors = useColors();
  return {
    userBubble: colors.chatBubbleUser,
    aiBubble: colors.chatBubbleAi,
  };
}

// Type exports
export type ColorScheme = keyof typeof nativeColors;
export type MoodType = 'happy' | 'sad' | 'anxious' | 'neutral' | 'angry';
