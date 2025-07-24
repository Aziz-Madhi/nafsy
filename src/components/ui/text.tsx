import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cn } from '~/lib/cn';
import { useTranslation } from '~/hooks/useTranslation';

// Keep this context for backward compatibility with button, card, tooltip
const TextClassContext = React.createContext<string | undefined>(undefined);

const textVariants = cva(
  'text-base text-foreground web:select-text font-crimson',
  {
    variants: {
      variant: {
        default: '',
        // iOS Typography Scale - Aligned with iOS HID Guidelines with CrimsonPro
        title1: 'text-4xl font-crimson-bold', // iOS Large Title - 28pt
        title2: 'text-3xl font-crimson-bold', // iOS Title 1 - 24pt
        title3: 'text-2xl font-crimson-bold', // iOS Title 2 - 20pt
        title4: 'text-xl font-crimson-bold', // iOS Title 3 - 18pt (screen titles)
        heading: 'text-lg font-crimson-bold', // iOS Headline - 17pt (nav titles)
        body: 'text-base font-crimson', // iOS Body - 16pt (primary text)
        callout: 'text-base font-crimson-bold', // iOS Callout - 16pt (emphasized body)
        subhead: 'text-sm font-crimson', // iOS Subheadline - 14pt (list descriptions)
        footnote: 'text-sm font-crimson', // iOS Footnote - 13pt (tertiary text)
        caption1: 'text-xs font-crimson', // iOS Caption 1 - 12pt (labels)
        caption2: 'text-xs font-crimson', // iOS Caption 2 - 11pt (smallest text)
        // Legacy variants for backward compatibility
        large: 'text-xl font-crimson-bold',
        small: 'text-sm font-crimson leading-none',
        muted: 'text-sm text-muted-foreground font-crimson',
        // Add italic variant for emphasis
        italic: 'text-base font-crimson-italic',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

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
