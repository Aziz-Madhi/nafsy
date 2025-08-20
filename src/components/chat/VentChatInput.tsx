/**
 * VentChatInput Component
 * Chat input styled for the vent chat overlay with dark theme
 * Maintains identical positioning to UnifiedChatInput for seamless transition
 */

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
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';

interface VentChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export function VentChatInput({
  onSendMessage,
  isLoading = false,
}: VentChatInputProps) {
  const [message, setMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const hasText = !!message.trim();

  const handleSend = useCallback(async () => {
    if (message.trim() && !isLoading) {
      await impactAsync(ImpactFeedbackStyle.Light);
      const text = message.trim();
      setMessage('');
      Keyboard.dismiss();
      await onSendMessage(text);
    }
  }, [message, isLoading, onSendMessage]);

  // When the vent chat loses focus, blur and dismiss
  useFocusEffect(
    useCallback(() => {
      return () => {
        inputRef.current?.blur();
        Keyboard.dismiss();
      };
    }, [])
  );

  return (
    <View style={{ position: 'absolute', bottom: -55, left: 0, right: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Dark themed container matching UnifiedChatInput structure */}
        <View
          className="rounded-t-3xl"
          style={{
            backgroundColor: 'rgba(20, 20, 20, 0.95)', // Dark more visible background
            paddingBottom: 65, // Same as UnifiedChatInput for consistent positioning
          }}
        >
          {/* Input section */}
          <View className="px-4 py-2">
            <View className="flex-row items-center">
              <TextInput
                ref={inputRef}
                value={message}
                onChangeText={setMessage}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={
                  t('chat.vent.placeholder') || 'Release your thoughts...'
                }
                placeholderTextColor="rgba(255,255,255,0.6)"
                className="flex-1 text-white text-base px-4 py-3"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!isLoading}
              />

              {/* Send button */}
              <Pressable
                onPress={handleSend}
                disabled={!hasText || isLoading}
                className={cn('mr-2 rounded-full p-2.5')}
                style={({ pressed }) => ({
                  backgroundColor: hasText && !isLoading
                    ? 'rgba(255,255,255,0.28)'
                    : 'rgba(255,255,255,0.10)',
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <SymbolView
                  name="arrow.up.circle"
                  size={20}
                  tintColor={
                    hasText && !isLoading
                      ? 'rgba(255,255,255,0.95)'
                      : 'rgba(255,255,255,0.6)'
                  }
                />
              </Pressable>
            </View>

            {/* Subtle divider */}
            <View
              className="h-[0.5px] mt-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            />
          </View>

          {/* Mock navigation area to maintain identical positioning */}
          <View className="h-16" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
