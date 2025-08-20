import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';

interface ChatInputWithNavConnectionProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInputWithNavConnection({
  onSendMessage,
  placeholder,
  disabled = false,
}: ChatInputWithNavConnectionProps) {
  const [message, setMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const hasText = !!message.trim();

  const handleSend = useCallback(async () => {
    if (message.trim() && !disabled) {
      await impactAsync(ImpactFeedbackStyle.Medium);
      onSendMessage(message.trim());
      setMessage('');
    }
  }, [message, disabled, onSendMessage]);

  // When the chat screen loses focus (e.g., switching tabs), blur and dismiss
  useFocusEffect(
    useCallback(() => {
      return () => {
        inputRef.current?.blur();
        Keyboard.dismiss();
      };
    }, [])
  );

  return (
    <View className="absolute bottom-0 left-0 right-0">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ paddingBottom: insets.bottom }} className="p-4">
          {/* Glass-like input container matching VentChat */}
          <View
            className={cn(
              'flex-row items-center rounded-2xl px-4 py-3',
              'bg-white/5 dark:bg-white/5 border',
              isInputFocused
                ? 'border-primary/30 dark:border-primary/30'
                : 'border-white/10 dark:border-white/10'
            )}
          >
            <TextInput
              ref={inputRef}
              value={message}
              onChangeText={setMessage}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={
                placeholder ||
                t('chat.typingPlaceholder') ||
                'Type a message...'
              }
              placeholderTextColor={colors.mutedForeground + '80'}
              className="flex-1 text-foreground text-base"
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!disabled}
            />

            {/* Send button matching VentChat style */}
            <Pressable
              onPress={handleSend}
              disabled={!hasText || disabled}
              className={cn(
                'ml-3 rounded-full p-2.5',
                hasText && !disabled
                  ? 'bg-primary/20 dark:bg-primary/20'
                  : 'bg-white/5 dark:bg-white/5'
              )}
            >
              <SymbolView
                name="arrow.up.circle.fill"
                size={20}
                tintColor={
                  hasText && !disabled
                    ? colors.primary
                    : colors.mutedForeground + '60'
                }
              />
            </Pressable>
          </View>

          {/* Navigation bar spacing */}
          <View className="h-20" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
