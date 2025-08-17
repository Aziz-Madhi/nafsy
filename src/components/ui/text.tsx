import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText, Platform } from 'react-native';
import { cn } from '~/lib/cn';
import { getAutoTextAlignment } from '~/lib/rtl-utils';
// Typography system - simplified without design-tokens
const typography = {
  therapeutic: {
    heading: { fontSize: 28, lineHeight: 36, fontFamily: 'CrimsonPro-Bold' },
    title1: { fontSize: 24, lineHeight: 32, fontFamily: 'CrimsonPro-Bold' },
    title2: { fontSize: 20, lineHeight: 28, fontFamily: 'CrimsonPro-Bold' },
    title3: { fontSize: 18, lineHeight: 24, fontFamily: 'CrimsonPro-SemiBold' },
    body: { fontSize: 16, lineHeight: 22, fontFamily: 'CrimsonPro-Regular' },
    callout: { fontSize: 15, lineHeight: 21, fontFamily: 'SF Pro Display' },
    subhead: { fontSize: 14, lineHeight: 20, fontFamily: 'SF Pro Display' },
    footnote: { fontSize: 12, lineHeight: 18, fontFamily: 'SF Pro Display' },
    caption1: { fontSize: 11, lineHeight: 16, fontFamily: 'SF Pro Display' },
    caption2: { fontSize: 10, lineHeight: 14, fontFamily: 'SF Pro Display' },
  },
  ui: {
    heading: { fontSize: 28, lineHeight: 36, fontFamily: 'SF Pro Display' },
    title1: { fontSize: 24, lineHeight: 32, fontFamily: 'SF Pro Display' },
    title2: { fontSize: 20, lineHeight: 28, fontFamily: 'SF Pro Display' },
    title3: { fontSize: 18, lineHeight: 24, fontFamily: 'SF Pro Display' },
    body: { fontSize: 16, lineHeight: 22, fontFamily: 'SF Pro Display' },
    callout: { fontSize: 15, lineHeight: 21, fontFamily: 'SF Pro Display' },
    subhead: { fontSize: 14, lineHeight: 20, fontFamily: 'SF Pro Display' },
    footnote: { fontSize: 12, lineHeight: 18, fontFamily: 'SF Pro Display' },
    caption1: { fontSize: 11, lineHeight: 16, fontFamily: 'SF Pro Display' },
    caption2: { fontSize: 10, lineHeight: 14, fontFamily: 'SF Pro Display' },
  },
};

const getFontFamily = (platform: 'ios' | 'android') => ({
  system: platform === 'ios' ? 'SF Pro Display' : 'Roboto',
});

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
  context?: TypographyContext; // New prop to override typography context
  therapeuticVariant?: TherapeuticVariant; // Direct access to therapeutic typography
  uiVariant?: UIVariant; // Direct access to UI typography
  autoAlign?: boolean; // Automatically align text based on current language (default: true)
}

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(
  (
    {
      className,
      variant,
      style,
      context = 'auto',
      therapeuticVariant,
      uiVariant,
      autoAlign = true,
      ...props
    },
    ref
  ) => {
    const textClass = React.useContext(TextClassContext);

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
          title1: typography.therapeutic.title1,
          title2: typography.therapeutic.title2,
          title3: typography.therapeutic.title3,
          title4: typography.therapeutic.title3,
          heading: typography.therapeutic.heading,
          body: typography.therapeutic.body,
          callout: typography.therapeutic.callout,
          subhead: {
            ...typography.ui.subhead,
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
          italic: typography.therapeutic.body,

          // New explicit variants
          therapeuticLargeTitle: typography.therapeutic.heading,
          therapeuticTitle1: typography.therapeutic.title1,
          therapeuticTitle2: typography.therapeutic.title2,
          therapeuticBody: typography.therapeutic.body,
          therapeuticBodyLarge: typography.therapeutic.body,
          therapeuticCallout: typography.therapeutic.callout,
          therapeuticEmphasis: typography.therapeutic.body,

          uiLargeTitle: {
            ...typography.ui.heading,
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
            ...typography.ui.heading,
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
            ...typography.ui.subhead,
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

    // Combine all styles
    const typographyStyle = getTypographyStyle();

    // Apply automatic text alignment if enabled
    const autoAlignStyle = autoAlign
      ? { textAlign: getAutoTextAlignment() }
      : {};

    const combinedStyle = [typographyStyle, autoAlignStyle, style];

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
