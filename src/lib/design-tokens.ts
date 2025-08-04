/**
 * Premium Design Token System
 * Sophisticated color palette and design tokens for world-class mental health app
 */

// Premium Color System with emotional connections
export const colors = {
  // Primary wellness palette with sophisticated gradients
  wellness: {
    mindfulness: {
      primary: '#FF6B6B',
      secondary: '#FF8E8E',
      gradient: ['#FF6B6B', '#FF8E8E', '#FFB1B1'],
      background: '#FFF5F5',
      foreground: '#4A1515',
    },
    breathing: {
      primary: '#4ECDC4',
      secondary: '#7DD3CF',
      gradient: ['#4ECDC4', '#7DD3CF', '#A8E6E1'],
      background: '#F0FDFC',
      foreground: '#134E4A',
    },
    movement: {
      primary: '#45B7D1',
      secondary: '#6BC5D8',
      gradient: ['#45B7D1', '#6BC5D8', '#91D5E0'],
      background: '#F0F9FF',
      foreground: '#0C4A6E',
    },
    journaling: {
      primary: '#96CEB4',
      secondary: '#B5D6C6',
      gradient: ['#96CEB4', '#B5D6C6', '#D4E7D8'],
      background: '#F0FDF4',
      foreground: '#14532D',
    },
    relaxation: {
      primary: '#FFEAA7',
      secondary: '#FFEF9F',
      gradient: ['#FFEAA7', '#FFEF9F', '#FFF2B3'],
      background: '#FFFBEB',
      foreground: '#92400E',
    },
    reminders: {
      primary: '#DDA0DD',
      secondary: '#E4B5E4',
      gradient: ['#DDA0DD', '#E4B5E4', '#EBCAEB'],
      background: '#FAF5FF',
      foreground: '#581C87',
    },
  },

  // Mood tracking color system - evidence-based color psychology
  mood: {
    sad: {
      primary: '#6B7FDE', // Calming blue - associated with sadness but not too dark
      light: '#E0E7FF', // Light background for cards
      dark: '#4C5EBD', // Darker variant for borders/emphasis
      background: '#F5F7FF', // Very light background
    },
    anxious: {
      primary: '#9370DB', // Medium slate blue - calming purple for anxiety
      light: '#F3F4F6', // Light background for cards
      dark: '#6B7280', // Darker variant for borders/emphasis
      background: '#F9FAFB', // Very light background
    },
    neutral: {
      primary: '#94A3B8', // Cool gray-blue - represents emotional neutrality
      light: '#E2E8F0', // Light background for cards
      dark: '#64748B', // Darker variant for borders/emphasis
      background: '#F8FAFC', // Very light background
    },
    happy: {
      primary: '#FCD34D', // Warm yellow - universally associated with happiness
      light: '#FEF3C7', // Light background for cards
      dark: '#F59E0B', // Darker variant for borders/emphasis
      background: '#FFFBEB', // Very light background
    },
    angry: {
      primary: '#F87171', // Muted red - anger without being too aggressive
      light: '#FEE2E2', // Light background for cards
      dark: '#EF4444', // Darker variant for borders/emphasis
      background: '#FEF2F2', // Very light background
    },
  },

  // Neutral system for backgrounds and text
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Brand colors
  brand: {
    oxfordBlue: '#002147',
  },

  // Glass effect colors
  glass: {
    light: 'rgba(255, 255, 255, 0.25)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(0, 0, 0, 0.1)',
  },
} as const;

// Font families for mental health app
export const fontFamilies = {
  // Primary serif for emotional content (using NEW variable fonts)
  serif: {
    regular: 'CrimsonPro-Regular',
    bold: 'CrimsonPro-Bold', // Keep old for compatibility
    italic: 'CrimsonPro-Italic',
    variable: 'CrimsonPro-VariableFont', // NEW variable font
    italicVariable: 'CrimsonPro-Italic-VariableFont', // NEW italic variable font
  },
  // NEW specialized font
  specialty: {
    noto: 'NotoSerifDivesAkuru-Regular', // NEW Noto font
  },
  // System fonts for UI elements
  system: {
    ios: 'SF Pro Text',
    android: 'Roboto',
    fallback: 'System',
  },
} as const;

// Typography scale following iOS guidelines with mental health considerations
export const typography = {
  // Emotional content typography (using Crimson Pro)
  therapeutic: {
    largeTitle: {
      fontSize: 34,
      lineHeight: 44,
      fontWeight: 'normal' as const,
      fontFamily: fontFamilies.serif.bold, // Use CrimsonPro-Bold
      letterSpacing: 0.2,
    },
    title1: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: 'normal' as const,
      fontFamily: fontFamilies.serif.bold, // Use CrimsonPro-Bold
      letterSpacing: 0.1,
    },
    title2: {
      fontSize: 22,
      lineHeight: 30,
      fontWeight: 'normal' as const,
      fontFamily: fontFamilies.serif.bold, // Use CrimsonPro-Bold
      letterSpacing: 0.05,
    },
    body: {
      fontSize: 17,
      lineHeight: 26, // Generous line height for readability
      fontWeight: '400' as const,
      fontFamily: fontFamilies.serif.regular,
      letterSpacing: 0,
    },
    bodyLarge: {
      fontSize: 19,
      lineHeight: 28,
      fontWeight: '400' as const,
      fontFamily: fontFamilies.serif.regular,
      letterSpacing: 0,
    },
    callout: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      fontFamily: fontFamilies.serif.regular,
      letterSpacing: 0,
    },
    emphasis: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '500' as const,
      fontFamily: fontFamilies.serif.italicVariable, // Use NEW italic variable font
      letterSpacing: 0,
    },
  },

  // UI typography (using system fonts)
  ui: {
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700' as const,
      letterSpacing: 0.37,
    },
    title1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: 0.36,
    },
    title2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      letterSpacing: 0.35,
    },
    title3: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600' as const,
      letterSpacing: 0.38,
    },
    headline: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.41,
    },
    body: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400' as const,
      letterSpacing: -0.41,
    },
    callout: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '400' as const,
      letterSpacing: -0.32,
    },
    subheadline: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: -0.24,
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
      letterSpacing: -0.08,
    },
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '400' as const,
      letterSpacing: 0.07,
    },
  },

  // Legacy support (maps to UI typography)
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
} as const;

// Spacing system following 8px grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
  '6xl': 96,
} as const;

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Shadow system for depth
export const shadows = {
  // iOS-style shadows
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  // Glass effect shadow
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

// Animation timings following iOS guidelines
export const animations = {
  timing: {
    quick: 200,
    normal: 300,
    slow: 500,
    lazy: 800,
  },
  easing: {
    // iOS standard easing curves
    standard: [0.4, 0.0, 0.2, 1],
    decelerate: [0.0, 0.0, 0.2, 1],
    accelerate: [0.4, 0.0, 1, 1],
    sharp: [0.4, 0.0, 0.6, 1],
  },
} as const;

// Layout constants
export const layout = {
  headerHeight: 44,
  tabBarHeight: 83,
  cardMinHeight: 120,
  cardAspectRatio: 1.2,
  gridSpacing: 16,
  containerPadding: 20,
} as const;

// Helper functions for creating gradients
export const createGradient = (colors: string[], direction = '135deg') => ({
  background: `linear-gradient(${direction}, ${colors.join(', ')})`,
});

export const createGlassEffect = (opacity = 0.25) => ({
  backgroundColor: `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: 'blur(20px)',
  borderWidth: 1,
  borderColor: `rgba(255, 255, 255, ${Math.min(opacity + 0.1, 0.4)})`,
});

// Category-specific helper
export const getCategoryTheme = (category: keyof typeof colors.wellness) => {
  const theme = colors.wellness[category];
  return {
    ...theme,
    glass: createGlassEffect(0.15),
    shadow: shadows.glass,
  };
};

// Font utility functions for mental health app
export const getFontFamily = (platform: 'ios' | 'android' | 'web' = 'ios') => {
  const systemFont =
    platform === 'ios'
      ? fontFamilies.system.ios
      : platform === 'android'
        ? fontFamilies.system.android
        : fontFamilies.system.fallback;

  return {
    serif: fontFamilies.serif.regular,
    serifVariable: fontFamilies.serif.variable,
    serifItalic: fontFamilies.serif.italic,
    system: systemFont,
  };
};

// Typography style creator for therapeutic content
export const createTherapeuticStyle = (
  variant: keyof typeof typography.therapeutic,
  customWeight?: string
) => {
  const baseStyle = typography.therapeutic[variant];
  return {
    ...baseStyle,
    ...(customWeight && { fontWeight: customWeight }),
  };
};

// Typography style creator for UI content
export const createUIStyle = (
  variant: keyof typeof typography.ui,
  platform: 'ios' | 'android' | 'web' = 'ios'
) => {
  const baseStyle = typography.ui[variant];
  const systemFont = getFontFamily(platform).system;

  return {
    ...baseStyle,
    fontFamily: systemFont,
  };
};

// Mental health specific typography contexts
export const mentalHealthTypography = {
  // Chat message styling
  chatMessage: {
    user: createTherapeuticStyle('body'),
    therapist: createTherapeuticStyle('bodyLarge'),
    timestamp: createUIStyle('caption1'),
  },

  // Exercise content styling
  exercise: {
    title: createTherapeuticStyle('title2'),
    description: createTherapeuticStyle('callout'),
    instructions: createTherapeuticStyle('body'),
    benefits: createTherapeuticStyle('emphasis'),
  },

  // Mood tracking styling
  mood: {
    entryText: createTherapeuticStyle('body'),
    reflection: createTherapeuticStyle('bodyLarge'),
    insights: createTherapeuticStyle('emphasis'),
  },

  // Welcome and onboarding
  welcome: {
    title: createTherapeuticStyle('largeTitle'),
    subtitle: createTherapeuticStyle('emphasis'),
    description: createTherapeuticStyle('body'),
  },
} as const;
