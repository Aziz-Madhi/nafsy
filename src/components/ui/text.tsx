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
        // iOS Typography Scale - Aligned with iOS HID Guidelines with CrimsonPro (Enhanced for better readability)
        title1: 'text-5xl font-crimson-bold', // iOS Large Title - 32pt (enhanced from 28pt)
        title2: 'text-4xl font-crimson-bold', // iOS Title 1 - 28pt (enhanced from 24pt)
        title3: 'text-3xl font-crimson-bold', // iOS Title 2 - 24pt (enhanced from 20pt)
        title4: 'text-2xl font-crimson-bold', // iOS Title 3 - 20pt (enhanced from 18pt)
        heading: 'text-xl font-crimson-bold', // iOS Headline - 18pt (enhanced from 17pt)
        body: 'text-lg font-crimson', // iOS Body - 17pt (enhanced from 16pt)
        callout: 'text-lg font-crimson', // iOS Callout - 17pt (enhanced from 16pt)
        subhead: 'text-base font-crimson', // iOS Subheadline - 15pt (enhanced from 14pt)
        footnote: 'text-sm font-crimson', // iOS Footnote - 14pt (enhanced from 13pt)
        caption1: 'text-sm font-crimson', // iOS Caption 1 - 13pt (enhanced from 12pt)
        caption2: 'text-xs font-crimson', // iOS Caption 2 - 12pt (enhanced from 11pt)
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
