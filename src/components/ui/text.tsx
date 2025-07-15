import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cn } from '~/lib/cn';

// Keep this context for backward compatibility with button, card, tooltip
const TextClassContext = React.createContext<string | undefined>(undefined);

const textVariants = cva('text-base text-foreground web:select-text', {
  variants: {
    variant: {
      default: '',
      title1: 'text-4xl font-bold',
      title2: 'text-3xl font-bold',
      title3: 'text-2xl font-bold',
      title4: 'text-xl font-bold',
      heading: 'text-lg font-semibold',
      body: 'text-base',
      callout: 'text-base font-medium',
      subhead: 'text-sm font-medium',
      footnote: 'text-sm',
      caption1: 'text-xs font-medium',
      caption2: 'text-xs',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface TextProps
  extends React.ComponentPropsWithoutRef<typeof RNText>,
    VariantProps<typeof textVariants> {}

const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ className, variant, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext);
    return (
      <RNText
        className={cn(textVariants({ variant }), textClass, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Text.displayName = 'Text';

export { Text, textVariants, TextClassContext };
export type { TextProps };
