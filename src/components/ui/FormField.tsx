import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import { getAutoTextAlignment } from '~/lib/rtl-utils';

interface FormFieldProps extends Omit<TextInputProps, 'className'> {
  label: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  containerClassName?: string;
}

export function FormField({
  label,
  error,
  className,
  labelClassName,
  inputClassName,
  containerClassName,
  ...inputProps
}: FormFieldProps) {
  const textAlign = getAutoTextAlignment();

  return (
    <View className={cn('gap-2', containerClassName)}>
      <Text
        className={cn('text-sm text-muted-foreground', labelClassName)}
        // Text component now handles alignment automatically, but we can still override if needed
      >
        {label}
      </Text>
      <TextInput
        className={cn(
          'border rounded-2xl px-4 py-3 text-base text-foreground bg-input',
          error ? 'border-destructive' : 'border-border',
          inputClassName,
          className
        )}
        style={{ textAlign }}
        placeholderTextColor="#9CA3AF"
        {...inputProps}
      />
      {error && <Text className="text-sm text-destructive">{error}</Text>}
    </View>
  );
}
