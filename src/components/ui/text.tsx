import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText, Platform } from 'react-native';
import { cn } from '~/lib/cn';
import { useTranslation } from '~/hooks/useTranslation';
import {
  typography,
  mentalHealthTypography,
  getFontFamily,
  fontFamilies,
} from '~/lib/design-tokens';

// Keep this context for backward compatibility with button, card, tooltip
const TextClassContext = React.createContext<string | undefined>(undefined);

// Typography context types
type TypographyContext = 'therapeutic' | 'ui' | 'auto';
type TherapeuticVariant = keyof typeof typography.therapeutic;
type UIVariant = keyof typeof typography.ui;

const textVariants = cva('text-base text-foreground web:select-text', {
  variants: {
    variant: {
      default: '',
      // Therapeutic typography (using Crimson Pro for emotional content)
      therapeuticLargeTitle: '',
      therapeuticTitle1: '',
      therapeuticTitle2: '',
      therapeuticBody: '',
      therapeuticBodyLarge: '',
      therapeuticCallout: '',
      therapeuticEmphasis: '',

      // UI typography (using system fonts)
      uiLargeTitle: '',
      uiTitle1: '',
      uiTitle2: '',
      uiTitle3: '',
      uiHeadline: '',
      uiBody: '',
      uiCallout: '',
      uiSubheadline: '',
      uiFootnote: '',
      uiCaption1: '',
      uiCaption2: '',

      // Legacy variants for backward compatibility (map to therapeutic)
      title1: '', // Maps to therapeuticTitle1
      title2: '', // Maps to therapeuticTitle2
      title3: '', // Maps to therapeuticTitle2
      title4: '', // Maps to therapeuticTitle2
      heading: '', // Maps to therapeuticTitle2
      body: '', // Maps to therapeuticBody
      callout: '', // Maps to therapeuticCallout
      subhead: '', // Maps to uiSubheadline
      footnote: '', // Maps to uiFootnote
      caption1: '', // Maps to uiCaption1
      caption2: '', // Maps to uiCaption2
      large: '', // Maps to therapeuticTitle2
      small: '', // Maps to uiFootnote
      muted: '', // Maps to uiFootnote
      italic: '', // Maps to therapeuticEmphasis
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface TextProps
  extends React.ComponentPropsWithoutRef<typeof RNText>,
    VariantProps<typeof textVariants> {
  enableRTL?: boolean; // New prop to explicitly enable RTL
  context?: TypographyContext; // New prop to override typography context
  therapeuticVariant?: TherapeuticVariant; // Direct access to therapeutic typography
  uiVariant?: UIVariant; // Direct access to UI typography
}

const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  (
    {
      className,
      variant,
      style,
      enableRTL = true,
      context = 'auto',
      therapeuticVariant,
      uiVariant,
      ...props
    },
    ref
  ) => {
    const textClass = React.useContext(TextClassContext);

    // Safely get translation hook - add error boundary
    let locale = 'en';
    try {
      const translation = useTranslation();
      locale = translation.locale;
    } catch (error) {
      // Fallback if useTranslation fails (e.g., during navigation context issues)
      console.warn(
        'Text component: useTranslation failed, using fallback locale:',
        error
      );
    }

    // Determine typography style based on props
    const getTypographyStyle = () => {
      // Direct variant access takes precedence
      if (therapeuticVariant) {
        return typography.therapeutic[therapeuticVariant];
      }
      if (uiVariant) {
        const platform = Platform.OS as 'ios' | 'android';
        const systemFont = getFontFamily(platform).system;
        return {
          ...typography.ui[uiVariant],
          fontFamily: systemFont,
        };
      }

      // Legacy variant mapping
      if (variant) {
        const legacyMapping: Record<string, any> = {
          title1: typography.therapeutic.largeTitle,
          title2: typography.therapeutic.title1,
          title3: typography.therapeutic.title2,
          title4: typography.therapeutic.title2,
          heading: typography.therapeutic.title2,
          body: typography.therapeutic.body,
          callout: typography.therapeutic.callout,
          subhead: {
            ...typography.ui.subheadline,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          footnote: {
            ...typography.ui.footnote,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          caption1: {
            ...typography.ui.caption1,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          caption2: {
            ...typography.ui.caption2,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          large: typography.therapeutic.title2,
          small: {
            ...typography.ui.footnote,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          muted: {
            ...typography.ui.footnote,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          italic: typography.therapeutic.emphasis,

          // New explicit variants
          therapeuticLargeTitle: typography.therapeutic.largeTitle,
          therapeuticTitle1: typography.therapeutic.title1,
          therapeuticTitle2: typography.therapeutic.title2,
          therapeuticBody: typography.therapeutic.body,
          therapeuticBodyLarge: typography.therapeutic.bodyLarge,
          therapeuticCallout: typography.therapeutic.callout,
          therapeuticEmphasis: typography.therapeutic.emphasis,

          uiLargeTitle: {
            ...typography.ui.largeTitle,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiTitle1: {
            ...typography.ui.title1,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiTitle2: {
            ...typography.ui.title2,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiTitle3: {
            ...typography.ui.title3,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiHeadline: {
            ...typography.ui.headline,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiBody: {
            ...typography.ui.body,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiCallout: {
            ...typography.ui.callout,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiSubheadline: {
            ...typography.ui.subheadline,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiFootnote: {
            ...typography.ui.footnote,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiCaption1: {
            ...typography.ui.caption1,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
          uiCaption2: {
            ...typography.ui.caption2,
            fontFamily: getFontFamily(Platform.OS as 'ios' | 'android').system,
          },
        };

        return legacyMapping[variant] || {};
      }

      // Default to therapeutic body
      return typography.therapeutic.body;
    };

    // Apply RTL text alignment for Arabic when enableRTL is true
    const rtlStyle =
      enableRTL && locale === 'ar' ? { textAlign: 'right' as const } : {};

    // Combine all styles
    const typographyStyle = getTypographyStyle();
    const combinedStyle = [typographyStyle, style, rtlStyle];

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
export type { TextProps, TypographyContext, TherapeuticVariant, UIVariant };
