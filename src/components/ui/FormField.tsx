import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import { useAutoTextAlignment } from '~/lib/rtl-utils';

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
  const textAlign = useAutoTextAlignment();

  return (
    <View className={cn('gap-2', containerClassName)}>
      <Text
        className={cn(
          'text-sm font-medium text-muted-foreground ml-1',
          labelClassName
        )}
      >
        {label}
      </Text>
      <TextInput
        className={cn(
          'rounded-xl px-4 py-3.5 text-base text-foreground',
          'bg-gray-50/50 dark:bg-white/5',
          'border border-gray-200/50 dark:border-white/10',
          'focus:border-primary/50 focus:bg-white dark:focus:bg-white/10',
          error ? 'border-destructive bg-destructive/5' : '',
          inputClassName,
          className
        )}
        style={{
          textAlign,
          fontSize: 16,
        }}
        placeholderTextColor="#9CA3AF"
        {...inputProps}
      />
      {error && <Text className="text-sm text-destructive ml-1">{error}</Text>}
    </View>
  );
}
