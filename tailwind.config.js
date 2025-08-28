/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/lib/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    './theme/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    // Ensure dynamic mood classes are always available
    'bg-mood-happy',
    'bg-mood-sad',
    'bg-mood-anxious',
    'bg-mood-neutral',
    'bg-mood-angry',
    'bg-mood-happy/30',
    'bg-mood-sad/30',
    'bg-mood-anxious/30',
    'bg-mood-neutral/30',
    'bg-mood-angry/30',
    // Solid mood background variants (non-alpha) for cards
    'bg-mood-happy-background',
    'bg-mood-sad-background',
    'bg-mood-anxious-background',
    'bg-mood-neutral-background',
    'bg-mood-angry-background',
    // Chat and navigation utility colors used dynamically
    'bg-chat-bubble-user',
    'bg-chat-bubble-ai',
    'text-tab-active',
    'text-tab-inactive',
    // Brand colors used in components
    'bg-brand-dark-blue',
    'bg-brand-oxford',
    'bg-brand-primary',
    'bg-brand-brownish',
    // Card colors for tab and input backgrounds
    'bg-card',
    'bg-card-elevated',
    'bg-card-darker',
    // Rating scale colors (dynamic usage in mood UI)
    'bg-rating-1',
    'bg-rating-2',
    'bg-rating-3',
    'bg-rating-4',
    'bg-rating-5',
    'bg-rating-6',
    'bg-rating-7',
    'bg-rating-8',
    'bg-rating-9',
    'bg-rating-10',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Core semantic colors - using CSS variables for dynamic theming
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',

        // Primary colors
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },

        // Secondary colors
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },

        // State colors
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          foreground: 'rgb(var(--error-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          foreground: 'rgb(var(--info-foreground) / <alpha-value>)',
        },

        // Muted colors
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },

        // Card colors
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
          elevated: 'rgb(var(--card-elevated) / <alpha-value>)',
          darker: 'rgb(var(--card-darker) / <alpha-value>)',
        },

        // Mood colors
        mood: {
          happy: {
            DEFAULT: 'rgb(var(--mood-happy) / <alpha-value>)',
            light: 'rgb(var(--mood-happy-light) / <alpha-value>)',
            dark: 'rgb(var(--mood-happy-dark) / <alpha-value>)',
            background: 'rgb(var(--mood-happy-bg) / <alpha-value>)',
          },
          sad: {
            DEFAULT: 'rgb(var(--mood-sad) / <alpha-value>)',
            light: 'rgb(var(--mood-sad-light) / <alpha-value>)',
            dark: 'rgb(var(--mood-sad-dark) / <alpha-value>)',
            background: 'rgb(var(--mood-sad-bg) / <alpha-value>)',
          },
          anxious: {
            DEFAULT: 'rgb(var(--mood-anxious) / <alpha-value>)',
            light: 'rgb(var(--mood-anxious-light) / <alpha-value>)',
            dark: 'rgb(var(--mood-anxious-dark) / <alpha-value>)',
            background: 'rgb(var(--mood-anxious-bg) / <alpha-value>)',
          },
          neutral: {
            DEFAULT: 'rgb(var(--mood-neutral) / <alpha-value>)',
            light: 'rgb(var(--mood-neutral-light) / <alpha-value>)',
            dark: 'rgb(var(--mood-neutral-dark) / <alpha-value>)',
            background: 'rgb(var(--mood-neutral-bg) / <alpha-value>)',
          },
          angry: {
            DEFAULT: 'rgb(var(--mood-angry) / <alpha-value>)',
            light: 'rgb(var(--mood-angry-light) / <alpha-value>)',
            dark: 'rgb(var(--mood-angry-dark) / <alpha-value>)',
            background: 'rgb(var(--mood-angry-bg) / <alpha-value>)',
          },
        },

        // Rating scale (1–10) using mood-scale CSS variables
        rating: {
          1: 'rgb(var(--mood-scale-1) / <alpha-value>)',
          2: 'rgb(var(--mood-scale-2) / <alpha-value>)',
          3: 'rgb(var(--mood-scale-3) / <alpha-value>)',
          4: 'rgb(var(--mood-scale-4) / <alpha-value>)',
          5: 'rgb(var(--mood-scale-5) / <alpha-value>)',
          6: 'rgb(var(--mood-scale-6) / <alpha-value>)',
          7: 'rgb(var(--mood-scale-7) / <alpha-value>)',
          8: 'rgb(var(--mood-scale-8) / <alpha-value>)',
          9: 'rgb(var(--mood-scale-9) / <alpha-value>)',
          10: 'rgb(var(--mood-scale-10) / <alpha-value>)',
        },

        // Wellness colors
        wellness: {
          mindfulness: 'rgb(var(--wellness-mindfulness) / <alpha-value>)',
          breathing: 'rgb(var(--wellness-breathing) / <alpha-value>)',
          movement: 'rgb(var(--wellness-movement) / <alpha-value>)',
          journaling: 'rgb(var(--wellness-journaling) / <alpha-value>)',
          relaxation: 'rgb(var(--wellness-relaxation) / <alpha-value>)',
          reminders: 'rgb(var(--wellness-reminders) / <alpha-value>)',
        },

        // Chat specific colors
        chat: {
          'bubble-user': 'rgb(var(--chat-bubble-user) / <alpha-value>)',
          'bubble-ai': 'rgb(var(--chat-bubble-ai) / <alpha-value>)',
          text: 'rgb(var(--chat-text) / <alpha-value>)',
          // Chat type specific colors
          coach: {
            primary: 'rgb(var(--chat-coach-primary) / <alpha-value>)',
            bubble: 'rgb(var(--chat-coach-bubble) / <alpha-value>)',
            accent: 'rgb(var(--chat-coach-accent) / <alpha-value>)',
          },
          event: {
            primary: 'rgb(var(--chat-event-primary) / <alpha-value>)',
            bubble: 'rgb(var(--chat-event-bubble) / <alpha-value>)',
            accent: 'rgb(var(--chat-event-accent) / <alpha-value>)',
          },
          companion: {
            primary: 'rgb(var(--chat-companion-primary) / <alpha-value>)',
            bubble: 'rgb(var(--chat-companion-bubble) / <alpha-value>)',
            accent: 'rgb(var(--chat-companion-accent) / <alpha-value>)',
          },
        },

        // Navigation colors
        tab: {
          active: 'rgb(var(--tab-active) / <alpha-value>)',
          inactive: 'rgb(var(--tab-inactive) / <alpha-value>)',
        },

        // Brand colors
        brand: {
          oxford: 'rgb(var(--brand-oxford) / <alpha-value>)',
          primary: 'rgb(var(--brand-primary) / <alpha-value>)',
          brownish: 'rgb(var(--brand-brownish) / <alpha-value>)',
          'dark-blue': 'rgb(var(--brand-dark-blue) / <alpha-value>)',
        },

        // Keep destructive for compatibility
        destructive: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          foreground: 'rgb(var(--error-foreground) / <alpha-value>)',
        },

        // Keep accent and popover for compatibility
        accent: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--card-elevated) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Primary AveriaSerif font family
        sans: ['AveriaSerif-Regular', 'System'],
        averia: ['AveriaSerif-Regular', 'System'],
        'averia-light': ['AveriaSerif-Light', 'System'],
        'averia-regular': ['AveriaSerif-Regular', 'System'],
        'averia-bold': ['AveriaSerif-Bold', 'System'],
        
        // Inter compatibility layer (now using AveriaSerif fonts)
        inter: ['AveriaSerif-Regular', 'System'],
        'inter-text': ['AveriaSerif-Regular', 'System'],
        'inter-display': ['AveriaSerif-Bold', 'System'],
        'inter-medium': ['AveriaSerif-Regular', 'System'], // No medium variant, use regular
        'inter-bold': ['AveriaSerif-Bold', 'System'],
        
        // Arabic font support - RubikArabic family
        'rubik-arabic': ['RubikArabic-Regular', 'System'],
        'rubik-arabic-light': ['RubikArabic-Light', 'System'],
        'rubik-arabic-regular': ['RubikArabic-Regular', 'System'],
        'rubik-arabic-medium': ['RubikArabic-Medium', 'System'],
        'rubik-arabic-semibold': ['RubikArabic-SemiBold', 'System'],
        'rubik-arabic-bold': ['RubikArabic-Bold', 'System'],
        
        // SF Pro compatibility layer (now using AveriaSerif fonts)
        'sf-pro': ['AveriaSerif-Regular', 'System'],
        'sf-pro-text': ['AveriaSerif-Regular', 'System'],
        'sf-pro-display': ['AveriaSerif-Bold', 'System'],
      },
      fontWeight: {
        ultralight: '100',
        thin: '200',
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        heavy: '800',
        black: '900',
      },
    },
  },
  plugins: [],
};
