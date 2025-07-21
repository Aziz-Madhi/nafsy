import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cn } from '~/lib/cn';
import { useTranslation } from '~/hooks/useTranslation';

// Keep this context for backward compatibility with button, card, tooltip
const TextClassContext = React.createContext<string | undefined>(undefined);

const textVariants = cva('text-base text-foreground web:select-text', {
  variants: {
    variant: {
      default: '',
      title1: 'text-5xl font-bold', // iOS Large Title - 34pt
      title2: 'text-4xl font-bold', // iOS Title 1 - 28pt
      title3: 'text-3xl font-bold', // iOS Title 2 - 22pt
      title4: 'text-2xl font-bold', // iOS Title 3 - 20pt
      heading: 'text-xl font-semibold', // iOS Headline - 17pt
      body: 'text-lg', // iOS Body - 17pt
      callout: 'text-lg font-medium', // iOS Callout - 16pt
      subhead: 'text-base font-medium', // iOS Subheadline - 15pt
      footnote: 'text-base', // iOS Footnote - 13pt
      caption1: 'text-sm font-medium', // iOS Caption 1 - 12pt
      caption2: 'text-sm', // iOS Caption 2 - 11pt
      large: 'text-xl font-semibold',
      small: 'text-base font-medium leading-none',
      muted: 'text-base text-muted-foreground',
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
}

const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ className, variant, style, enableRTL = true, ...props }, ref) => {
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

    // Apply RTL text alignment for Arabic when enableRTL is true
    const rtlStyle =
      enableRTL && locale === 'ar' ? { textAlign: 'right' as const } : {};
    const combinedStyle = [style, rtlStyle]; // RTL style applied last to take precedence

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
export type { TextProps };
