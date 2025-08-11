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
    tabActive: '#1D4ED8', // matches --tab-active: 29 78 216
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

    // Additional UI colors for profile and components
    brandBrownish: '#8B7355', // warm brownish color for profile sections
    card: '#FFFFFF', // card background
    cardElevated: '#FFFFFF', // elevated card background
    muted: '#F3F4F6', // muted background
    mutedForeground: '#9CA3AF', // muted text color
  },
  dark: {
    // Core colors - match dark mode CSS variables
    primary: '#60A5FA', // matches dark --primary: 96 165 250
    background: '#171717', // matches dark --background: 23 23 23
    foreground: '#F5F5F5', // matches dark --foreground: 245 245 245

    // Navigation colors - dark mode
    tabActive: '#60A5FA', // matches dark --tab-active: 96 165 250
    tabInactive: '#737373', // matches dark --tab-inactive: 115 115 115

    // Chat colors - dark mode
    chatBubbleUser: '#2F6A8D', // matches dark --chat-bubble-user: 47 106 141
    chatBubbleAi: '#404040', // matches dark --chat-bubble-ai: 64 64 64

    // Brand colors - same in dark mode
    brandDarkBlue: '#2F6A8D', // matches --brand-dark-blue: 47 106 141

    // Mood colors - dark mode (keep vibrant)
    moodHappy: '#FCD34D', // matches dark --mood-happy: 252 211 77
    moodSad: '#93C5FD', // matches dark --mood-sad: 147 197 253
    moodAnxious: '#C084FC', // matches dark --mood-anxious: 192 132 252
    moodNeutral: '#94A3B8', // matches dark --mood-neutral: 148 163 184
    moodAngry: '#FCA5A5', // matches dark --mood-angry: 252 165 165

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

    // Additional UI colors for profile and components - dark mode
    brandBrownish: '#A68B5B', // lighter brownish for dark mode
    card: '#262626', // dark card background
    cardElevated: '#2A2A2A', // elevated card background for dark mode
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
