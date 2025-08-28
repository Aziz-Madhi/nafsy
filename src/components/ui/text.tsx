import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText, Platform } from 'react-native';
import { cn } from '~/lib/cn';
import { getAutoTextAlignment } from '~/lib/rtl-utils';
import { useCurrentLanguage } from '~/store/useAppStore';
// Typography system using AveriaSerif fonts with proper hierarchy
const typography = {
  // Large titles and headings - AveriaSerif Bold with appropriate sizes
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontFamily: 'AveriaSerif-Bold',
    fontWeight: '700',
  },
  heading: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: 'AveriaSerif-Bold',
    fontWeight: '700',
  },
  title1: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'AveriaSerif-Bold',
    fontWeight: '600',
  },
  title2: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'AveriaSerif-Bold',
    fontWeight: '600',
  },
  title3: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'AveriaSerif-Regular',
    fontWeight: '500',
  },

  // Body and content text - AveriaSerif Regular for readability (minimum 16pt for readable content)
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'AveriaSerif-Regular',
    fontWeight: '400',
  },
  bodyLarge: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'AveriaSerif-Regular',
    fontWeight: '400',
  },

  // Interactive elements - AveriaSerif Regular for prominence (16pt minimum for tappable elements)
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'AveriaSerif-Regular',
    fontWeight: '500',
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'AveriaSerif-Regular',
    fontWeight: '400',
  }, // Using regular weight for subheading

  // UI labels and metadata - AveriaSerif Regular and Light (accessible but compact)
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'AveriaSerif-Regular',
    fontWeight: '400',
  }, // Using AveriaSerif Regular for footnotes
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'AveriaSerif-Regular',
    fontWeight: '400',
  }, // Using AveriaSerif Regular for captions
  caption2: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'AveriaSerif-Light',
    fontWeight: '300',
  }, // Using lighter weight for smallest text
};

// Function to get appropriate font family based on language and font type
const getFontFamily = (
  fontType: 'display' | 'text' | 'bold' | 'semibold' | 'medium',
  language: string
) => {
  if (language === 'ar') {
    // Return the appropriate RubikArabic font based on type
    switch (fontType) {
      case 'bold':
        return 'RubikArabic-Bold';
      case 'semibold':
        return 'RubikArabic-SemiBold';
      case 'medium':
        return 'RubikArabic-Medium';
      case 'display':
        return 'RubikArabic-Bold'; // Display text uses Bold
      case 'text':
      default:
        return 'RubikArabic-Regular'; // Body text uses Regular
    }
  }

  // Return the appropriate AveriaSerif font based on type
  switch (fontType) {
    case 'bold':
      return 'AveriaSerif-Bold';
    case 'semibold':
      return 'AveriaSerif-Bold'; // Map semibold to bold
    case 'medium':
      return 'AveriaSerif-Regular'; // Map medium to regular
    case 'display':
      return 'AveriaSerif-Bold'; // Display text uses Bold
    case 'text':
    default:
      return 'AveriaSerif-Regular'; // Body text uses Regular
  }
};

// Keep this context for backward compatibility with button, card, tooltip
const TextClassContext = React.createContext<string | undefined>(undefined);

// Typography context types - simplified since all text uses AveriaSerif now
type TypographyVariant = keyof typeof typography;

const textVariants = cva('text-base text-foreground web:select-text', {
  variants: {
    variant: {
      default: '',
      // AveriaSerif typography variants
      largeTitle: '',
      heading: '',
      title1: '',
      title2: '',
      title3: '',
      body: '',
      bodyLarge: '',
      callout: '',
      subhead: '',
      footnote: '',
      caption1: '',
      caption2: '',

      // Legacy variants for backward compatibility
      large: '', // Maps to title2
      small: '', // Maps to footnote
      muted: '', // Maps to footnote
      italic: '', // Maps to body with italic
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface TextProps
  extends React.ComponentPropsWithoutRef<typeof RNText>,
    VariantProps<typeof textVariants> {
  typographyVariant?: TypographyVariant; // Direct access to typography variants
  autoAlign?: boolean; // Automatically align text based on current language (default: true)
  italic?: boolean; // Apply italic styling
}

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(
  (
    {
      className,
      variant,
      style,
      typographyVariant,
      autoAlign = true,
      italic = false,
      ...props
    },
    ref
  ) => {
    const textClass = React.useContext(TextClassContext);

    const currentLanguage = useCurrentLanguage();

    // Determine typography style based on props with language-aware font selection
    const getTypographyStyle = () => {
      let baseStyle;

      // Direct typography variant access takes precedence
      if (typographyVariant) {
        baseStyle = typography[typographyVariant];
      } else if (variant) {
        // Variant mapping
        const variantMapping: Record<string, any> = {
          largeTitle: typography.largeTitle,
          heading: typography.heading,
          title1: typography.title1,
          title2: typography.title2,
          title3: typography.title3,
          body: typography.body,
          bodyLarge: typography.bodyLarge,
          callout: typography.callout,
          subhead: typography.subhead,
          footnote: typography.footnote,
          caption1: typography.caption1,
          caption2: typography.caption2,

          // Legacy variant mappings
          large: typography.title2,
          small: typography.footnote,
          muted: typography.footnote,
          italic: { ...typography.body, fontStyle: 'italic' },
        };

        baseStyle = variantMapping[variant] || typography.body;
      } else {
        // Default to body
        baseStyle = typography.body;
      }

      // Apply language-appropriate font family based on the specific Inter font
      let fontType: 'display' | 'text' | 'bold' | 'semibold' | 'medium' =
        'text';

      if (baseStyle.fontFamily.includes('Bold')) {
        fontType = 'bold';
      } else if (baseStyle.fontFamily.includes('SemiBold')) {
        fontType = 'semibold';
      } else if (baseStyle.fontFamily.includes('Medium')) {
        fontType = 'medium';
      } else if (baseStyle.fontFamily.includes('Display')) {
        fontType = 'display';
      }

      const languageAwareFontFamily = getFontFamily(fontType, currentLanguage);

      return {
        ...baseStyle,
        fontFamily: languageAwareFontFamily,
      };
    };

    // Combine all styles
    const typographyStyle = getTypographyStyle();

    // Apply italic styling if requested
    const italicStyle = italic ? { fontStyle: 'italic' } : {};

    // Apply automatic text alignment if enabled
    const autoAlignStyle = autoAlign
      ? { textAlign: getAutoTextAlignment() }
      : {};

    const combinedStyle = [typographyStyle, italicStyle, autoAlignStyle, style];

    return (
      <RNText
        className={cn(textVariants({ variant }), textClass, className)}
        style={combinedStyle}
        ref={ref}
        {...props}
      />
    );
  }
);
Text.displayName = 'Text';

export { Text, textVariants, TextClassContext };
export type { TextProps, TypographyVariant };
